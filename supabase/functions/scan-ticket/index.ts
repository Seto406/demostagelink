import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  producer_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket_id, access_code, show_id } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify User
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get User Profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find Ticket
    let ticketQuery = supabase
      .from("tickets")
      .select(`
        id,
        status,
        access_code,
        show_id,
        customer_name,
        customer_email,
        checked_in_at,
        profiles:user_id (
          username,
          avatar_url,
          group_name
        ),
        shows (
            id,
            title,
            producer_id
        )
      `);

    if (ticket_id) {
        // Validate UUID format before querying
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(ticket_id)) {
             return new Response(JSON.stringify({ error: "Invalid ticket ID format" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }
        ticketQuery = ticketQuery.eq("id", ticket_id);
    } else if (access_code) {
        ticketQuery = ticketQuery.eq("access_code", access_code.toUpperCase());
    } else {
      return new Response(JSON.stringify({ error: "Ticket ID or Access Code required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: ticket, error: ticketError } = await ticketQuery.single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify Show Context (Optional but recommended)
    if (show_id && ticket.show_id !== show_id) {
        return new Response(JSON.stringify({ error: "Ticket does not belong to this show" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Explicitly cast to unknown then Show to satisfy linter and type safety
    const show = ticket.shows as unknown as Show;

    if (!show) {
        return new Response(JSON.stringify({ error: "Show not found for ticket" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Permission Check
    let isAuthorized = false;

    // 1. Is Producer (Owner)
    if (show.producer_id === profile.id) {
        isAuthorized = true;
    } else {
        // 2. Is Authorized Group Member
        const { data: membership } = await supabase
            .from("group_members")
            .select("can_scan_tickets, role_in_group")
            .eq("user_id", profile.id)
            .eq("group_id", show.producer_id)
            .eq("status", "active")
            .single();

        if (membership && (membership.can_scan_tickets || profile.role === 'admin')) {
             isAuthorized = true;
        }

        // Admin override
        if (profile.role === 'admin') {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "You are not authorized to scan tickets for this show." }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Check if already used
    if (ticket.status === 'used' || ticket.checked_in_at) {
        return new Response(JSON.stringify({
            success: false,
            message: "Ticket already used",
            ticket: {
                id: ticket.id,
                status: ticket.status,
                checked_in_at: ticket.checked_in_at,
                attendee: ticket.profiles?.username || ticket.customer_name || "Guest"
            }
        }), {
            status: 200, // Return 200 but with success=false for specific UI handling
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Check if cancelled
    if (ticket.status === 'cancelled') {
         return new Response(JSON.stringify({
            success: false,
            message: "Ticket is cancelled",
             ticket: {
                id: ticket.id,
                status: ticket.status,
                attendee: ticket.profiles?.username || ticket.customer_name || "Guest"
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Update Ticket
    const { error: updateError } = await supabase
        .from("tickets")
        .update({
            status: 'used',
            checked_in_at: new Date().toISOString(),
            checked_in_by: user.id
        })
        .eq("id", ticket.id);

    if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to update ticket" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    return new Response(JSON.stringify({
        success: true,
        message: "Check-in successful",
        ticket: {
            id: ticket.id,
            status: 'used',
            checked_in_at: new Date().toISOString(),
            attendee: ticket.profiles?.username || ticket.customer_name || "Guest",
            type: (ticket.profiles?.group_name) ? "Member" : "General Admission"
        }
    }), {
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

serve(handler);
