import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventType = payload.data.attributes.type;
    const resourceType = payload.data.attributes.data.type;

    console.log(`Received Webhook: ${eventType}`);

    // We only care about successful payments from checkout sessions
    // We strictly check for 'checkout_session.payment.paid' to ensure we get the Checkout Session object
    // which contains the 'id' (cs_...) that matches our 'paymongo_checkout_id' in the database.
    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const session = payload.data.attributes.data.attributes;
    const metadata = session.metadata || {};
    const checkoutId = payload.data.attributes.data.id;

    // Use Service Role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the payment record using checkout ID
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paymongo_checkout_id", checkoutId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found for checkout ID:", checkoutId);
      // We return 200 to acknowledge webhook even if we can't process it (to prevent retries)
      return new Response(JSON.stringify({ message: "Payment record not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update Payment Status
    await supabaseAdmin
      .from("payments")
      .update({ status: "paid", updated_at: new Date() })
      .eq("id", payment.id);

    const type = metadata.type || "subscription"; // Default to subscription if missing
    const userId = payment.user_id;

    // Fetch user (needed for some logic, but we have user_id from payment)
    // Actually we need user_id from payment table which we just fetched.

    if (type === "subscription") {
       // Update Subscription
       const startDate = new Date();
       const endDate = new Date();
       endDate.setMonth(endDate.getMonth() + 1);

       const { error: subError } = await supabaseAdmin
         .from("subscriptions")
         .upsert(
           {
             user_id: userId,
             status: "active",
             tier: "pro",
             current_period_start: startDate.toISOString(),
             current_period_end: endDate.toISOString(),
             updated_at: new Date(),
           },
           { onConflict: "user_id" }
         );

        if (subError) console.error("Subscription update failed:", subError);

    } else if (type === "featured_show") {
       const showId = metadata.show_id;
       if (showId) {
         const { error: showError } = await supabaseAdmin
           .from("shows")
           .update({ is_featured: true })
           .eq("id", showId);

         if (showError) console.error("Show feature update failed:", showError);
       }

    } else if (type === "ticket") {
        const showId = metadata.show_id;
        if (showId) {
          const { error: ticketError } = await supabaseAdmin
            .from("tickets")
            .insert({
              user_id: userId,
              show_id: showId,
              status: "confirmed",
              payment_id: payment.id,
            });

          if (ticketError) {
            console.error("Ticket Insert Error:", ticketError);
          } else {
            // Trigger Email (fire and forget)
            supabaseAdmin.functions.invoke("send-ticket-confirmation", {
              body: { user_id: userId, show_id: showId },
            });
          }
        }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
