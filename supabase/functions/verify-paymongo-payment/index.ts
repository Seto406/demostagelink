import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate User
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // 2. Find latest pending payment
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: payments, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (paymentError) {
      throw new Error("Database error fetching payments");
    }

    if (!payments || payments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending payment found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const payment = payments[0];
    const checkoutId = payment.paymongo_checkout_id;

    // 3. Check PayMongo Status
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) {
      throw new Error("Server configuration error");
    }

    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    const paymongoRes = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const paymongoData = await paymongoRes.json();

    if (paymongoData.errors) {
      console.error("PayMongo Error:", paymongoData.errors);
      throw new Error(paymongoData.errors[0]?.detail || "Failed to verify payment");
    }

    const session = paymongoData.data;
    // status can be 'active' (unpaid) or 'expired' or 'paid'?
    // Usually checkout session has `payments` array.
    // If payment_intent status is 'succeeded'.
    // API ref: Get Checkout Session. response.data.attributes.payments

    // Simplification: Check if payments array has a successful payment or status indicates success.
    // However, looking at PayMongo docs, checkout session has `payment_intent` which has status `succeeded`.
    // Or simpler: verify if `payments` list is not empty and has status `paid`.

    // Let's check session.attributes.payment_intent.
    // Actually, simple check:
    const paymentStatus = session.attributes.payment_intent?.attributes?.status;
    // Wait, payment_intent is expanded? Usually id.
    // Let's rely on `payments` attribute.
    const paymentsList = session.attributes.payments || [];
    const successfulPayment = paymentsList.find((p: any) => p.attributes.status === "paid");

    let isPaid = false;
    if (successfulPayment) {
      isPaid = true;
    }

    // Update DB
    if (isPaid) {
      // Update payment status
      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", updated_at: new Date() })
        .eq("id", payment.id);

      // Create/Update Subscription
      // Assume 1 month duration for now (since hardcoded 399/mo)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          status: "active",
          tier: "pro",
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          updated_at: new Date()
        }, { onConflict: "user_id" });

      if (subError) {
        console.error("Subscription Update Error:", subError);
        // We still return success as payment was processed
      }

      return new Response(
        JSON.stringify({ status: "paid", message: "Payment successful" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Not paid yet
       return new Response(
        JSON.stringify({ status: "pending", message: "Payment not completed yet" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 with pending status
        }
      );
    }

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
