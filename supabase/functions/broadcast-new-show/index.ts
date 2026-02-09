import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BroadcastRequest {
  showId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { showId }: BroadcastRequest = await req.json();

    if (!showId) {
      throw new Error("Missing showId");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    // 1. Authorize User (Check if Admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check role in profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    // 2. Initialize Admin Client for Sensitive Operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Fetch Show Details
    const { data: show, error: showError } = await supabaseAdmin
      .from("shows")
      .select("title, description, poster_url, status")
      .eq("id", showId)
      .single();

    if (showError || !show) {
      throw new Error("Show not found");
    }

    if (show.status !== 'approved') {
       throw new Error("Show is not approved. Cannot broadcast.");
    }

    // 4. Fetch Audience User IDs
    // We want all users with role 'audience'
    const { data: audienceProfiles, error: audienceError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("role", "audience");

    if (audienceError) {
      throw new Error("Failed to fetch audience profiles");
    }

    if (!audienceProfiles || audienceProfiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No audience members found", count: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userIds = audienceProfiles.map(p => p.user_id);
    console.log(`Found ${userIds.length} audience members to notify.`);

    // 5. Fetch Emails using RPC (SECURITY DEFINER)
    const { data: userEmails, error: emailsError } = await supabaseAdmin
      .rpc('get_user_emails', { user_ids: userIds });

    if (emailsError) {
        console.error("Error fetching emails via RPC:", emailsError);
        throw new Error("Failed to fetch user emails");
    }

    if (!userEmails || userEmails.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No emails found for audience members", count: 0 }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const validEmails = (userEmails as { email: string | null }[])
      .filter((u) => u.email)
      .map((u) => u.email);
    console.log(`Sending to ${validEmails.length} valid email addresses.`);

    // 6. Send Emails via Resend Batch API
    // Resend Batch API allows up to 100 emails per request
    const BATCH_SIZE = 100;
    const batches = [];

    // Construct email objects
    const emailObjects = validEmails.map((email: string) => {
      const subject = `New Show Alert: ${show.title}`;
      const htmlContent = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6; margin-bottom: 20px;">New Show Alert! 🎭</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            A new show has just been added to StageLink:
          </p>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #f9fafb;">
            <h2 style="margin-top: 0; color: #111;">${show.title}</h2>
            ${show.poster_url ? `<img src="${show.poster_url}" alt="${show.title}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px;" />` : ''}
            <p style="color: #555; font-style: italic;">${show.description || 'No description available.'}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Check it out now on the StageLink feed!
          </p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://stagelink.show/" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Show</a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 40px; text-align: center;">
            You are receiving this because you are a registered audience member on StageLink.
          </p>
        </div>
      `;

      return {
        from: "StageLink <hello@stagelink.show>",
        to: [email],
        subject: subject,
        html: htmlContent,
      };
    });

    // Chunk into batches
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
        batches.push(emailObjects.slice(i, i + BATCH_SIZE));
    }

    console.log(`Sending ${batches.length} batches via Resend.`);

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

    // Analyze results
    const successfulBatches = results.filter(r => !r.error && r.data).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Broadcast processed.`,
      batches_sent: successfulBatches,
      total_emails: validEmails.length
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in broadcast-new-show:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("Unauthorized") ? 401 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
