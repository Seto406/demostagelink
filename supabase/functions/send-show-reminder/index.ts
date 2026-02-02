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

interface Show {
  id: string;
  title: string;
  date: string;
  venue: string | null;
  ticket_link: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { showId } = await req.json().catch(() => ({}));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let showsToRemind: Show[] = [];

    if (showId) {
      console.log(`Processing reminder for specific show: ${showId}`);
      const { data: show, error } = await supabase
        .from("shows")
        .select("id, title, date, venue, ticket_link")
        .eq("id", showId)
        .single();

      if (error) throw error;
      if (show) showsToRemind.push(show as Show);
    } else {
      console.log("Processing scheduled reminders for upcoming shows");
      // Find shows starting in 24-25 hours
      // Note: This logic assumes 'date' is an ISO string or compatible format.
      const now = new Date();
      const startRange = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const endRange = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

      const { data: shows, error } = await supabase
        .from("shows")
        .select("id, title, date, venue, ticket_link")
        .eq("status", "approved")
        .gte("date", startRange)
        .lt("date", endRange);

      if (error) {
        console.error("Error fetching scheduled shows:", error);
        throw error;
      }
      if (shows) showsToRemind = shows as Show[];
    }

    console.log(`Found ${showsToRemind.length} shows to send reminders for.`);

    const results = [];

    for (const show of showsToRemind) {
      // Fetch interested users (favorites)
      // Using 'favorites' table as the source of interest/interaction
      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("user_id")
        .eq("show_id", show.id);

      if (favError) {
        console.error(`Error fetching favorites for show ${show.id}:`, favError);
        continue;
      }

      console.log(`Found ${favorites?.length || 0} interested users for show: ${show.title}`);

      for (const fav of favorites || []) {
        // Fetch user email using admin API
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(fav.user_id);

        if (userError || !userData?.user?.email) {
          console.error(`Error fetching user ${fav.user_id}:`, userError);
          continue;
        }

        const email = userData.user.email;
        const showDate = new Date(show.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Send email via Resend
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "StageLink <reminders@resend.dev>",
            to: [email],
            subject: `Reminder: "${show.title}" is starting soon!`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; margin-bottom: 20px;">Don't Miss the Show! 🎭</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  This is a friendly reminder that <strong>"${show.title}"</strong> is coming up soon.
                </p>

                <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                  <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Date:</strong> ${showDate}</p>
                  ${show.venue ? `<p style="margin: 5px 0; font-size: 16px;"><strong>📍 Venue:</strong> ${show.venue}</p>` : ''}
                  ${show.ticket_link ? `<p style="margin: 20px 0 0 0;"><a href="${show.ticket_link}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get Tickets</a></p>` : ''}
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 40px;">
                  You received this email because you favorited this show on StageLink.
                  <br/>
                  <a href="https://www.stagelink.show/show/${show.id}" style="color: #666; text-decoration: underline;">View Show Details</a>
                </p>
              </div>
            `,
          }),
        });

        const emailData = await emailRes.json();
        results.push({
          email,
          show: show.title,
          status: emailRes.status,
          id: emailData.id
        });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in send-show-reminder function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
