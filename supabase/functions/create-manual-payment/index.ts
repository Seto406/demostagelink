import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { show_id, user_id, proof_url, guest_email, guest_name } = await req.json();

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
            id, title, price, reservation_fee, producer_id, status,
            profiles:producer_id ( niche )
        `)
        .eq("id", show_id)
        .single();

    if (showError || !show) throw new Error("Show not found");
    if (show.status !== 'approved') throw new Error("Show not available");

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

    // 2. Insert Payment
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

    if (paymentError) throw paymentError;

    // 3. Insert Ticket (Pending)
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: user_id || null,
        show_id: show.id,
        status: "pending", // Pending approval
        payment_id: payment.id,
        customer_email: guest_email,
        customer_name: guest_name
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

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
