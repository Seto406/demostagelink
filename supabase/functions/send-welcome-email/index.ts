import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  role: "audience" | "producer";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role }: WelcomeEmailRequest = await req.json();
    console.log("Sending welcome email to:", email, "role:", role);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isProducer = role === "producer";
    const displayName = name || "Theater Enthusiast";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to StageLink</title>
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
              
              <!-- Welcome Icon -->
              <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #800000 0%, #4a0000 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #D4AF37;">
                <span style="font-size: 36px; line-height: 80px;">✨</span>
              </div>
              
              <h2 style="color: #FFFFFF; font-size: 28px; margin: 0 0 8px 0; font-weight: normal; font-family: Georgia, serif;">
                Welcome to the Stage,
              </h2>
              <h3 style="color: #D4AF37; font-size: 24px; margin: 0 0 24px 0; font-weight: bold;">
                ${displayName}!
              </h3>
              
              <div style="width: 60px; height: 1px; background: #D4AF37; margin: 0 auto 24px;"></div>
              
              <p style="color: #E5E5E5; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
                Your email has been verified and your account is now active. 
                You're now part of Metro Manila's vibrant theater community.
              </p>
              
              ${isProducer ? `
                <!-- Producer Welcome Box -->
                <div style="background: linear-gradient(135deg, #800000 0%, #5a0000 100%); padding: 28px; margin: 0 0 32px 0; border: 1px solid #D4AF37; text-align: left;">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 24px; margin-right: 12px;">🎬</span>
                    <span style="color: #D4AF37; font-size: 18px; font-weight: bold;">Producer Account Activated</span>
                  </div>
                  <p style="color: #FFFFFF; font-size: 14px; margin: 0; line-height: 1.7;">
                    You can now submit your theater productions for approval. Once approved, your shows will be visible to audiences across Metro Manila, helping you reach new theatergoers and grow your audience.
                  </p>
                </div>
                
                <p style="color: #888888; font-size: 14px; margin: 0 0 24px 0;">
                  <strong style="color: #D4AF37;">Next steps:</strong> Complete your group profile, then submit your first show!
                </p>
              ` : `
                <!-- Audience Welcome Box -->
                <div style="background-color: #1a1a1a; border: 1px solid #D4AF37; padding: 28px; margin: 0 0 32px 0; text-align: left;">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 24px; margin-right: 12px;">🎟️</span>
                    <span style="color: #D4AF37; font-size: 18px; font-weight: bold;">Audience Member</span>
                  </div>
                  <p style="color: #E5E5E5; font-size: 14px; margin: 0; line-height: 1.7;">
                    Explore upcoming productions, discover talented theater groups, and find your next unforgettable theatrical experience in Metro Manila.
                  </p>
                </div>
                
                <p style="color: #888888; font-size: 14px; margin: 0 0 24px 0;">
                  <strong style="color: #D4AF37;">Start exploring:</strong> Browse shows by city, genre, or theater group!
                </p>
              `}
              
              <!-- CTA Button -->
              <a href="https://www.stagelink.show/${isProducer ? 'dashboard' : 'shows'}"
                 style="display: inline-block; background: linear-gradient(135deg, #800000 0%, #5a0000 100%); color: #FFFFFF; text-decoration: none; 
                        padding: 16px 40px; font-size: 16px; border: 1px solid #D4AF37; font-weight: bold; letter-spacing: 1px;
                        transition: all 0.3s ease;">
                ${isProducer ? "Go to Dashboard →" : "Explore Shows →"}
              </a>
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
        subject: isProducer 
          ? "🎭 Welcome to StageLink - Your Producer Account is Ready!" 
          : "🎭 Welcome to StageLink - Start Discovering Theater!",
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await res.json();
    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
