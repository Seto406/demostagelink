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

interface Ticket {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shows: {
    id: string;
    title: string;
    show_time: string;
    venue: string | null;
    poster_url: string | null;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find used tickets that haven't received a thank you email
    // and where the show started at least 4 hours ago (assuming show is over)
    const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        id,
        user_id,
        customer_email,
        customer_name,
        shows (
          id,
          title,
          show_time,
          venue,
          poster_url
        )
      `)
      .eq("status", "used")
      .eq("thank_you_mail_sent", false)
      .lt("shows.show_time", cutoffTime) // This filtering might need to be done in JS if inner join filtering is tricky
      .limit(50); // Process in batches

    if (error) {
        console.error("Error fetching tickets:", error);
        throw error;
    }

    if (!tickets || tickets.length === 0) {
        return new Response(JSON.stringify({ message: "No tickets to process" }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Filter in JS to ensure show_time condition is met (Supabase inner join filtering can be tricky with dot notation depending on version)
    // Actually, PostgREST supports filtering on embedded resources, but let's be safe.
    // Cast to unknown first to avoid linter issues with 'any'
    const ticketsToProcess = (tickets as unknown as Ticket[]).filter((t) => {
        if (!t.shows || !t.shows.show_time) return false;
        const showTime = new Date(t.shows.show_time).getTime();
        const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
        return showTime < fourHoursAgo;
    });

    console.log(`Found ${ticketsToProcess.length} tickets to send thank you emails.`);

    const limit = pLimit(5);
    const results = await Promise.all(
        ticketsToProcess.map((ticket) => limit(async () => {
            const show = ticket.shows;
            let email = ticket.customer_email;
            const name = ticket.customer_name || "Theater Lover";

            // If user_id exists, fetch email from auth (or profile if stored there, but usually auth)
            // But we don't have access to auth.users easily without RPC.
            // However, most users have email in profiles? No.
            // We can try to use the RPC `get_user_emails` if it exists.
            if (!email && ticket.user_id) {
                 const { data: userEmailData } = await supabase.rpc("get_user_emails", {
                    user_ids: [ticket.user_id],
                 });
                 if (userEmailData && userEmailData.length > 0) {
                     email = userEmailData[0].email;
                 }
            }

            if (!email) {
                console.warn(`No email found for ticket ${ticket.id}`);
                return { id: ticket.id, status: "skipped_no_email" };
            }

            // Send Email
            const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "StageLink <hello@stagelink.show>",
                    to: [email],
                    subject: `Thanks for watching "${show.title}"! 🎭`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Hope you enjoyed the show!</h1>
                            <p>Hi ${name},</p>
                            <p>Thank you for attending <strong>${show.title}</strong>.</p>
                            <p>We'd love to hear your thoughts! Please verify your attendance by leaving a review.</p>
                            <div style="margin: 30px 0;">
                                <a href="https://www.stagelink.show/show/${show.id}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Leave a Review</a>
                            </div>
                            <p>See you at the next curtain call!</p>
                        </div>
                    `,
                }),
            });

            if (emailRes.ok) {
                // Update ticket
                await supabase
                    .from("tickets")
                    .update({ thank_you_mail_sent: true })
                    .eq("id", ticket.id);
                return { id: ticket.id, status: "sent" };
            } else {
                const err = await emailRes.text();
                console.error(`Failed to send email to ${email}:`, err);
                return { id: ticket.id, status: "failed", error: err };
            }
        }))
    );

    return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

export { handler };
serve(handler);
