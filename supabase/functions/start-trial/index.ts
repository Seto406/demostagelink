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
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Internal Server Error: Missing configuration");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    // Verify profile exists to prevent FK violation
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile check error:", profileError);
      throw new Error("Error verifying user profile");
    }

    if (!profile) {
      console.error("Profile missing for user:", user.id);
      throw new Error("Profile not found. Please complete signup.");
    }

    // Check existing subscription (robust handling for duplicates)
    const { data: existingSub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Subscription check error:", subError);
      throw subError;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 days trial

    if (existingSub) {
      if (existingSub.status === 'active' && existingSub.tier === 'pro') {
          return new Response(JSON.stringify({ message: "Subscription already active" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      }

      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          tier: "pro",
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          updated_at: startDate.toISOString(),
        })
        .eq("id", existingSub.id);

      if (updateError) {
        console.error("Subscription update error:", updateError);
        throw updateError;
      }

    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          status: "active",
          tier: "pro",
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          updated_at: startDate.toISOString(),
        });

      if (insertError) {
        console.error("Subscription insert error:", insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ message: "Trial started successfully", expires_at: endDate }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Start trial error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
