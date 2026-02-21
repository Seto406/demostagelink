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

    // We strictly check for 'checkout_session.payment.paid'
    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const checkoutId = payload.data.attributes.data.id;
    const session = payload.data.attributes.data.attributes;
    const metadata = session.metadata || {};

    // Use Service Role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 6. Idempotency Check
    const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("status")
        .eq("paymongo_checkout_id", checkoutId)
        .maybeSingle();

    if (existingPayment?.status === "paid") {
         return new Response(JSON.stringify({ message: "Payment already processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
    }

    // 7. Update Payment Status
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({ status: "paid", updated_at: new Date() })
      .eq("paymongo_checkout_id", checkoutId)
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found or update failed for checkout ID:", checkoutId);
      return new Response(JSON.stringify({ message: "Payment record not found or update failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const type = metadata.type || "subscription";
    const authUserId = metadata.user_id;

    if (type === "ticket") {
        // Task 1 specific logic:
        // Metadata Extraction: show_id and user_id (auth user id)
        // Profile Lookup: query profiles table where user_id = metadata.user_id

        const showId = metadata.show_id;

        if (!authUserId) {
            console.error("Missing user_id in metadata for ticket purchase");
        } else {
            const { data: profile, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("user_id", authUserId)
                .single();

            if (profileError || !profile) {
                console.error("Profile not found for auth user:", authUserId);
            } else {
                if (showId) {
                  const { error: ticketError } = await supabaseAdmin
                    .from("tickets")
                    .insert({
                      user_id: profile.id, // Using the looked-up profile ID
                      show_id: showId,
                      status: "confirmed",
                      payment_id: payment.id,
                    });

                  if (ticketError) {
                    console.error("Ticket Insert Error:", ticketError);
                  } else {
                    // Trigger Email (fire and forget)
                    supabaseAdmin.functions.invoke("send-ticket-confirmation", {
                      body: { user_id: profile.id, show_id: showId },
                    });
                  }
                } else {
                    console.error("Missing show_id in metadata");
                }
            }
        }
    } else if (type === "subscription") {
       // Legacy/Other logic
       const userId = payment.user_id; // Using existing payment link
       const startDate = new Date();
       const endDate = new Date();
       endDate.setMonth(endDate.getMonth() + 1);

       const { error: subError } = await supabaseAdmin
         .from("subscriptions")
         .upsert(
           {
             user_id: userId,
             status: "active",
             tier: "pro",
             current_period_start: startDate.toISOString(),
             current_period_end: endDate.toISOString(),
             updated_at: new Date(),
           },
           { onConflict: "user_id" }
         );

        if (subError) console.error("Subscription update failed:", subError);

    } else if (type === "featured_show") {
       const showId = metadata.show_id;
       if (showId) {
         const { error: showError } = await supabaseAdmin
           .from("shows")
           .update({ is_featured: true })
           .eq("id", showId);

         if (showError) console.error("Show feature update failed:", showError);
       }
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
