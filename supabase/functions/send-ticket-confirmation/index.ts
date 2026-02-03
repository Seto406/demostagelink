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
    const { user_id, show_id } = await req.json();

    if (!user_id || !show_id) {
      throw new Error("Missing user_id or show_id");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch User Email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      throw new Error("User not found or has no email");
    }
    const email = userData.user.email;

    // 2. Fetch Show Details
    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("title, date, venue, id")
      .eq("id", show_id)
      .single();

    if (showError || !show) {
      throw new Error("Show not found");
    }

    const showDate = show.date
      ? new Date(show.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date to be announced";

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
        subject: `Ticket Confirmed: ${show.title}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">You're Going to the Show! 🎟️</h1>
              <p style="color: #666; font-size: 16px;">Your ticket has been confirmed.</p>
            </div>

            <div style="background-color: #f9fafb; padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 15px 0; color: #111; font-size: 24px;">${show.title}</h2>

              <div style="margin-bottom: 10px;">
                <strong style="color: #666; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Date</strong>
                <p style="margin: 5px 0 0 0; font-size: 18px; color: #333;">${showDate}</p>
              </div>

              ${show.venue ? `
              <div style="margin-top: 20px;">
                <strong style="color: #666; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Venue</strong>
                <p style="margin: 5px 0 0 0; font-size: 18px; color: #333;">${show.venue}</p>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://www.stagelink.show/show/${show.id}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Show Details</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

            <p style="font-size: 14px; color: #888; text-align: center;">
              Present this email or your name at the venue entrance.<br/>
              Transaction ID: ${req.headers.get("x-request-id") || "N/A"}
            </p>
          </div>
        `,
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
