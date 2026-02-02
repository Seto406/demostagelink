import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
  resetLink?: string; // Legacy parameter, ignored if we generate the link here
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo, resetLink }: PasswordResetRequest = await req.json();
    console.log("Sending password reset email to:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Admin Client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate valid recovery link
    // Use the provided redirectTo, or fallback to resetLink (if it was passed as a redirect URL), or default
    const redirectUrl = redirectTo || (resetLink && resetLink.startsWith("http") ? resetLink : "https://www.stagelink.show/reset-password?type=recovery");

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating reset link:", linkError);
      throw new Error("Failed to generate password reset link");
    }

    const actionLink = linkData.properties.action_link;
    console.log("Generated action link successfully");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - StageLink</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: Georgia, 'Times New Roman', serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 40px; padding: 30px; border-bottom: 1px solid #D4AF37;">
              <div style="display: inline-block; margin-bottom: 16px;">
                <span style="font-size: 42px;">🎭</span>
              </div>
              <h1 style="color: #D4AF37; font-size: 36px; margin: 0; font-weight: bold; letter-spacing: 2px;">STAGELINK</h1>
              <p style="color: #888888; font-size: 13px; margin: 8px 0 0 0; letter-spacing: 3px; text-transform: uppercase;">Discover Local Theater</p>
            </div>
            
            <!-- Main Content Card -->
            <div style="background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%); border: 1px solid #333333; padding: 48px 40px; text-align: center;">
              
              <!-- Lock Icon -->
              <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #800000 0%, #4a0000 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #D4AF37;">
                <span style="font-size: 36px; line-height: 80px;">🔐</span>
              </div>
              
              <h2 style="color: #FFFFFF; font-size: 28px; margin: 0 0 24px 0; font-weight: normal; font-family: Georgia, serif;">
                Reset Your Password
              </h2>
              
              <div style="width: 60px; height: 1px; background: #D4AF37; margin: 0 auto 24px;"></div>
              
              <p style="color: #E5E5E5; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
                We received a request to reset your password. Click the button below to create a new password for your StageLink account.
              </p>
              
              <!-- CTA Button -->
              <a href="${actionLink}"
                 style="display: inline-block; background: linear-gradient(135deg, #800000 0%, #5a0000 100%); color: #FFFFFF; text-decoration: none; 
                        padding: 16px 40px; font-size: 16px; border: 1px solid #D4AF37; font-weight: bold; letter-spacing: 1px;">
                Reset Password →
              </a>
              
              <!-- Security Notice -->
              <div style="background-color: #1a1a1a; border: 1px solid #333; padding: 20px; margin: 32px 0 0 0; text-align: left;">
                <p style="color: #888888; font-size: 13px; margin: 0; line-height: 1.6;">
                  <strong style="color: #D4AF37;">⚠️ Security Notice:</strong><br>
                  This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <!-- Fallback Link -->
              <p style="color: #666666; font-size: 12px; margin: 24px 0 0 0; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${actionLink}" style="color: #D4AF37; text-decoration: underline;">${actionLink}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #333;">
              <p style="color: #D4AF37; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">
                🎭 StageLink
              </p>
              <p style="color: #666666; font-size: 12px; margin: 0 0 16px 0;">
                Connecting audiences with local theater in Metro Manila
              </p>
              <p style="color: #444444; font-size: 11px; margin: 0;">
                © 2024 StageLink. All rights reserved.
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
        to: [email],
        subject: "🔐 Reset Your StageLink Password",
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send password reset email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await res.json();
    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending password reset email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
