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
    const { show_id, amount, user_id: requestUserId } = await req.json();

    if (!show_id || !amount) {
      throw new Error("Missing required fields: show_id or amount");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let finalUserId = requestUserId;

    // Validate user_id if provided
    if (finalUserId) {
        // Check if the user has a profile. If not, treat as guest.
        // We check profiles table because payments.user_id references profiles(user_id).
        const { data: profile, error } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", finalUserId)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (!profile) {
            console.warn(`User ${finalUserId} provided but no profile found. Treating as Guest Checkout.`);
            finalUserId = null;
        }
    }

    // Get Secret Key
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) throw new Error("Missing PAYMONGO_SECRET_KEY");

    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    // Convert amount to centavos (input is in Pesos)
    const amountInCents = Math.round(Number(amount) * 100);
    console.log(`Creating session for user ${finalUserId || "GUEST"}, show ${show_id}, amount ${amount} PHP -> ${amountInCents} cents`);

    // Determine Base URL
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://www.stagelink.show";

    // Prepare Metadata
    const metadata: any = {
        show_id,
        type: "ticket"
    };
    if (finalUserId) {
        metadata.user_id = finalUserId;
    } else {
        metadata.is_guest = "true";
    }

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
          metadata: metadata,
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
    // Note: user_id can be null now (thanks to migration)
    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: finalUserId, // can be null
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
