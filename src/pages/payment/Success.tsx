import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGamification } from "@/hooks/useGamification";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addXp } = useGamification();
  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "processing">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentType, setPaymentType] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-paymongo-payment");

        if (error) throw error;

        if (data.status === "paid") {
          setStatus("success");
          setPaymentType(data.type);

          if (data.type === "ticket") {
             setMessage("You're all set! Your ticket has been confirmed.");
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
  }, [queryClient, addXp]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-secondary/20 rounded-2xl p-8 text-center space-y-6">
        {status === "verifying" && (
          <>
            <BrandedLoader size="lg" text="Verifying..." />
            <h2 className="text-xl font-serif font-semibold text-foreground">Verifying Payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground">
                {paymentType === "ticket" ? "Seat Secured!" : "Payment Successful!"}
            </h2>
            <p className="text-muted-foreground">{message}</p>

            {paymentType === "ticket" ? (
                <Button onClick={() => navigate("/profile")} className="w-full">
                  View Digital Pass
                </Button>
            ) : (
                <Button onClick={() => navigate("/settings")} className="w-full">
                  Return to Settings
                </Button>
            )}
          </>
        )}

        {status === "processing" && (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Payment Processing</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Check Again
              </Button>
              <Button onClick={() => navigate("/settings")} className="w-full">
                Return to Settings
              </Button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate("/settings")} className="w-full">
                Return to Settings
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
