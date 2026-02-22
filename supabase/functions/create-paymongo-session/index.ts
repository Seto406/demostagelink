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
    const { show_id, amount, user_id } = await req.json();

    if (!show_id || !amount || !user_id) {
      throw new Error("Missing required fields: show_id, amount, or user_id");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get Secret Key
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) throw new Error("Missing PAYMONGO_SECRET_KEY");

    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    // Convert amount to centavos (input is in Pesos)
    const amountInCents = Math.round(Number(amount) * 100);
    console.log(`Creating session for user ${user_id}, show ${show_id}, amount ${amount} PHP -> ${amountInCents} cents`);

    // Determine Base URL
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://www.stagelink.show";

    // Payload for PayMongo
    const payload = {
      data: {
        attributes: {
          line_items: [
            {
              currency: "PHP",
              amount: amountInCents, // Amount in cents
              description: "Ticket Purchase",
              name: "Show Ticket",
              quantity: 1,
            },
          ],
          payment_method_types: ["qrph", "gcash", "paymaya"],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: `${frontendUrl}/payment/success`,
          cancel_url: `${frontendUrl}/payment/cancel`,
          metadata: {
            show_id,
            user_id, // Auth ID passed directly
            type: "ticket"
          },
        },
      },
    };

    // Call PayMongo
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].detail);
    }

    const checkoutSession = data.data;
    const checkoutUrl = checkoutSession.attributes.checkout_url;
    const checkoutId = checkoutSession.id;

    // Create Payment Record
    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user_id,
        paymongo_checkout_id: checkoutId,
        amount: amountInCents,
        status: "pending",
        description: `Ticket for show ${show_id}`,
      });

    if (dbError) {
        console.error("Payment Insert Error", dbError);
        throw new Error("Failed to initialize payment record: " + dbError.message);
    }

    return new Response(JSON.stringify({ checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
     console.error("Error creating session:", error);
     return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
