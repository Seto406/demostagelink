import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    if (!record || !record.id) {
      throw new Error("Invalid payload: Missing record or ID");
    }

    // Double check status change logic (redundant to trigger but safe)
    if (record.status !== 'approved') {
      return new Response(JSON.stringify({ message: "Show not approved, skipping notification." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if status changed from something else to approved
    // Note: old_record might be null on INSERT, but trigger is AFTER UPDATE usually.
    // However, if logic is shared, check old_record if present.
    if (old_record && old_record.status === 'approved') {
       return new Response(JSON.stringify({ message: "Show was already approved, skipping notification." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch Audience User IDs
    const { data: audienceProfiles, error: audienceError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .eq("role", "audience");

    if (audienceError) {
      console.error("Error fetching audience profiles:", audienceError);
      throw new Error("Failed to fetch audience profiles");
    }

    if (!audienceProfiles || audienceProfiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No audience members found", count: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${audienceProfiles.length} audience members to notify about show: ${record.title}`);

    const validEmails = audienceProfiles
      .map((p: any) => p.email)
      .filter((email: any) => email && typeof email === 'string' && email.length > 0)
      .filter((email: string) => ['stagelinkjules@gmail.com', 'connect.stagelink@gmail.com'].includes(email));

    if (validEmails.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No valid emails found", count: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending to ${validEmails.length} valid email addresses.`);

    // Prepare Email Content (once)
    const subject = `New Arrival: ${record.title}`;
    const showLink = `https://stagelink.show/shows/${record.id}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${record.poster_url ? `<img src="${record.poster_url}" alt="${record.title}" style="display: block; width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin-bottom: 20px;" />` : ''}
        <h1 style="color: #111; font-size: 24px; margin: 0 0 10px 0;">${record.title}</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #555; margin: 0 0 20px 0;">
          ${record.description || 'No description available.'}
        </p>
        <div style="margin-top: 30px;">
          <a href="${showLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Tickets</a>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 40px; text-align: center;">
          You are receiving this because you are a registered audience member on StageLink.
        </p>
      </div>
    `;

    // Send Emails via Resend Batch API
    const BATCH_SIZE = 100;
    const batches = [];

    // Construct email objects
    const emailObjects = validEmails.map((email: string) => ({
      from: "StageLink <hello@stagelink.show>",
      to: [email],
      subject: subject,
      html: htmlContent,
    }));

    // Chunk into batches
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
        batches.push(emailObjects.slice(i, i + BATCH_SIZE));
    }

    const batchPromises = batches.map(batch =>
        fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(batch),
        }).then(res => res.json()).catch(err => ({ error: err.message }))
    );

    const results = await Promise.all(batchPromises);
    const successfulBatches = results.filter(r => !r.error && r.data).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Notification processed.`,
      batches_sent: successfulBatches,
      total_emails: validEmails.length
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in notify-new-show:", error);
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
