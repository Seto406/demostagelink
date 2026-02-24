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
        const { data: profile, error } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", finalUserId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            throw new Error("Failed to verify user profile: " + error.message);
        }

        if (!profile) {
            console.warn(`User ${finalUserId} provided but no profile found. Treating as Guest Checkout.`);
            finalUserId = null;
        }
    }

    // Convert amount to centavos (input is in Pesos)
    const amountInCents = Math.round(Number(amount) * 100);
    console.log(`Creating session for user ${finalUserId || "GUEST"}, show ${show_id}, amount ${amount} PHP -> ${amountInCents} cents`);

    // 1. Create Payment Record (Initialized)
    // We do this BEFORE calling PayMongo so we can pass the payment ID in the success_url
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: finalUserId, // can be null
        paymongo_checkout_id: `PENDING_${crypto.randomUUID()}`, // Temporary ID to satisfy NOT NULL
        amount: amountInCents,
        status: "initialized",
        description: `Ticket for show ${show_id}`,
      })
      .select("id")
      .single();

    if (dbError) {
        console.error("Payment Insert Error", dbError);
        throw new Error("Failed to initialize payment record: " + dbError.message);
    }

    const paymentRef = paymentRecord.id;

    // Get Secret Key
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) throw new Error("Missing PAYMONGO_SECRET_KEY");

    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    // Determine Base URL
    const envFrontendUrl = Deno.env.get("FRONTEND_URL");
    if (!envFrontendUrl) {
      console.warn("⚠️ WARNING: FRONTEND_URL is not set in environment variables. Defaulting to https://www.stagelink.show");
    }
    const frontendUrl = envFrontendUrl ?? "https://www.stagelink.show";

    // Prepare Metadata
    const metadata: any = {
        show_id,
        type: "ticket",
        payment_id: paymentRef // Store our internal ID in metadata too, just in case
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
          success_url: `${frontendUrl}/payment/success?ref=${paymentRef}`,
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
      // If PayMongo fails, we might want to mark the payment as failed or delete it?
      // For now, leave it as 'initialized' (it will be abandoned)
      throw new Error(data.errors[0].detail);
    }

    const checkoutSession = data.data;
    const checkoutUrl = checkoutSession.attributes.checkout_url;
    const checkoutId = checkoutSession.id;

    // 2. Update Payment Record with Real Checkout ID
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        paymongo_checkout_id: checkoutId,
        status: "pending"
      })
      .eq("id", paymentRef);

    if (updateError) {
       console.error("Failed to update payment with PayMongo ID:", updateError);
       // We log it but don't fail the request because the user can still pay.
       // The webhook might fail to find the payment if we don't update it?
       // Actually, webhook looks up by `paymongo_checkout_id`.
       // If this update fails, webhook won't find the payment!
       // This is critical.
       throw new Error("Database error updating payment reference");
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
