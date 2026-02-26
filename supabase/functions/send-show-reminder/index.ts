import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pLimit from "https://esm.sh/p-limit@4.0.0";

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
  show_time: string;
  venue: string | null;
  ticket_link: string | null;
  seo_metadata?: {
    reminder_sent?: boolean;
    [key: string]: unknown;
  };
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
        .select("id, title, show_time, venue, ticket_link, seo_metadata")
        .eq("id", showId)
        .single();

      if (error) throw error;
      if (show) showsToRemind.push(show as Show);
    } else {
      console.log("Processing scheduled reminders for upcoming shows");
      // Find shows starting in 24-25 hours
      const now = new Date();
      const startRange = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const endRange = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

      const { data: shows, error } = await supabase
        .from("shows")
        .select("id, title, show_time, venue, ticket_link, seo_metadata")
        .eq("status", "approved")
        .gte("show_time", startRange)
        .lt("show_time", endRange);

      if (error) {
        console.error("Error fetching scheduled shows:", error);
        throw error;
      }

      // Filter out shows that already sent reminders
      if (shows) {
        showsToRemind = (shows as Show[]).filter(s => !s.seo_metadata?.reminder_sent);
      }
    }

    console.log(`Found ${showsToRemind.length} shows to send reminders for.`);

    const limit = pLimit(5); // Limit concurrency to respect API rate limits

    const showPromises = showsToRemind.map(async (show) => {
      // Fetch ticket holders
      const { data: tickets, error: ticketError } = await supabase
        .from("tickets")
        .select("user_id")
        .eq("show_id", show.id)
        .eq("status", "confirmed");

      if (ticketError) {
        console.error(`Error fetching tickets for show ${show.id}:`, ticketError);
        return [];
      }

      console.log(`Found ${tickets?.length || 0} ticket holders for show: ${show.title}`);

      // Batch fetch user emails
      const userIds = tickets?.map((t) => t.user_id) || [];
      const emailMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: userEmails, error: emailError } = await supabase.rpc("get_user_emails", {
          user_ids: userIds,
        });

        if (emailError) {
          console.error(`Error fetching emails for show ${show.id}:`, emailError);
        } else if (userEmails) {
          userEmails.forEach((u: { user_id: string; email: string }) => {
            if (u.email) emailMap.set(u.user_id, u.email);
          });
        }
      }

      const ticketPromises = (tickets || []).map((ticket) => limit(async () => {
        const email = emailMap.get(ticket.user_id);

        if (!email) {
          console.error(`Email not found for user ${ticket.user_id}`);
          return null;
        }

        const showDate = new Date(show.show_time).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });

        // Send email via Resend
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "StageLink <hello@stagelink.show>",
            to: [email],
            subject: `Reminder: "${show.title}" is starting soon!`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; margin-bottom: 20px;">Your Show is Coming Up! 🎭</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  This is a friendly reminder that you have tickets for <strong>"${show.title}"</strong>.
                </p>

                <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                  <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Date & Time:</strong> ${showDate}</p>
                  ${show.venue ? `<p style="margin: 5px 0; font-size: 16px;"><strong>📍 Venue:</strong> ${show.venue}</p>` : ''}
                  <p style="margin: 20px 0 0 0;"><a href="https://www.stagelink.show/show/${show.id}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Show Details</a></p>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 40px;">
                  You received this email because you have a confirmed ticket for this show on StageLink.
                </p>
              </div>
            `,
          }),
        });

        const emailData = await emailRes.json();
        return {
          email,
          show: show.title,
          status: emailRes.status,
          id: emailData.id
        };
      }));

      // After sending to all tickets, update show metadata
      await Promise.all(ticketPromises);

      // Update show metadata to prevent duplicate reminders
      const currentMetadata = show.seo_metadata || {};
      const { error: updateError } = await supabase
        .from("shows")
        .update({
            seo_metadata: {
                ...currentMetadata,
                reminder_sent: true,
                reminder_sent_at: new Date().toISOString()
            }
        })
        .eq("id", show.id);

      if (updateError) {
          console.error(`Failed to update reminder status for show ${show.id}:`, updateError);
      }

      return ticketPromises;
    });

    const resultsNested = await Promise.all(showPromises);
    const results = resultsNested.flat().filter(r => r !== null);

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

export { handler };
serve(handler);
