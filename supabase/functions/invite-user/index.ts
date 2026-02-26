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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only admins can invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, first_name, redirect_to } = await req.json();

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
      return new Response(
        JSON.stringify({ error: "Failed to check rate limits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((count || 0) >= 20) {
      return new Response(
        JSON.stringify({ error: "Daily invite limit reached (20 invites/24h)" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create User (if not exists)
    // We try to create. If it fails because user exists, we proceed to generate link.
    // However, generateLink works on existing users too.
    // But for a *new* user invite, we typically want to create them first.
    // Actually, generateLink with type 'invite' requires the user to exist (usually created via inviteUserByEmail).
    // So we use createUser first.

    let userId = "";

    // Check if user exists first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    // listUsers is paginated, but for now we assume email lookup via listUsers is inefficient or we just try create.
    // Better: Try to create, catch error if exists.

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto confirm? No, invite link usually handles setup.
      // Actually, standard invite flow leaves email unconfirmed until they click.
      // But generateLink type='invite' sets up the password.
      user_metadata: {
        first_name: first_name,
        inviter_name: "StageLink Admin",
        role: "audience",
      }
    });

    if (createError) {
      // If user already exists, we might want to send them a magic link instead?
      // Or just fail. The original inviteUserByEmail would send a magic link if user exists.
      console.log("User creation note:", createError.message);
      // We will try to fetch the user ID if creation failed (likely exists)
      // Ideally we should handle "already invited" gracefully.
      // For now, let's assume if we can't create, we can't invite as *new*.
      // But let's look up the user to be robust.
      // Since we don't have getUserByEmail easily exposed without iterating or exact match if RLS allows (admin does).
      // We'll proceed only if we have a user.
    }

    // Since we need the ID for generateLink, and createUser returns it.
    if (createdUser?.user) {
        userId = createdUser.user.id;
    } else {
        // Fallback: try to find user
        // This is tricky without a direct API for "get user by email".
        // But assuming `inviteUserByEmail` was the old way, `createUser` is the replacement.
        // If `createUser` failed, it's likely they exist.
        // Let's rely on the previous flow if manual creation fails, OR just use generateLink if we can find them.
        // Actually, `inviteUserByEmail` returns the user.
        // Let's stick to `inviteUserByEmail` but suppress its email sending?
        // Supabase `inviteUserByEmail` does NOT allow suppressing email easily unless SMTP is off.

        // ALTERNATIVE: use `generateLink` with `type: 'signup'`? No.
        // ALTERNATIVE: `inviteUserByEmail` returns the user. If we use that, Supabase sends the email.
        // We want to PREVENT Supabase from sending the default email.
        // There is no easy way to disable it per request.

        // Correct approach for branded invites:
        // 1. Create user with `admin.createUser`.
        // 2. `admin.generateLink({ type: 'invite', email: ... })`.

        // If createUser fails (e.g. email taken), we can't "invite" them as a new user.
        // We should return an error "User already exists".
        if (!userId) {
             return new Response(
                JSON.stringify({ error: "User already exists or could not be created." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    }

    // 2. Generate Invite Link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        redirectTo: redirect_to,
        data: {
            first_name: first_name,
            inviter_name: "StageLink Admin",
            role: "audience",
        }
      },
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error("Link generation error:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate invite link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actionLink = linkData.properties.action_link;

    // 3. Send Branded Email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've been invited to StageLink</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: Georgia, 'Times New Roman', serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px; padding: 30px; border-bottom: 1px solid #D4AF37;">
              <span style="font-size: 42px; display: block; margin-bottom: 16px;">🎭</span>
              <h1 style="color: #D4AF37; font-size: 36px; margin: 0; font-weight: bold; letter-spacing: 2px;">STAGELINK</h1>
              <p style="color: #888888; font-size: 13px; margin: 8px 0 0 0; letter-spacing: 3px; text-transform: uppercase;">Discover Local Theater</p>
            </div>
            <div style="background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%); border: 1px solid #333333; padding: 48px 40px; text-align: center;">
              <h2 style="color: #FFFFFF; font-size: 28px; margin: 0 0 16px 0; font-weight: normal; font-family: Georgia, serif;">
                You're Invited!
              </h2>
              <p style="color: #E5E5E5; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
                Hi ${first_name},<br/><br/>
                You've been invited to join <strong>StageLink</strong>, the premier platform for local theater in Metro Manila.
              </p>
              <a href="${actionLink}"
                 style="display: inline-block; background: linear-gradient(135deg, #800000 0%, #5a0000 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; font-size: 16px; border: 1px solid #D4AF37; font-weight: bold; letter-spacing: 1px;">
                Accept Invitation
              </a>
              <p style="color: #666666; font-size: 12px; margin: 24px 0 0 0;">
                This link will expire in 24 hours.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [email],
        subject: "🎟️ You've been invited to StageLink",
        html: html,
      }),
    });

    if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
        // Return error to allow UI to show failure
        return new Response(
            JSON.stringify({ error: "Failed to send invitation email" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
