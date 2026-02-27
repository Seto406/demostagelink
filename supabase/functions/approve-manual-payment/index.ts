import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { payment_id, action } = await req.json(); // action: 'approve' | 'reject'

    if (!payment_id || !action) throw new Error("Missing payment_id or action");

    // Check Auth (Must be Admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        console.error("User authentication failed:", userError);
        throw new Error("Unauthorized: Invalid user token");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify Admin Role
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error("Forbidden: Admin only");

    if (action === 'approve') {
        // Update Payment
        const { error: payError } = await supabaseAdmin.from("payments").update({ status: 'paid' }).eq("id", payment_id);
        if (payError) throw payError;

        // Update Ticket
        const { data: ticket, error: tickError } = await supabaseAdmin
            .from("tickets")
            .update({ status: 'confirmed' })
            .eq("payment_id", payment_id)
            .select("*, shows(title, date, venue)")
            .maybeSingle();

        if (tickError) throw tickError;

        // Send Email via existing function
        if (ticket) {
            console.log(`Approved payment ${payment_id}, sending confirmation email.`);

            let authUserId = null;
            // Resolve Profile ID to Auth ID if applicable
            if (ticket.user_id) {
                const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("user_id")
                    .eq("id", ticket.user_id)
                    .maybeSingle();

                if (profile) {
                    authUserId = profile.user_id;
                }
            }

            await supabaseAdmin.functions.invoke("send-ticket-confirmation", {
                body: {
                    user_id: authUserId,
                    show_id: ticket.show_id,
                    email: ticket.customer_email,
                    name: ticket.customer_name
                }
            });
        }
    } else if (action === 'reject') {
        // Reject Payment
        const { error: payError } = await supabaseAdmin.from("payments").update({ status: 'failed' }).eq("id", payment_id);
        if (payError) throw payError;

        // Cancel Ticket
        const { data: ticket, error: tickError } = await supabaseAdmin
            .from("tickets")
            .update({ status: 'cancelled' })
            .eq("payment_id", payment_id)
            .select("*, shows(title)")
            .maybeSingle();

        if (tickError) throw tickError;

        // Notify Rejection
         if (ticket) {
             console.log(`Rejected payment ${payment_id}, sending rejection email.`);
             const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
             if (RESEND_API_KEY) {
                // Resolve Email
                let email = ticket.customer_email;
                if (!email && ticket.user_id) {
                    const { data: u } = await supabaseAdmin.auth.admin.getUserById(ticket.user_id);
                    email = u?.user?.email;
                }

                if (email) {
                    await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${RESEND_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            from: "StageLink <notifications@stagelink.show>",
                            to: [email],
                            subject: `Payment Update: ${ticket.shows?.title || "Event"}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                  <p>Hi ${ticket.customer_name || "there"},</p>
                                  <p>We're sorry, but your payment for <strong>${ticket.shows?.title || "the event"}</strong> could not be verified and has been rejected.</p>
                                  <p>If you believe this is an error, please reply to this email with your proof of payment attached again.</p>
                                  <br/>
                                  <p>Best,<br/>The StageLink Team</p>
                                </div>
                            `
                        })
                    });
                }
             }
         }
    } else {
        throw new Error("Invalid action");
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
    });

  } catch (error: unknown) {
     console.error("Approve Manual Payment Error:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     const status = errorMessage.includes("Unauthorized") || errorMessage.includes("Forbidden") ? 401 : 400;

     return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: status
    });
  }
});
