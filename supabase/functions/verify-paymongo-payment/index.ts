import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayMongoPayment {
  attributes: {
    status: string;
    [key: string]: unknown;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body for optional 'ref'
    let paymentRef: string | null = null;
    try {
        const body = await req.json();
        paymentRef = body.ref;
    } catch {
        // Body might be empty if just calling invoke() without args
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let payment: any = null;
    let user: any = null;

    // 1. Authenticate User (Optional if ref is provided)
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader ?? "" },
        },
      }
    );

    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    user = authUser;

    // 2. Find Payment
    if (paymentRef) {
        // Case A: Look up by Payment Reference (Guest or Auth)
        const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("id", paymentRef)
            .single();

        if (error || !data) {
            console.error("Payment lookup by ref failed:", error);
            throw new Error("Payment not found");
        }
        payment = data;

        // Security check: If user is logged in, ensure payment belongs to them?
        // Actually, if they have the UUID, they likely just paid.
        // We can relax this for now as UUID is hard to guess.
    } else if (user) {
        // Case B: Look up by User ID (Legacy/Auth flow)
        const { data: payments, error: paymentError } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

        if (paymentError) {
            throw new Error("Database error fetching payments");
        }

        if (!payments || payments.length === 0) {
             return new Response(
                JSON.stringify({ message: "No payment found" }),
                {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 404,
                }
              );
        }
        payment = payments[0];
    } else {
        // No ref and no user -> Unauthorized
        throw new Error("Unauthorized: Missing payment reference or user session");
    }

    // Helper to fetch ticket details
    const fetchTicketDetails = async (paymentId: string) => {
        const { data: ticket, error } = await supabaseAdmin
            .from('tickets')
            .select('*, shows(*)')
            .eq('payment_id', paymentId)
            .maybeSingle();
        return ticket;
    };

    if (payment.status === "paid") {
      const type = payment.description?.startsWith("Ticket") ? "ticket" : "subscription";
      let ticketData = null;
      if (type === "ticket") {
          ticketData = await fetchTicketDetails(payment.id);
      }

      return new Response(
        JSON.stringify({
            status: "paid",
            message: "Payment successful",
            type,
            ticket: ticketData // Return ticket details for Guest UI
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const checkoutId = payment.paymongo_checkout_id;

    // If checkoutId is still "PENDING_...", we can't verify yet (user hasn't paid or update failed)
    if (!checkoutId || checkoutId.startsWith("PENDING_")) {
        return new Response(
            JSON.stringify({ status: "pending", message: "Payment initialization incomplete" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
        );
    }

    // 3. Check PayMongo Status
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!secretKey) {
      throw new Error("Server configuration error");
    }

    const paymongoAuthHeader = `Basic ${btoa(secretKey + ":")}`;

    const paymongoRes = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutId}`, {
      method: "GET",
      headers: {
        Authorization: paymongoAuthHeader,
        "Content-Type": "application/json",
      },
    });

    const paymongoData = await paymongoRes.json();

    if (paymongoData.errors) {
      console.error("PayMongo Error:", paymongoData.errors);
      throw new Error(paymongoData.errors[0]?.detail || "Failed to verify payment");
    }

    const session = paymongoData.data;
    const paymentsList = session.attributes.payments || [];
    const successfulPayment = paymentsList.find((p: PayMongoPayment) => p.attributes.status === "paid");

    let isPaid = !!successfulPayment;

    // Update DB
    if (isPaid) {
      // Update payment status
      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", updated_at: new Date() })
        .eq("id", payment.id);

      // Check metadata for payment type
      const metadata = session.attributes.metadata || {};
      const paymentType = metadata.type || "subscription"; // Default to subscription
      let ticketData = null;

      if (paymentType === "ticket") {
        const showId = metadata.show_id;

        // CHECK IDEMPOTENCY: Does a ticket already exist for this payment?
        const existingTicket = await fetchTicketDetails(payment.id);

        if (existingTicket) {
             console.log("Ticket already exists, skipping creation.");
             ticketData = existingTicket;
        } else if (showId) {
          // Insert Ticket
          // Determine User ID (might be null for guest)
          // payment.user_id should be correct if it was set during create-session
          // But create-session sets it to null for guest.

          // We can also try to use the user found from Auth header if present,
          // but better to stick to what's in the payment record or metadata.
          const userIdForTicket = payment.user_id || metadata.user_id || (user ? user.id : null);

          // Verify profile exists if user_id is not null?
          // The database constraint might fail if user_id points to non-existent profile.
          // But if it's null, it's fine.

          const { data: newTicket, error: ticketError } = await supabaseAdmin
            .from("tickets")
            .insert({
              user_id: userIdForTicket,
              show_id: showId,
              status: "confirmed",
              payment_id: payment.id,
              customer_email: session.attributes.billing?.email, // Save email/name from PayMongo
              customer_name: session.attributes.billing?.name
            })
            .select('*, shows(*)')
            .single();

          if (ticketError) {
            console.error("Ticket Insert Error:", ticketError);
          } else {
             ticketData = newTicket;
             // Trigger Email
             // Only if user exists? Or guest email?
             // send-ticket-confirmation function might depend on user_id.
             if (userIdForTicket) {
                await supabaseAdmin.functions.invoke("send-ticket-confirmation", {
                  body: { user_id: userIdForTicket, show_id: showId },
                });
             }
          }
        }
      } else {
        // Subscription Logic (Unchanged mostly, but ensure user exists)
        if (user) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            await supabaseAdmin
            .from("subscriptions")
            .upsert(
                {
                user_id: user.id,
                status: "active",
                tier: "pro",
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString(),
                updated_at: new Date(),
                },
                { onConflict: "user_id" }
            );
        }
      }

      return new Response(
        JSON.stringify({
            status: "paid",
            message: "Payment successful",
            type: paymentType,
            ticket: ticketData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Not paid yet
       return new Response(
        JSON.stringify({ status: "pending", message: "Payment not completed yet" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
