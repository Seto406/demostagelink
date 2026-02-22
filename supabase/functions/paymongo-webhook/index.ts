import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil: (promise: Promise<any>) => void };

function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
}

async function processWebhook(
  checkoutId: string,
  metadata: any,
  paymongoPaymentId: string | undefined,
  supabaseAdmin: any
) {
  try {
    console.log(`[Background] Processing paid webhook for checkout ${checkoutId}`);

    // 6. Idempotency Check: Check if a ticket already exists for this payment.
    const { data: existingPaymentWithTicket, error: lookupError } = await supabaseAdmin
        .from("payments")
        .select("id, status, tickets(id)")
        .eq("paymongo_checkout_id", checkoutId)
        .maybeSingle();

    if (lookupError) {
        console.error("[Background] Error looking up payment:", lookupError);
        return;
    }

    // Check if tickets array is populated
    const existingTickets = existingPaymentWithTicket?.tickets;
    if (existingTickets && Array.isArray(existingTickets) && existingTickets.length > 0) {
         console.log("[Background] Ticket already issued. Skipping.");
         return;
    }

    const showId = metadata.show_id;
    const authUserId = metadata.user_id; // Auth ID

    if (!showId || !authUserId) {
        console.error("[Background] Missing metadata for ticket creation. Cannot proceed.");
        return;
    }

    // 7. Atomic-ish Update: Update Payment Status FIRST
    const updatePayload: any = {
        status: "paid",
        updated_at: new Date().toISOString()
    };

    if (paymongoPaymentId) {
        updatePayload.paymongo_payment_id = paymongoPaymentId;
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update(updatePayload)
      .eq("paymongo_checkout_id", checkoutId)
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("[Background] Payment update failed or record not found:", paymentError);
      return;
    }

    // 8. Look up Profile ID from Auth ID
    console.log(`[Background] Looking up profile for Auth ID: ${authUserId}`);
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId)
        .single();

    if (profileError || !profile) {
        console.error("[Background] Profile not found for user:", authUserId);
        return;
    }
    console.log(`[Background] Found Profile ID: ${profile.id}`);

    // 9. Create Ticket
    console.log(`[Background] Creating ticket for Profile ID ${profile.id}, Show ID ${showId}`);
    const { error: ticketError } = await supabaseAdmin
        .from("tickets")
        .insert({
            user_id: profile.id, // Using Profile ID
            show_id: showId,
            status: "confirmed",
            payment_id: payment.id,
        });

    if (ticketError) {
        console.error("[Background] Ticket creation failed:", ticketError);
        return;
    }

    console.log("[Background] Ticket created successfully.");

    // 10. Notify Producer
    try {
        // Fetch Show Details (Producer ID and Title)
        const { data: show, error: showError } = await supabaseAdmin
            .from("shows")
            .select("title, producer_id")
            .eq("id", showId)
            .single();

        if (showError || !show) {
             console.error("[Background] Failed to fetch show details for notification:", showError);
        } else {
             const producerId = show.producer_id;
             const showTitle = show.title;

             // Create Notification
             const { error: notifError } = await supabaseAdmin
                .from("notifications")
                .insert({
                    user_id: producerId,
                    actor_id: profile.id, // Buyer
                    type: "ticket_purchase",
                    title: "New Reservation!",
                    message: `A seat has been secured for ${showTitle}.`,
                    link: "/dashboard",
                    read: false
                });

             if (notifError) {
                 console.error("[Background] Failed to create producer notification:", notifError);
             } else {
                 console.log(`[Background] Notification sent to producer ${producerId}`);
             }

             // Create Notification for Buyer
             const { error: buyerNotifError } = await supabaseAdmin
                .from("notifications")
                .insert({
                    user_id: profile.id, // Buyer
                    actor_id: producerId, // Producer
                    type: "ticket_purchase",
                    title: "Seat Secured!",
                    message: `Your pass for ${showTitle} is now in your profile.`,
                    link: "/profile",
                    read: false
                });

             if (buyerNotifError) {
                 console.error("[Background] Failed to create buyer notification:", buyerNotifError);
             } else {
                 console.log(`[Background] Notification sent to buyer ${profile.id}`);
             }
        }

    } catch (notifErr) {
        console.error("[Background] Error in notification block:", notifErr);
    }
  } catch (err) {
    console.error("[Background] Unexpected error in background process:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signatureHeader = req.headers.get("paymongo-signature");
    const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");

    if (!secret) {
      console.error("PAYMONGO_WEBHOOK_SECRET is not set");
      throw new Error("Server configuration error");
    }

    if (!signatureHeader) {
      throw new Error("Missing signature header");
    }

    // 1. Get raw body for verification
    const rawBody = await req.text();

    // 2. Parse signature header
    const signatureParts = signatureHeader.split(",");
    let timestamp = "";
    let testSignature = "";
    let liveSignature = "";

    for (const part of signatureParts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = value;
      else if (key === "te") testSignature = value;
      else if (key === "li") liveSignature = value;
    }

    const signatureToVerify = liveSignature || testSignature;

    if (!timestamp || !signatureToVerify) {
      throw new Error("Invalid signature header format");
    }

    // 3. Construct signed payload
    const signedPayload = `${timestamp}.${rawBody}`;

    // 4. Compute HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToUint8Array(signatureToVerify),
      encoder.encode(signedPayload)
    );

    if (!isValid) {
      console.error("Invalid Webhook Signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Parse JSON
    const payload = JSON.parse(rawBody);
    const eventType = payload.data.attributes.type;

    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const checkoutId = payload.data.attributes.data.id;
    const sessionAttributes = payload.data.attributes.data.attributes;
    const metadata = sessionAttributes.metadata || {};

    // Extract PayMongo Payment ID
    const paymongoPaymentId = sessionAttributes.payments?.[0]?.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use EdgeRuntime.waitUntil to prevent timeout
    const processingPromise = processWebhook(checkoutId, metadata, paymongoPaymentId, supabaseAdmin);

    if (typeof EdgeRuntime !== "undefined") {
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      // Fallback for local testing: await it so we can see logs/errors,
      // even though it mimics the "slow" behavior locally.
      await processingPromise;
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
