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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 6. Idempotency Check
    const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("status, id")
        .eq("paymongo_checkout_id", checkoutId)
        .maybeSingle();

    if (existingPayment?.status === "paid") {
         return new Response(JSON.stringify({ message: "Payment already processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
    }

    // 7. Update Payment Status
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
      return new Response(JSON.stringify({ message: "Payment record not found or update failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const showId = metadata.show_id;
    const authUserId = metadata.user_id;

    if (!showId || !authUserId) {
        console.error("Missing metadata");
        // We successfully updated payment but missing metadata prevents ticket creation.
        // We return 200 to acknowledge webhook (payment is recorded paid), but log error.
        return new Response(JSON.stringify({ error: "Missing metadata for ticket creation" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 8. Look up Profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId) // Looking up by Auth ID
        .single();

    if (profileError || !profile) {
        console.error("Profile not found for user:", authUserId);
        return new Response(JSON.stringify({ error: "Profile not found" }), {
            status: 200, // Return 200 to stop retry, as profile missing is likely permanent
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 9. Create Ticket
    const { error: ticketError } = await supabaseAdmin
        .from("tickets")
        .insert({
            user_id: profile.id, // Profile ID
            show_id: showId,
            status: "confirmed",
            payment_id: payment.id,
        });

    if (ticketError) {
        console.error("Ticket creation failed:", ticketError);
        return new Response(JSON.stringify({ error: "Ticket creation failed" }), {
            status: 500, // Retry might fix transient DB issue
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
