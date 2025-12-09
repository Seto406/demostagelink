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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role }: WelcomeEmailRequest = await req.json();

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
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: Georgia, serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #D4AF37; font-size: 32px; margin: 0; font-weight: bold;">StageLink</h1>
              <p style="color: #666666; font-size: 14px; margin: 8px 0 0 0;">Discover Local Theater</p>
            </div>
            
            <div style="background-color: #111111; border: 1px solid #333333; padding: 40px; text-align: center;">
              <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">
                Welcome to StageLink, ${displayName}!
              </h2>
              
              <p style="color: #E5E5E5; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your email has been verified and your account is now active.
              </p>
              
              ${isProducer ? `
                <div style="background-color: #800000; padding: 20px; margin: 24px 0;">
                  <p style="color: #FFFFFF; font-size: 14px; margin: 0; line-height: 1.6;">
                    <strong>As a Producer</strong>, you can now submit your theater productions for approval. 
                    Once approved, your shows will be visible to audiences across Metro Manila!
                  </p>
                </div>
              ` : `
                <div style="background-color: #1a1a1a; border: 1px solid #D4AF37; padding: 20px; margin: 24px 0;">
                  <p style="color: #E5E5E5; font-size: 14px; margin: 0; line-height: 1.6;">
                    <strong style="color: #D4AF37;">As an Audience Member</strong>, you can now discover and explore 
                    local theater productions happening in Metro Manila!
                  </p>
                </div>
              `}
              
              <a href="https://jfttjnoxveekouqcznis.lovable.app/" 
                 style="display: inline-block; background-color: #800000; color: #FFFFFF; text-decoration: none; 
                        padding: 14px 32px; font-size: 16px; margin-top: 16px; border: 1px solid #D4AF37;">
                ${isProducer ? "Go to Dashboard" : "Explore Shows"}
              </a>
            </div>
            
            <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 32px;">
              © 2024 StageLink. Connecting audiences with local theater in Metro Manila.
            </p>
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
        from: "StageLink <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to StageLink${isProducer ? " - Producer Account Activated" : ""}!`,
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

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, data }),
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
