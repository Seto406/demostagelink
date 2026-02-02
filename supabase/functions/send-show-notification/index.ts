import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  showId: string;
  showTitle: string;
  status: "approved" | "rejected";
  producerId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { showId, showTitle, status, producerId }: NotificationRequest = await req.json();

    console.log(`Processing notification for show: ${showTitle}, status: ${status}`);

    // Create Supabase client to get producer email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the producer's email from auth.users via the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", producerId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Could not find producer profile");
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not find producer email");
    }

    const producerEmail = userData.user.email;
    console.log(`Sending notification to: ${producerEmail}`);

    const isApproved = status === "approved";
    const subject = isApproved 
      ? `🎭 Great news! "${showTitle}" has been approved!`
      : `Update on your submission: "${showTitle}"`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; margin-bottom: 20px;">Your Show Has Been Approved! 🎉</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Congratulations! Your show <strong>"${showTitle}"</strong> has been reviewed and approved by our admin team.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Your production is now visible on the public StageLink feed where audiences can discover and learn about your show.
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #166534;">
              <strong>What's next?</strong><br/>
              Make sure your show details are up to date and consider adding a ticket link to drive sales!
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Best of luck with your production!<br/>
            — The StageLink Team
          </p>
        </div>
      `
      : `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444; margin-bottom: 20px;">Update on Your Submission</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We've reviewed your show <strong>"${showTitle}"</strong> and unfortunately, it has not been approved at this time.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            This could be due to incomplete information, content guidelines, or other factors. Please review your submission and feel free to update and resubmit.
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Need help?</strong><br/>
              If you have questions about why your show wasn't approved, please reach out to our support team.
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            We appreciate your interest in StageLink.<br/>
            — The StageLink Team
          </p>
        </div>
      `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StageLink <hello@stagelink.show>",
        to: [producerEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-show-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
