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
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { show_id, user_id: requestUserId } = body;

    if (!show_id) {
      throw new Error("Missing required field: show_id");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch Show Details & Producer Niche
    // Using !producer_id hint if the relation is ambiguous, or standard join if straightforward.
    // Based on CheckoutPage, it seems explicit.
    const { data: show, error: showError } = await supabaseAdmin
        .from("shows")
        .select(`
            id,
            title,
            price,
            reservation_fee,
            producer_id,
            status,
            profiles:producer_id ( niche )
        `)
        .eq("id", show_id)
        .single();

    if (showError || !show) {
        console.error("Error fetching show:", showError);
        throw new Error("Show not found or invalid.");
    }

    if (show.status !== "approved") {
      throw new Error("Show is not available for purchase.");
    }

    // Server-Side Price Calculation
    let fee = 0;

    if (show.reservation_fee) {
        fee = Number(show.reservation_fee);
    } else {
        // Access nested profile data safely
        // The type returned for profiles might be an array or object depending on relation type (one-to-one or one-to-many)
        // Since producer_id is a foreign key to profiles.id (one-to-one/many-to-one), it should be a single object.
        const producerProfile = Array.isArray(show.profiles) ? show.profiles[0] : show.profiles;
        const niche = producerProfile?.niche;
        const showPrice = Number(show.price || 0);

        if (niche === 'university' || niche === 'local') {
            fee = 25;
        } else {
            fee = showPrice * 0.10;
        }
    }

    // Enforce Minimum
    fee = Math.max(20, fee);
    // Ensure reservation fee does not exceed ticket price
    fee = Math.min(fee, showPrice);

    const amountInCents = Math.round(fee * 100);

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

    console.log(`Creating session for user ${finalUserId || "GUEST"}, show ${show.title}, amount ${fee} PHP -> ${amountInCents} cents`);

    // 1. Create Payment Record (Initialized)
    // We do this BEFORE calling PayMongo so we can pass the payment ID in the success_url
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: finalUserId, // can be null
        paymongo_checkout_id: `PENDING_${crypto.randomUUID()}`, // Temporary ID to satisfy NOT NULL
        amount: amountInCents,
        status: "initialized",
        description: `Ticket for show ${show.title}`,
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
              description: `Ticket for ${show.title}`,
              name: "Show Ticket",
              quantity: 1,
            },
          ],
          payment_method_types: ["qrph", "gcash", "paymaya", "card", "grab_pay"], // Added card/grab_pay per memory
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
