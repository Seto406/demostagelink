import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { XCircle, Clock, Ticket, Home, ArrowRight, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DigitalPass } from "@/components/profile/DigitalPass";
import { calculateReservationFee } from "@/lib/pricing";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentRef = searchParams.get("ref");
  const isManual = searchParams.get("manual") === "true";
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "processing">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<any | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    if (isManual) {
        setStatus("success");
        setPaymentType("ticket");
        setMessage("Your payment proof has been submitted for review. You will receive an email once approved.");
        return;
    }

    const verifyPayment = async () => {
      try {
        console.log("Verifying payment with ref:", paymentRef);
        const { data, error } = await supabase.functions.invoke("verify-paymongo-payment", {
          body: { ref: paymentRef }
        });

        if (!isMounted) return;

        if (error) throw error;

        if (data.status === "paid") {
          setStatus("success");
          setPaymentType(data.type);

          if (data.type === "ticket") {
             setMessage("You're all set! Your ticket has been confirmed.");

             // Use ticket details from response (works for Guest & Auth)
             if (data.ticket) {
                console.log("Using ticket details from API response");
                setTicketData(data.ticket);
             } else {
                 // Fallback: Fetch ticket specifically by paymentRef.
                 if (paymentRef) {
                     console.log("Fetching ticket by payment reference...");
                     const { data: ticket } = await supabase
                       .from('tickets')
                       .select('*, shows(*, profiles(group_name, niche), theater_groups(name))')
                       .eq('payment_id', paymentRef)
                       .maybeSingle();

                     if (ticket) {
                       setTicketData(ticket);
                     } else {
                         // Ticket not found yet (maybe webhook is slow?)
                         console.warn("Ticket not found for confirmed payment. Attempting fallback claim...");

                         // Try to claim/create ticket via Edge Function
                         const { data: claimData, error: claimError } = await supabase.functions.invoke('claim-tickets', {
                            body: { ref: paymentRef }
                         });

                         if (!claimError && claimData?.ticket) {
                            console.log("Ticket claimed/created successfully via Edge Function");
                            setTicketData(claimData.ticket);
                         } else {
                            console.error("Failed to claim ticket via Edge Function:", claimError);
                            setMessage("Payment confirmed! Your ticket is being generated and will appear in your profile shortly.");
                         }
                     }
                 }
             }

          } else {
             setMessage("Payment successful! Your subscription is now active.");
          }

          // Invalidate queries to refresh status
          queryClient.invalidateQueries({ queryKey: ["subscription"] });
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        } else if (data.status === "pending") {
          setStatus("processing");
          setMessage(data.message || "Payment is still processing. Please wait a moment.");
          // Retry after delay
          timeoutId = setTimeout(verifyPayment, 3000);
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Verification error:", error);
        setStatus("failed");
        setMessage("Could not verify payment. Please contact support if you were charged.");
      }
    };

    if (paymentRef) {
        verifyPayment();
    } else if (!isManual) {
        // No ref and not manual? Maybe arrived here by mistake or back button
        navigate("/feed");
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [queryClient, paymentRef, isManual, navigate]);

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => {
      const delay = 1 + i * 0.5;
      return {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
          opacity: { delay, duration: 0.01 }
        }
      };
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
      <div className="max-w-md w-full bg-card border border-secondary/20 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">

        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/5 blur-3xl pointer-events-none" />

        {status === "verifying" && (
          <div className="py-12">
            <BrandedLoader size="lg" text="Verifying..." />
            <h2 className="mt-4 text-xl font-serif font-semibold text-foreground">Finalizing Booking...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 mx-auto relative flex items-center justify-center">
               <motion.div
                className="absolute inset-0 bg-green-500/20 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
               />
               {isManual ? (
                   <div className="relative z-10 bg-green-500 rounded-full p-4">
                       <CheckCircle className="w-10 h-10 text-white" />
                   </div>
               ) : (
                   <motion.svg
                      viewBox="0 0 50 50"
                      className="w-16 h-16 text-green-500 relative z-10"
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.path
                        d="M14 26 L22 34 L36 18"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        variants={draw}
                        custom={0}
                      />
                    </motion.svg>
               )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-foreground">
                  {isManual ? "Payment Submitted" : (paymentType === "ticket" ? "Booking Confirmed!" : "Payment Successful!")}
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </div>

            {isManual ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-600 dark:text-yellow-400 text-left">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Pending Admin Review</p>
                            <p className="text-xs opacity-90 mt-1">
                                Your proof of payment has been received. Our team will verify it within 24-48 hours.
                                Once approved, your ticket will be sent to your email.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                paymentType === "ticket" && ticketData && ticketData.shows ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full text-left"
                  >
                      <DigitalPass
                        id={ticketData.shows.id}
                        title={ticketData.shows.title}
                        groupName={ticketData.shows.profiles?.group_name || ticketData.shows.theater_groups?.name || "StageLink Show"}
                        posterUrl={ticketData.shows.poster_url}
                        date={ticketData.shows.date}
                        venue={ticketData.shows.venue}
                        city={ticketData.shows.city}
                        status={ticketData.status}
                        ticketId={ticketData.id}
                        ticketPrice={ticketData.shows.price}
                        reservationFee={ticketData.shows.reservation_fee ?? calculateReservationFee(ticketData.shows.price || 0, ticketData.shows.profiles?.niche || null)}
                        paymentInstructions={(ticketData.shows.seo_metadata as { payment_instructions?: string } | null)?.payment_instructions}
                    />
                  </motion.div>
                ) : null
            )}

            <div className="flex flex-col gap-3 pt-4">
              {paymentType === "ticket" || isManual ? (
                  <Button onClick={() => navigate("/profile")} className="w-full h-12 text-base font-semibold group">
                    <Ticket className="mr-2 w-5 h-5" />
                    View My Passes in Profile
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
              ) : (
                  <Button onClick={() => navigate("/settings")} className="w-full h-12 text-base font-semibold">
                    Return to Settings
                  </Button>
              )}

              <Button variant="outline" onClick={() => navigate("/feed")} className="w-full">
                <Home className="mr-2 w-4 h-4" />
                Back to Feed
              </Button>
            </div>
          </motion.div>
        )}

        {status === "processing" && (
          <div className="py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Processing...</h2>
                <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Check Again
              </Button>
              <Button variant="ghost" onClick={() => navigate("/feed")} className="w-full">
                Back to Feed
              </Button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Verification Failed</h2>
                <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="default" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/feed")} className="w-full">
                Back to Feed
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
