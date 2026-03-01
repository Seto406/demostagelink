import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMOKE_TEST_KEY = Deno.env.get("SMOKE_TEST_KEY");

const ALLOWED_SMOKE_TEST_EMAILS = new Set([
  "delivered@resend.dev",
  "bounced@resend.dev",
  "complained@resend.dev",
  "suppressed@resend.dev",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-smoke-test, x-smoke-test-key",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_id, type, data } = await req.json();

    if (!recipient_id || !type) {
      throw new Error("Missing recipient_id or type");
    }

    const smokeHeader = req.headers.get("x-smoke-test");
    const smokeKeyHeader = req.headers.get("x-smoke-test-key");
    const requestedTestEmail = data?.test_email;

    const smokeOverrideActive =
      smokeHeader === "true" &&
      !!SMOKE_TEST_KEY &&
      smokeKeyHeader === SMOKE_TEST_KEY &&
      typeof requestedTestEmail === "string";

    let email = "";

    if (smokeOverrideActive) {
      if (!ALLOWED_SMOKE_TEST_EMAILS.has(requestedTestEmail)) {
        throw new Error("Invalid smoke test recipient");
      }
      email = requestedTestEmail;
      console.info("send-notification-email smoke override", { domain: "@resend.dev", type });
    } else {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch Recipient Email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipient_id);

      if (userError || !userData?.user?.email) {
        console.error("User not found or has no email:", recipient_id);
        throw new Error("Recipient user not found");
      }

      email = userData.user.email;
    }

    let subject = "";
    let html = "";

    if (type === "membership_application") {
      const { applicant_name, group_name, link } = data;
      subject = `New Member Application: ${applicant_name}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Membership Application</h1>
          <p>Hi there,</p>
          <p><strong>${applicant_name}</strong> has applied to join <strong>${group_name || "your group"}</strong>.</p>
          <p>You can review their application in your dashboard.</p>
          <p><a href="${link || "https://www.stagelink.show/dashboard"}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Application</a></p>
        </div>
      `;
    } else if (type === "collab_accepted") {
      const { sender_name, group_name, link } = data;
      subject = "Collaboration Accepted! 🤝";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Collaboration Request Accepted</h1>
          <p>Hi there,</p>
          <p>Great news! Your collaboration request to <strong>${group_name}</strong> has been accepted.</p>
          <p>You are now a producer for this group.</p>
          <p><a href="${link || "https://www.stagelink.show/dashboard"}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        </div>
      `;
    } else if (type === "membership_approved") {
      const { group_name, link } = data;
      subject = "Membership Approved! 🎉";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Membership Approved</h1>
          <p>Hi there,</p>
          <p>Your request to join <strong>${group_name}</strong> has been approved!</p>
          <p>You can now view the group's profile and your membership status.</p>
          <p><a href="${link || "https://www.stagelink.show/dashboard"}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Group Profile</a></p>
        </div>
      `;
    } else {
      throw new Error("Invalid notification type");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend Error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailRes.json();

    return new Response(JSON.stringify({ success: true, id: emailData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
