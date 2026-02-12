import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

    const { recipient_profile_id } = await req.json();

    if (!recipient_profile_id) {
        return new Response(
            JSON.stringify({ error: "Recipient Profile ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(
      SUPABASE_URL ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // 1. Fetch Sender Profile
    const { data: senderProfile, error: senderError } = await supabaseAdmin
        .from("profiles")
        .select("id, group_name, role, user_id")
        .eq("user_id", user.id)
        .single();

    if (senderError || !senderProfile) {
        throw new Error("Sender profile not found");
    }

    // Check if Sender is Producer or Admin
    if (senderProfile.role !== "producer" && senderProfile.role !== "admin") {
         return new Response(
            JSON.stringify({ error: "Only Producers and Admins can send collaboration requests" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 2. Fetch Recipient Profile
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
        .from("profiles")
        .select("id, group_name, user_id")
        .eq("id", recipient_profile_id)
        .single();

    if (recipientError || !recipientProfile) {
        throw new Error("Recipient profile not found");
    }

    // 3. Prevent self-collaboration
    if (senderProfile.id === recipientProfile.id) {
         return new Response(
            JSON.stringify({ error: "You cannot collaborate with yourself" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 4. Rate Limiting / Duplicate Check (Optional but good)
    // Check if a request was sent in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { count, error: countError } = await supabaseAdmin
        .from("collaboration_logs")
        .select("*", { count: 'exact', head: true })
        .eq("sender_id", senderProfile.id)
        .eq("recipient_id", recipientProfile.id)
        .gte("created_at", oneDayAgo.toISOString());

    if (countError) {
        console.error("Rate limit check error:", countError);
    } else if ((count || 0) > 0) {
        return new Response(
            JSON.stringify({ error: "You have already sent a request to this group recently." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 5. Fetch Recipient Email from Auth
    const { data: recipientUser, error: recipientUserError } = await supabaseAdmin.auth.admin.getUserById(recipientProfile.user_id);

    if (recipientUserError || !recipientUser.user) {
        console.error("Error fetching recipient user:", recipientUserError);
        throw new Error("Recipient user account not found");
    }

    const recipientEmail = recipientUser.user.email;
    const senderEmail = user.email; // Sender's contact email

    if (!recipientEmail || !senderEmail) {
        throw new Error("Email address missing for sender or recipient");
    }

    // 6. Insert Log
    const { error: insertError } = await supabaseAdmin
        .from("collaboration_logs")
        .insert({
            sender_id: senderProfile.id,
            recipient_id: recipientProfile.id,
            status: "sent"
        });

    if (insertError) {
        console.error("Error inserting log:", insertError);
        throw new Error("Failed to record collaboration request");
    }

    // 7. Send Email
    const senderGroupName = senderProfile.group_name || "A Theater Group";
    const recipientGroupName = recipientProfile.group_name || "Theater Group";
    const senderProfileLink = `https://stagelink.show/producer/${senderProfile.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Collaboration Inquiry</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #111111; font-size: 24px; margin-bottom: 20px;">Hello ${recipientGroupName},</h2>

              <p style="color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                An artistic collaboration request has been initiated on StageLink.
              </p>

              <p style="color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                <strong>${senderGroupName}</strong> has expressed interest in connecting with your troupe for a potential project or partnership. Instead of a standard social media message, they have shared their professional StageLink portfolio for your review:
              </p>

              <div style="margin-bottom: 30px; text-align: center;">
                <a href="${senderProfileLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                  View Sender's StageLink Profile
                </a>
              </div>

              <p style="color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                <strong>Why this matters:</strong> By connecting through StageLink, you can view their verified production history, cast list, and organizational niche in one place.
              </p>

              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">

              <p style="color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                <strong>Next Steps:</strong> If you are interested in discussing a collaboration, you may reach them directly at: <a href="mailto:${senderEmail}" style="color: #000000; text-decoration: underline;">${senderEmail}</a> or via their linked social media.
              </p>

              <p style="color: #888888; font-size: 14px; margin-top: 40px;">
                Keep the curtain rising,<br>
                The StageLink Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [recipientEmail],
        subject: `🤝 New Theater Collaboration Inquiry: ${senderGroupName} x ${recipientGroupName}`,
        html,
        reply_to: senderEmail,
      }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Resend API error:", errorText);
        // We log the error but still return success if the DB insert worked,
        // OR we can throw. Throwing is better to alert the sender.
        // But the log is in DB. Maybe we should delete it if email fails?
        // Let's keep it simple: throw error.
        throw new Error("Failed to send email notification. Please try again later.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Collaboration request sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
