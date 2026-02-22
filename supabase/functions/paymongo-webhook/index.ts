import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
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

    console.log(`Processing paid webhook for checkout ${checkoutId}`);
    console.log(`Metadata:`, metadata);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 6. Idempotency Check: Check if a ticket already exists for this payment.
    // Query payments and join tickets.
    const { data: existingPaymentWithTicket, error: lookupError } = await supabaseAdmin
        .from("payments")
        .select("id, status, tickets(id)")
        .eq("paymongo_checkout_id", checkoutId)
        .maybeSingle();

    if (lookupError) {
        console.error("Error looking up payment:", lookupError);
        throw new Error("Database lookup failed");
    }

    // Check if tickets array is populated
    const existingTickets = existingPaymentWithTicket?.tickets;
    if (existingTickets && Array.isArray(existingTickets) && existingTickets.length > 0) {
         console.log("Ticket already issued. Skipping.");
         return new Response(JSON.stringify({ message: "Ticket already issued" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
    }

    // If payment status is 'paid' but NO ticket, we proceed to ensure ticket is created.
    // (This handles the case where payment update succeeded but ticket insert failed previously)

    const showId = metadata.show_id;
    const authUserId = metadata.user_id; // Auth ID

    if (!showId || !authUserId) {
        console.error("Missing metadata for ticket creation. Cannot proceed.");
        return new Response(JSON.stringify({ error: "Missing metadata for ticket creation" }), {
            status: 200, // Do not retry if data is missing
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      console.error("Payment update failed or record not found:", paymentError);
      // Return 500 to trigger retry (maybe transient DB error)
      return new Response(JSON.stringify({ message: "Payment update failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 8. Look up Profile ID from Auth ID
    console.log(`Looking up profile for Auth ID: ${authUserId}`);
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId)
        .single();

    if (profileError || !profile) {
        console.error("Profile not found for user:", authUserId);
        // This is critical logic failure (user doesn't exist?), so maybe 200 to stop retry?
        // Or 500 if transient? Assuming profile MUST exist.
        return new Response(JSON.stringify({ error: "Profile not found" }), {
            status: 200, // Stop retry
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    console.log(`Found Profile ID: ${profile.id}`);

    // 9. Create Ticket
    console.log(`Creating ticket for Profile ID ${profile.id}, Show ID ${showId}`);
    const { error: ticketError } = await supabaseAdmin
        .from("tickets")
        .insert({
            user_id: profile.id, // Using Profile ID
            show_id: showId,
            status: "confirmed",
            payment_id: payment.id,
        });

    if (ticketError) {
        console.error("Ticket creation failed:", ticketError);
        // Return 500 to trigger retry. Next retry will hit Idempotency Check (no tickets) -> Update Payment (success) -> Create Ticket.
        return new Response(JSON.stringify({ error: "Ticket creation failed" }), {
            status: 500, // Retry
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log("Ticket created successfully.");

    // 10. Notify Producer
    try {
        // Fetch Show Details (Producer ID and Title)
        const { data: show, error: showError } = await supabaseAdmin
            .from("shows")
            .select("title, producer_id")
            .eq("id", showId)
            .single();

        if (showError || !show) {
             console.error("Failed to fetch show details for notification:", showError);
             // Do not fail the webhook, just log.
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
                 console.error("Failed to create producer notification:", notifError);
             } else {
                 console.log(`Notification sent to producer ${producerId}`);
             }
        }

    } catch (notifErr) {
        console.error("Error in notification block:", notifErr);
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
