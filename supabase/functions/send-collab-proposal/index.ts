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
        .select("id, group_name, role, user_id, niche, university, producer_role")
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

    // 4. Check for Pending Requests
    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
        .from("collaboration_requests")
        .select("id")
        .eq("sender_id", senderProfile.id)
        .eq("receiver_id", recipientProfile.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existingRequestError) {
        console.error("Error checking existing request:", existingRequestError);
    } else if (existingRequest) {
        return new Response(
            JSON.stringify({ error: "You already have a pending collaboration request." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 5. Insert Collaboration Request
    const { error: insertError } = await supabaseAdmin
        .from("collaboration_requests")
        .insert({
            sender_id: senderProfile.id,
            receiver_id: recipientProfile.id,
            status: "pending"
        });

    if (insertError) {
        console.error("Error inserting collaboration request:", insertError);
        throw new Error("Failed to record collaboration request");
    }

    // 6. Create In-App Notification
    const senderName = senderProfile.group_name || "Someone";

    try {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: recipientProfile.id,
          actor_id: senderProfile.id,
          type: 'collaboration_request',
          title: 'New Collaboration Request',
          message: `${senderName} wants to collaborate with you.`,
          link: `/dashboard`,
          read: false
        } as Record<string, unknown>);

      if (notificationError) {
         // If the error is about the missing actor_id column, retry without it
        if (notificationError.message?.includes('column "actor_id" of relation "notifications" does not exist') ||
            notificationError.code === '42703') { // Postgres error code for undefined column
          console.warn('actor_id column missing in notifications table, retrying without it...');

          const { error: retryError } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: recipientProfile.id,
              type: 'collaboration_request',
              title: 'New Collaboration Request',
              message: `${senderName} wants to collaborate with you.`,
              link: `/dashboard`,
              read: false
            });

          if (retryError) {
             console.error("Error creating notification (retry):", retryError);
          }
        } else {
            console.error("Error creating notification:", notificationError);
        }
      }
    } catch (error) {
       console.error("Failed to create notification:", error);
    }

    // 7. Send Email
    const { data: recipientUser, error: recipientUserError } = await supabaseAdmin.auth.admin.getUserById(recipientProfile.user_id);

    if (recipientUserError || !recipientUser.user) {
        console.error("Error fetching recipient user:", recipientUserError);
        // Request created but email failed due to user lookup
        return new Response(
          JSON.stringify({ success: true, message: "Request sent, but recipient email not found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const recipientEmail = recipientUser.user.email;
    const senderEmail = user.email;

    if (!recipientEmail || !senderEmail) {
         console.error("Email missing:", { recipientEmail, senderEmail });
         // Request created but email failed due to missing email
         return new Response(
          JSON.stringify({ success: true, message: "Request sent, but email addresses are incomplete." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const recipientGroupName = recipientProfile.group_name || "Theater Group";
    const senderProfileLink = `https://www.stagelink.show/producer/${senderProfile.id}`;

    // Construct niche label
    let senderNiche = "Theater Group";
    if (senderProfile.niche === "university" && senderProfile.university) {
      senderNiche = `${senderProfile.university} Theater Group`;
    } else if (senderProfile.niche === "local") {
      senderNiche = "Local/Community Theater";
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collaboration Request</title>
          <style>
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; background-size: cover !important; }
                .content { padding-left: 20px !important; padding-right: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table role="presentation" class="container" width="600" border="0" cellspacing="0" cellpadding="0"
                       style="background-image: url('https://www.stagelink.show/email/bg_curtains.png');
                              background-repeat: no-repeat;
                              background-size: 100% 100%;
                              background-color: #ffffff;
                              width: 600px;
                              min-height: 800px;
                              border-radius: 8px;
                              box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td class="content" align="center" valign="top" style="padding-top: 220px; padding-bottom: 100px; padding-left: 60px; padding-right: 60px; color: #333333; font-size: 16px; line-height: 1.6;">

                      <h1 style="color: #d12121; margin-bottom: 20px; font-size: 24px; font-family: Georgia, serif; font-weight: bold;">New Collaboration Inquiry</h1>

                      <p style="margin-bottom: 20px;">Hello ${recipientGroupName},</p>

                      <p style="margin-bottom: 20px;">
                        <strong>${senderName}</strong> wants to connect with your troupe for a potential project or partnership.
                      </p>

                      <div style="background-color: #f9f9f9; border-left: 4px solid #d12121; padding: 15px; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; color: #333;">${senderName}</p>
                        <p style="margin: 0 0 5px 0; font-size: 14px; color: #666; text-transform: uppercase;">${senderNiche}</p>
                        ${senderProfile.producer_role ? `<p style="margin: 0; font-size: 14px; color: #666;">${senderProfile.producer_role}</p>` : ''}
                      </div>

                      <p style="margin-bottom: 30px;">
                        Instead of a standard message, they have shared their professional StageLink portfolio for your review. By connecting through StageLink, you can view their verified production history and organizational niche.
                      </p>

                      <a href="${senderProfileLink}" style="background-color: #d12121; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 30px;">
                        View Sender's Profile
                      </a>

                      <p style="font-size: 14px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                        <strong>Interested?</strong> You can reply directly to this email to reach them at <a href="mailto:${senderEmail}" style="color: #d12121; text-decoration: none;">${senderEmail}</a>.
                      </p>

                    </td>
                  </tr>
                </table>

                <p style="color: #888888; font-size: 12px; margin-top: 20px; text-align: center;">
                    StageLink<br>
                    <a href="https://www.stagelink.show" style="color: #888888; text-decoration: none;">www.stagelink.show</a>
                </p>
              </td>
            </tr>
          </table>
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
        reply_to: senderEmail,
        subject: `🤝 New Theater Collaboration Inquiry: ${senderName} x ${recipientGroupName}`,
        html,
      }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Resend API error:", errorText);
        // Return success for the request, but indicate email failure
        return new Response(
          JSON.stringify({ success: true, message: "Request sent, but email delivery failed.", emailSent: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Collaboration request sent successfully", emailSent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error processing request:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
