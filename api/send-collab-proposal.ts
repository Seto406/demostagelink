import { createClient } from "@supabase/supabase-js";

const getJsonBody = (body: unknown): Record<string, unknown> => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as Record<string, unknown>;
  }
  return {};
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.SITE_URL ?? "https://www.stagelink.show";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: "Server environment is not configured correctly" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Attach the caller token to all auth requests and resolve the current user from that session.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    if (userError) {
      console.error("Invalid session in send-collab-proposal", userError.message);
    }
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = getJsonBody(req.body);
  const recipientProfileId = body.recipient_profile_id;

  if (!recipientProfileId || typeof recipientProfileId !== "string") {
    return res.status(400).json({ error: "Recipient Profile ID is required" });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: senderProfile, error: senderError } = await supabaseAdmin
      .from("profiles")
      .select("id, group_name, role, user_id, niche, university, producer_role")
      .eq("user_id", user.id)
      .single();

    if (senderError || !senderProfile) {
      return res.status(404).json({ error: "Sender profile not found" });
    }

    if (senderProfile.role !== "producer" && senderProfile.role !== "admin") {
      return res.status(403).json({ error: "Only Producers and Admins can send collaboration requests" });
    }

    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from("profiles")
      .select("id, group_name, user_id")
      .eq("id", recipientProfileId)
      .single();

    if (recipientError || !recipientProfile) {
      return res.status(404).json({ error: "Recipient profile not found" });
    }

    if (senderProfile.id === recipientProfile.id) {
      return res.status(400).json({ error: "You cannot collaborate with yourself" });
    }

    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
      .from("collaboration_requests")
      .select("id")
      .eq("sender_id", senderProfile.id)
      .eq("receiver_id", recipientProfile.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequestError) {
      console.error("Error checking existing request:", existingRequestError.message);
    } else if (existingRequest) {
      return res.status(429).json({ error: "You already have a pending collaboration request." });
    }

    const { error: insertError } = await supabaseAdmin.from("collaboration_requests").insert({
      sender_id: senderProfile.id,
      receiver_id: recipientProfile.id,
      status: "pending",
    });

    if (insertError) {
      console.error("Error inserting collaboration request:", insertError.message);
      return res.status(500).json({ error: "Failed to record collaboration request" });
    }

    const senderName = senderProfile.group_name || "Someone";

    try {
      const payload: Record<string, unknown> = {
        user_id: recipientProfile.id,
        type: "collaboration_request",
        title: "New Collaboration Request",
        message: `${senderName} wants to collaborate with you.`,
        link: "/dashboard",
        read: false,
        actor_id: senderProfile.id,
      };

      const { error: notificationError } = await supabaseAdmin.from("notifications").insert(payload);

      if (notificationError) {
        if (notificationError.code === "42703" || notificationError.message?.includes("actor_id")) {
          delete payload.actor_id;
          const { error: fallbackNotificationError } = await supabaseAdmin
            .from("notifications")
            .insert(payload);
          if (fallbackNotificationError) {
            console.error("Notification fallback failed:", fallbackNotificationError.message);
          }
        } else {
          console.error("Notification failed:", notificationError.message);
        }
      }
    } catch (notificationException) {
      const message = notificationException instanceof Error ? notificationException.message : "Unknown error";
      console.error("Failed to create notification:", message);
    }

    const adminAuth = (supabaseAdmin.auth as any).admin;
    const { data: recipientUser, error: recipientUserError } = await adminAuth.getUserById(recipientProfile.user_id);

    if (recipientUserError || !recipientUser.user) {
      if (recipientUserError) {
        console.error("Error fetching recipient user:", recipientUserError.message);
      }
      return res.status(200).json({ success: true, message: "Request sent, but recipient email not found." });
    }

    const recipientEmail = recipientUser.user.email;
    const senderEmail = user.email;

    if (!recipientEmail || !senderEmail) {
      return res
        .status(200)
        .json({ success: true, message: "Request sent, but email addresses are incomplete." });
    }

    if (!resendApiKey) {
      return res.status(200).json({ success: true, message: "Request sent. Email delivery is not configured." });
    }

    const recipientGroupName = recipientProfile.group_name || "Theater Group";
    const senderProfileLink = `${siteUrl}/producer/${senderProfile.id}`;

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
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4;">
            <tr>
              <td align="center" style="padding:20px 0;">
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0"
                       style="background-image:url('https://www.stagelink.show/email/bg_curtains.png');background-repeat:no-repeat;background-size:100% 100%;background-color:#ffffff;width:600px;min-height:800px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td align="center" valign="top" style="padding-top:220px;padding-bottom:100px;padding-left:60px;padding-right:60px;color:#333333;font-size:16px;line-height:1.6;">
                      <h1 style="color:#d12121;margin-bottom:20px;font-size:24px;font-family:Georgia,serif;font-weight:bold;">New Collaboration Inquiry</h1>
                      <p style="margin-bottom:20px;">Hello ${recipientGroupName},</p>
                      <p style="margin-bottom:20px;"><strong>${senderName}</strong> wants to connect with your troupe for a potential project or partnership.</p>
                      <div style="background-color:#f9f9f9;border-left:4px solid #d12121;padding:15px;margin-bottom:30px;text-align:left;">
                        <p style="margin:0 0 5px 0;font-size:18px;font-weight:bold;color:#333;">${senderName}</p>
                        <p style="margin:0 0 5px 0;font-size:14px;color:#666;text-transform:uppercase;">${senderNiche}</p>
                        ${senderProfile.producer_role ? `<p style="margin:0;font-size:14px;color:#666;">${senderProfile.producer_role}</p>` : ""}
                      </div>
                      <a href="${senderProfileLink}" style="background-color:#d12121;color:white;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;margin-bottom:30px;">View Sender's Profile</a>
                      <p style="font-size:14px;color:#666;margin-top:20px;border-top:1px solid #eee;padding-top:20px;">
                        <strong>Interested?</strong> You can reply directly to this email to reach them at <a href="mailto:${senderEmail}" style="color:#d12121;text-decoration:none;">${senderEmail}</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [recipientEmail],
        reply_to: senderEmail,
        subject: `🤝 New Theater Collaboration Inquiry: ${senderName} x ${recipientGroupName}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return res.status(200).json({ success: true, message: "Request sent, but email delivery failed.", emailSent: false });
    }

    return res.status(200).json({ success: true, message: "Collaboration request sent successfully", emailSent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error processing request:", message);
    return res.status(500).json({ error: message });
  }
}
