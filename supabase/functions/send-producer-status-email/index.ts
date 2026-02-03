import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, status, group_name } = await req.json();

    if (!user_id || !status) {
      throw new Error("Missing user_id or status");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch User Email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      throw new Error("User not found or has no email");
    }
    const email = userData.user.email;

    // 2. Prepare Email Content
    let subject = "";
    let html = "";

    if (status === "approved") {
      subject = "You're a Producer! 🎭";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to the Stage!</h1>
          <p>Hi there,</p>
          <p>We are thrilled to inform you that your request to become a producer for <strong>${group_name || "your group"}</strong> has been <strong>APPROVED</strong>.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage show listings</li>
            <li>Sell tickets directly on StageLink</li>
            <li>Customize your theater group profile</li>
          </ul>
          <p><a href="https://www.stagelink.show/dashboard" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "Producer Request Update";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Request Update</h1>
          <p>Hi there,</p>
          <p>Thank you for your interest in becoming a producer on StageLink.</p>
          <p>After reviewing your request for <strong>${group_name || "your group"}</strong>, we are unable to approve it at this time.</p>
          <p>If you believe this is a mistake or if you have additional information to provide, please contact us at hello@stagelink.show.</p>
        </div>
      `;
    } else {
        throw new Error("Invalid status");
    }

    // 3. Send Email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [email],
        subject: subject,
        html: html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend Error:", emailData);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: emailData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
