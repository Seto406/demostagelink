import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { show_id, user_id, proof_url, guest_email, guest_name, slot_id, slot_label } = await req.json();

    if (!show_id) throw new Error("Missing show_id");
    if (!proof_url) throw new Error("Missing proof of payment");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch Show & Calculate Fee
    const { data: show, error: showError } = await supabaseAdmin
        .from("shows")
        .select(`
            id, title, price, reservation_fee, producer_id, status, seo_metadata,
            profiles:producer_id ( niche )
        `)
        .eq("id", show_id)
        .single();

    if (showError || !show) throw new Error("Show not found");
    if (show.status !== 'approved') throw new Error("Show not available");

    const scheduleSlots = Array.isArray((show.seo_metadata as Record<string, unknown> | null)?.schedule)
      ? (((show.seo_metadata as Record<string, unknown>).schedule as Record<string, unknown>[]))
      : [];

    if (scheduleSlots.length > 1 && !slot_id) {
      throw new Error("A time slot is required for this show.");
    }

    if (slot_id) {
      const targetSlot = scheduleSlots.find((slot) => slot?.id === slot_id);
      if (!targetSlot) throw new Error("Selected slot no longer exists.");

      const seatLimit = typeof targetSlot.seat_limit === "number" && targetSlot.seat_limit > 0
        ? targetSlot.seat_limit
        : 50;

      const { count: reservedCount, error: slotCountError } = await supabaseAdmin
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("show_id", show.id)
        .eq("slot_id", slot_id)
        .in("status", ["pending", "confirmed"]);

      if (slotCountError) throw slotCountError;
      if ((reservedCount || 0) >= seatLimit) {
        throw new Error("Selected slot is already sold out.");
      }
    }

    let fee = 0;
    if (show.reservation_fee) {
        fee = Number(show.reservation_fee);
    } else {
        const producerProfile = Array.isArray(show.profiles) ? show.profiles[0] : show.profiles;
        const niche = producerProfile?.niche;
        const showPrice = Number(show.price || 0);
        if (niche === 'university' || niche === 'local') fee = 25;
        else fee = showPrice * 0.10;
    }
    // Min 20, Max Show Price
    fee = Math.max(20, fee);
    const showPrice = Number(show.price || 0);
    if (showPrice > 0) {
        fee = Math.min(fee, showPrice);
    }
    const amountInCents = Math.round(fee * 100);

    // 2. Lookup Profile ID if user is logged in
    let profileId = null;
    if (user_id) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", user_id)
            .maybeSingle();
        if (profile) profileId = profile.id;
    }

    // 3. Insert Payment
    // Note: payments.user_id references profiles(user_id) which matches auth.uid()
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user_id || null,
        amount: amountInCents,
        status: "pending", // Manual payment starts as pending review
        payment_method: "manual",
        proof_of_payment_url: proof_url,
        description: `Manual Ticket for ${show.title}`,
        customer_email: guest_email,
        customer_name: guest_name
      })
      .select()
      .single();

    if (paymentError) {
        console.error("Payment Insert Error:", paymentError);
        throw paymentError;
    }

    // 4. Insert Ticket (Pending)
    // Note: tickets.user_id references profiles(id)
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: profileId, // Use Profile ID, or null for guest
        show_id: show.id,
        status: "pending", // Pending approval
        payment_id: payment.id,
        customer_email: guest_email,
        customer_name: guest_name,
        slot_id: slot_id || null,
        slot_label: slot_label || null,
      })
      .select()
      .single();

    if (ticketError) {
        console.error("Ticket Insert Error:", ticketError);
        throw ticketError;
    }

    // 4. Send Email to Admin
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
        // Notify Admin
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "StageLink <notifications@stagelink.show>",
                to: ["hello@stagelink.show"], // Platform Admin
                subject: `Review Payment: ${show.title}`,
                html: `
                    <h2>New Manual Payment Review</h2>
                    <p>A new payment of <strong>PHP ${fee}</strong> for <strong>${show.title}</strong> has been submitted.</p>
                    <p><strong>User:</strong> ${guest_name || user_id || "Guest"} (${guest_email || "No email"})</p>
                    <p><strong>Proof of Payment:</strong> <a href="${proof_url}">View Image</a></p>
                    <br/>
                    <a href="https://www.stagelink.show/admin" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Admin Panel</a>
                `
            })
        });
    }

    return new Response(JSON.stringify({ success: true, payment_id: payment.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
    });

  } catch (error) {
    console.error("Create Manual Payment Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
    });
  }
});
