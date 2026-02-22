import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayMongoPayment {
  attributes: {
    status: string;
    [key: string]: unknown;
  };
}

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

    // 2. Find latest payment
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch Profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to find user profile");
    }

    const { data: payments, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (paymentError) {
      throw new Error("Database error fetching payments");
    }

    if (!payments || payments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No payment found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const payment = payments[0];

    if (payment.status === "paid") {
      const type = payment.description?.startsWith("Ticket") ? "ticket" : "subscription";
      return new Response(
        JSON.stringify({ status: "paid", message: "Payment successful", type }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

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

    // Simplification: Check if payments array has a successful payment or status indicates success.
    const paymentsList = session.attributes.payments || [];
    const successfulPayment = paymentsList.find((p: PayMongoPayment) => p.attributes.status === "paid");

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

      // Check metadata for payment type
      const metadata = session.attributes.metadata || {};
      const paymentType = metadata.type || "subscription"; // Default to subscription

      if (paymentType === "ticket") {
        const showId = metadata.show_id;
        if (showId) {
          // Insert Ticket
          const { error: ticketError } = await supabaseAdmin
            .from("tickets")
            .insert({
              user_id: profile.id,
              show_id: showId,
              status: "confirmed",
              payment_id: payment.id,
            });

          if (ticketError) {
            console.error("Ticket Insert Error:", ticketError);
          } else {
            // Trigger Email
            await supabaseAdmin.functions.invoke("send-ticket-confirmation", {
              body: { user_id: user.id, show_id: showId },
            });
          }
        }
      } else {
        // Create/Update Subscription
        // Assume 1 month duration for now (since hardcoded 399/mo)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              status: "active",
              tier: "pro",
              current_period_start: startDate.toISOString(),
              current_period_end: endDate.toISOString(),
              updated_at: new Date(),
            },
            { onConflict: "user_id" }
          );

        if (subError) {
          console.error("Subscription Update Error:", subError);
          // We still return success as payment was processed
        }
      }

      return new Response(
        JSON.stringify({ status: "paid", message: "Payment successful", type: paymentType }),
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
