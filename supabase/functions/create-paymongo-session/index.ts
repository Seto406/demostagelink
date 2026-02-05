import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // 2. Parse Request Body
    const { amount, description, redirect_url, metadata } = await req.json();

    if (!amount) {
      throw new Error("Amount is required");
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error("Amount must be a positive number");
    }

    if (description && typeof description !== "string") {
      throw new Error("Description must be a string");
    }

    // 3. Create PayMongo Checkout Session
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) {
      console.error("PAYMONGO_SECRET_KEY is missing");
      throw new Error("Server configuration error");
    }

    const authHeader = `Basic ${btoa(secretKey + ":")}`;
    const successUrl = redirect_url || "https://www.stagelink.show/payment/success";
    const cancelUrl = "https://www.stagelink.show/payment/cancel"; // or receive from client

    const payload = {
      data: {
        attributes: {
          line_items: [
            {
              currency: "PHP",
              amount: Number(amount), // Ensure number
              description: description || "Payment",
              name: "StageLink Payment",
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: successUrl,
          cancel_url: cancelUrl,
          description: description || "Payment",
          metadata: metadata || {},
        },
      },
    };

    const paymongoRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const paymongoData = await paymongoRes.json();

    if (paymongoData.errors) {
      console.error("PayMongo Error:", paymongoData.errors);
      throw new Error(paymongoData.errors[0]?.detail || "Failed to create payment session");
    }

    const checkoutSession = paymongoData.data;
    const checkoutUrl = checkoutSession.attributes.checkout_url;
    const checkoutId = checkoutSession.id;

    // 4. Record in Database (using Service Role to bypass RLS)
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
      console.error("Profile Fetch Error:", profileError);
      throw new Error("Failed to find user profile");
    }

    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        paymongo_checkout_id: checkoutId,
        amount: Number(amount),
        status: "pending",
        description: description,
      });

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      throw new Error("Failed to record payment");
    }

    // 5. Return Checkout URL
    return new Response(
      JSON.stringify({ checkoutUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

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
