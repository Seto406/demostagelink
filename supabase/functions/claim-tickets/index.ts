import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Body might be empty
  }

  const { ref } = body;

  try {
    const authHeader = req.headers.get("Authorization");
    // Initialize Supabase Client (Anon) to check user auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader ?? "" } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    // Initialize Admin client with SERVICE_ROLE_KEY for privileged database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (ref) {
      console.log(`Processing claim for payment ref: ${ref}`);

      // 1. Fetch Payment
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("id", ref)
        .maybeSingle();

      if (paymentError || !payment) {
        console.error("Payment fetch error:", paymentError);
        throw new Error("Payment not found");
      }

      if (payment.status !== "paid") {
        throw new Error("Payment not completed");
      }

      // 2. Check if Ticket Exists
      const { data: existingTicket, error: ticketError } = await supabaseAdmin
        .from("tickets")
        .select("*, shows(*, profiles(group_name, niche), theater_groups(name))")
        .eq("payment_id", payment.id)
        .maybeSingle();

      let ticketData = existingTicket;

      // 3. If User is Logged In, Get Profile ID
      let profileId = null;
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) profileId = profile.id;
      }

      // 4. Ticket Logic
      if (ticketData) {
        // Ticket exists. Claim if needed.
        if (!ticketData.user_id && profileId) {
          console.log(`Claiming ticket ${ticketData.id} for profile ${profileId}`);
          const { data: updatedTicket, error: updateError } = await supabaseAdmin
            .from("tickets")
            .update({ user_id: profileId })
            .eq("id", ticketData.id)
            .select("*, shows(*, profiles(group_name, niche), theater_groups(name))")
            .single();

          if (updateError) {
            console.error("Failed to claim ticket:", updateError);
          } else {
            ticketData = updatedTicket;
          }
        }
      } else {
        // Ticket missing. Create it.
        console.log("Ticket missing. Attempting to create from PayMongo metadata.");
        const checkoutId = payment.paymongo_checkout_id;
        if (!checkoutId) throw new Error("No checkout ID found on payment");

        const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
        if (!secretKey) throw new Error("Server configuration error: Missing PayMongo Secret");

        const paymongoRes = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutId}`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(secretKey + ":")}`,
            "Content-Type": "application/json",
          },
        });

        const paymongoData = await paymongoRes.json();
        if (paymongoData.errors) {
            console.error("PayMongo Error:", paymongoData.errors);
            throw new Error(paymongoData.errors[0]?.detail || "Failed to fetch PayMongo session");
        }

        const session = paymongoData.data;
        const metadata = session.attributes.metadata || {};
        const showId = metadata.show_id;

        if (!showId) throw new Error("Metadata missing show_id");

        // Insert Ticket
        const { data: newTicket, error: insertError } = await supabaseAdmin
          .from("tickets")
          .insert({
            user_id: profileId, // Assign to user if logged in, else null
            show_id: showId,
            status: "confirmed",
            payment_id: payment.id,
            customer_email: session.attributes.billing?.email,
            customer_name: session.attributes.billing?.name
          })
          .select("*, shows(*, profiles(group_name, niche), theater_groups(name))")
          .single();

        if (insertError) {
           console.error("Ticket Insert Error:", insertError);
           throw new Error("Failed to create ticket: " + insertError.message);
        }
        ticketData = newTicket;
      }

      return new Response(JSON.stringify({ success: true, ticket: ticketData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Legacy Flow: Claim by Email (No ref provided)
      if (userError || !user || !user.email) {
        console.log("No authenticated user found. Guest access - skipping legacy claim.");
        return new Response(JSON.stringify({ success: true, claimed: 0, message: "Guest access" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get Profile ID
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Profile not found");
      }

      console.log(`Claiming tickets for ${user.email} (Profile: ${profile.id})`);

      const { data: updatedTickets, error: updateError } = await supabaseAdmin
        .from("tickets")
        .update({ user_id: profile.id })
        .ilike("customer_email", user.email)
        .is("user_id", null)
        .select("id");

      if (updateError) {
        console.error("Ticket update error:", updateError);
        throw new Error("Failed to claim tickets");
      }

      const claimedCount = updatedTickets?.length || 0;
      console.log(`Claimed ${claimedCount} tickets.`);

      return new Response(JSON.stringify({ success: true, claimed: claimedCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Function Error:", error);
    console.error("Payload was:", JSON.stringify(body));

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
