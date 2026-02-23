import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { XCircle, Clock, MapPin, Calendar, Ticket, Home, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGamification } from "@/hooks/useGamification";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ShowDetails {
  title: string;
  date: string | null;
  venue: string | null;
  poster_url: string | null;
  show_time: string | null;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentRef = searchParams.get("ref");
  const queryClient = useQueryClient();
  const { addXp } = useGamification();
  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "processing">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<ShowDetails | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("Verifying payment with ref:", paymentRef);
        const { data, error } = await supabase.functions.invoke("verify-paymongo-payment", {
          body: { ref: paymentRef }
        });

        if (error) throw error;

        if (data.status === "paid") {
          setStatus("success");
          setPaymentType(data.type);

          if (data.type === "ticket") {
             setMessage("You're all set! Your ticket has been confirmed.");

             // Use ticket details from response (works for Guest & Auth)
             if (data.ticket && data.ticket.shows) {
                console.log("Using ticket details from API response");
                setShowDetails(data.ticket.shows as unknown as ShowDetails);
             } else {
                 // Fallback: Fetch ticket and show details if user is logged in
                 const { data: { user } } = await supabase.auth.getUser();
                 if (user) {
                   const { data: ticket } = await supabase
                     .from('tickets')
                     .select('*, shows(*)')
                     .eq('user_id', user.id)
                     .order('created_at', { ascending: false })
                     .limit(1)
                     .maybeSingle(); // Changed to maybeSingle to handle empty results safely

                   if (ticket && ticket.shows) {
                     setShowDetails(ticket.shows as unknown as ShowDetails);
                   }
                 }
             }

          } else {
             setMessage("Payment successful! Your subscription is now active.");
          }

          // Award XP for payment
          try {
            await addXp(100);
          } catch (xpError) {
            console.error("Failed to award XP:", xpError);
            // Non-blocking error
          }
          // Invalidate queries to refresh status
          queryClient.invalidateQueries({ queryKey: ["subscription"] });
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        } else if (data.status === "pending") {
          setStatus("processing");
          setMessage(data.message || "Payment is still processing. Please wait a moment.");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");
        setMessage("Could not verify payment. Please contact support if you were charged.");
      }
    };

    verifyPayment();
  }, [queryClient, addXp, paymentRef]);

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
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-foreground">
                  {paymentType === "ticket" ? "Booking Confirmed!" : "Payment Successful!"}
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </div>

            {paymentType === "ticket" && showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-secondary/10 rounded-xl overflow-hidden border border-secondary/20 text-left"
              >
                 <div className="flex gap-4 p-4">
                    {showDetails.poster_url && (
                        <div className="w-20 h-28 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                            <img
                                src={showDetails.poster_url}
                                alt={showDetails.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className="flex-1 space-y-2 py-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">{showDetails.title}</h3>

                        <div className="space-y-1 text-sm text-muted-foreground">
                            {(showDetails.date || showDetails.show_time) && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span>
                                        {showDetails.date ? format(new Date(showDetails.date), 'MMM d, yyyy') : ''}
                                        {showDetails.date && showDetails.show_time ? ' • ' : ''}
                                        {showDetails.show_time ? format(new Date(`2000-01-01T${showDetails.show_time}`), 'h:mm a') : ''}
                                    </span>
                                </div>
                            )}
                            {showDetails.venue && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="line-clamp-1">{showDetails.venue}</span>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              {paymentType === "ticket" ? (
                  <Button onClick={() => navigate("/profile")} className="w-full h-12 text-base font-semibold group">
                    <Ticket className="mr-2 w-5 h-5" />
                    View My Digital Pass
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
