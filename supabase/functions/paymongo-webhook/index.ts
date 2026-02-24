import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

interface WebhookMetadata {
    payment_id?: string;
    show_id?: string;
    user_id?: string;
    type?: string;
    [key: string]: unknown;
}

interface WebhookBilling {
    email?: string;
    name?: string;
    phone?: string;
    address?: unknown;
}

interface PaymentUpdatePayload {
    status: string;
    updated_at: string;
    customer_email?: string;
    customer_name?: string;
    paymongo_payment_id?: string;
    paymongo_checkout_id?: string;
}

interface TicketInsertPayload {
    show_id: string;
    status: string;
    payment_id: string;
    user_id: string | null;
    customer_email?: string;
    customer_name?: string;
}

function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
}

async function processWebhook(
  checkoutId: string | null,
  paymongoPaymentId: string | null,
  metadata: WebhookMetadata,
  billing: WebhookBilling,
  supabaseAdmin: SupabaseClient
) {
  try {
    const customerEmail = billing?.email;
    const customerName = billing?.name;
    const paymentRefId = metadata?.payment_id;

    console.log(`[Background] Processing paid webhook. Checkout ID: ${checkoutId}, Payment ID: ${paymongoPaymentId}, Ref ID: ${paymentRefId}`);

    // 6. Identify Payment Record
    // Priority:
    // 1. metadata.payment_id (Our internal UUID)
    // 2. checkoutId (PayMongo Checkout Session ID)

    let query = supabaseAdmin
        .from("payments")
        .select("id, status, user_id, tickets(id)");

    if (paymentRefId) {
        query = query.eq("id", paymentRefId);
    } else if (checkoutId) {
        query = query.eq("paymongo_checkout_id", checkoutId);
    } else {
        console.error("[Background] Unable to identify payment record. Missing payment_id in metadata and checkout_id.");
        return;
    }

    const { data: existingPaymentWithTicket, error: lookupError } = await query.maybeSingle();

    if (lookupError) {
        console.error("[Background] Error looking up payment:", lookupError);
        return;
    }

    if (!existingPaymentWithTicket) {
        console.error(`[Background] Payment record not found. Ref: ${paymentRefId}, Checkout ID: ${checkoutId}`);
        return;
    }

    // Check if tickets array is populated (Idempotency)
    const existingTickets = existingPaymentWithTicket.tickets;
    if (existingTickets && Array.isArray(existingTickets) && existingTickets.length > 0) {
         console.log("[Background] Ticket already issued. Skipping.");
         return;
    }

    const showId = metadata?.show_id;
    let authUserId = metadata?.user_id; // Auth ID (might be null/undefined for guests)

    // Fallback: If metadata.user_id is missing, check the payment record itself
    if (!authUserId && existingPaymentWithTicket.user_id) {
         console.log(`[Background] Metadata missing user_id. Using payment.user_id: ${existingPaymentWithTicket.user_id}`);
         authUserId = existingPaymentWithTicket.user_id;
    }

    if (!showId) {
        console.error("[Background] Missing show_id for ticket creation. Cannot proceed.");
        return;
    }

    // 7. Atomic-ish Update: Update Payment Status FIRST
    const updatePayload: PaymentUpdatePayload = {
        status: "paid",
        updated_at: new Date().toISOString(),
        customer_email: customerEmail,
        customer_name: customerName
    };

    if (paymongoPaymentId) {
        updatePayload.paymongo_payment_id = paymongoPaymentId;
    }

    // If we found by ID but checkout ID was missing/different in DB, update it?
    // (Only if we have a valid checkoutId from webhook)
    if (checkoutId) {
         updatePayload.paymongo_checkout_id = checkoutId;
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update(updatePayload)
      .eq("id", existingPaymentWithTicket.id) // Update by ID which we found
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("[Background] Payment update failed:", paymentError);
      return;
    }

    let profileId: string | null = null;

    // 8. Look up Profile ID from Auth ID (if present)
    if (authUserId) {
        console.log(`[Background] Looking up profile for Auth ID: ${authUserId}`);
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", authUserId)
            .maybeSingle();

        if (profileError || !profile) {
            console.error("[Background] Profile not found for user:", authUserId, ". Treating as guest ticket.");
            // Fallback: profileId remains null
        } else {
            profileId = profile.id;
            console.log(`[Background] Found Profile ID: ${profileId}`);
        }
    } else {
        console.log("[Background] No user_id in metadata. Treating as guest ticket.");
    }

    // 9. Create Ticket
    console.log(`[Background] Creating ticket for ${profileId ? 'Profile ID ' + profileId : 'Guest'}, Show ID ${showId}`);
    const ticketPayload: TicketInsertPayload = {
        show_id: showId,
        status: "confirmed",
        payment_id: payment.id,
        user_id: profileId, // Can be null
        customer_email: customerEmail,
        customer_name: customerName
    };

    const { error: ticketError } = await supabaseAdmin
        .from("tickets")
        .insert(ticketPayload);

    if (ticketError) {
        console.error("[Background] Ticket creation failed:", ticketError);
        return;
    }

    console.log("[Background] Ticket created successfully.");

    // Send Ticket Confirmation Email
    const emailToSend = customerEmail;
    const nameToSend = customerName;

    if (authUserId || emailToSend) {
        console.log(`[Background] Sending ticket confirmation to user ${authUserId || 'guest'} (email: ${emailToSend})`);
        const { error: invokeError } = await supabaseAdmin.functions.invoke("send-ticket-confirmation", {
          body: {
            user_id: authUserId,
            show_id: showId,
            email: emailToSend,
            name: nameToSend
          },
        });

        if (invokeError) {
            console.error("[Background] Failed to invoke send-ticket-confirmation:", invokeError);
        } else {
            console.log("[Background] Ticket confirmation email request sent.");
        }
    } else {
         console.warn("[Background] Skipping email confirmation: No user_id or email found.");
    }

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
                    actor_id: profileId, // Buyer (can be null)
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

             // Create Notification for Buyer (ONLY IF REGISTERED USER)
             if (profileId) {
                 const { error: buyerNotifError } = await supabaseAdmin
                    .from("notifications")
                    .insert({
                        user_id: profileId, // Buyer
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
                     console.log(`[Background] Notification sent to buyer ${profileId}`);
                 }
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
    // ------------------------------------------------------------------------
    // SECURITY: Webhook Signature Verification
    // Implement HMAC-SHA256 verification using PAYMONGO_WEBHOOK_SECRET
    // ------------------------------------------------------------------------

    const signatureHeader = req.headers.get("paymongo-signature");
    const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");

    if (!secret) {
      console.error("PAYMONGO_WEBHOOK_SECRET is not set");
      // Server error, but from client perspective it's unauthorized to access if not configured?
      // Actually 500 is better here but usually we don't want to expose config errors.
      throw new Error("Server configuration error");
    }

    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: "Missing signature header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
       return new Response(JSON.stringify({ error: "Invalid signature header format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // ------------------------------------------------------------------------
    // PROCESSING
    // ------------------------------------------------------------------------

    // 5. Parse JSON
    const payload = JSON.parse(rawBody);
    const eventType = payload.data.attributes.type;

    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = payload.data.attributes.data;
    const resourceType = data.type;
    const attributes = data.attributes;
    const metadata: WebhookMetadata = attributes.metadata || {};
    const billing: WebhookBilling = attributes.billing || {};

    let checkoutId: string | null = null;
    let paymongoPaymentId: string | null = null;

    if (resourceType === 'checkout_session') {
        checkoutId = data.id;
        paymongoPaymentId = attributes.payments?.[0]?.id || null;
    } else if (resourceType === 'payment') {
        paymongoPaymentId = data.id;
        checkoutId = attributes.checkout_id || null;
    } else {
        console.warn(`[Background] Unknown resource type: ${resourceType}. Proceeding with metadata extraction.`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use EdgeRuntime.waitUntil to prevent timeout
    const processingPromise = processWebhook(checkoutId, paymongoPaymentId, metadata, billing, supabaseAdmin);

    if (typeof EdgeRuntime !== "undefined") {
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      await processingPromise;
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
