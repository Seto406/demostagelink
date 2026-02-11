import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      throw new Error("Only admins can invite users");
    }

    const { email, first_name } = await req.json();

    if (!email || !first_name) {
      return new Response(
        JSON.stringify({ error: "Email and First Name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate Limiting: Max 20 invites per day per inviter
    const today = new Date();
    today.setHours(today.getHours() - 24);

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { count, error: countError } = await supabaseAdmin
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .eq("inviter_id", user.id)
      .gte("invited_at", today.toISOString());

    if (countError) {
      console.error("Rate limit check error:", countError);
      throw new Error("Failed to check rate limits");
    }

    if ((count || 0) >= 20) {
      return new Response(
        JSON.stringify({ error: "Daily invite limit reached (20 invites/24h)" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Invite via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: first_name,
          inviter_name: "StageLink Admin",
          role: "audience", // Default role
        },
        // Rely on Supabase Site URL configuration for redirect
      }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record invitation in database
    const { error: insertError } = await supabaseAdmin
      .from("invitations")
      .insert({
        email: email,
        first_name: first_name,
        inviter_id: user.id,
        status: "pending",
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      if (insertError.code === "23505") { // Unique violation
         return new Response(
          JSON.stringify({ error: "An active invitation already exists for this email" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Invite sent but failed to record in database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully", user: inviteData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
