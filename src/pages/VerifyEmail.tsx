import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "verifying" | "success" | "error";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type === "email") {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            toast({
              title: "Verification failed",
              description: error.message,
              variant: "destructive",
            });
          } else {
            setStatus("success");
            toast({
              title: "Email verified!",
              description: "Your account is now active.",
            });
          }
        } catch (err) {
          setStatus("error");
          setErrorMessage("An unexpected error occurred");
        }
      } else {
        // No token, check if we're just showing the pending state
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          // Already verified, redirect
          navigate("/");
        } else if (!tokenHash) {
          // Show pending verification UI
          setStatus("verifying");
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const handleContinue = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-card border border-secondary/20 p-8 text-center">
              <img 
                src={stageLinkLogo} 
                alt="StageLink" 
                className="h-16 w-auto mx-auto mb-6"
              />

              {status === "verifying" && !searchParams.get("token_hash") && (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                    Check Your Email
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    We've sent a verification link to your email address. 
                    Please click the link to verify your account.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button 
                      onClick={() => navigate("/login")}
                      className="text-secondary hover:underline"
                    >
                      try signing up again
                    </button>
                  </p>
                </>
              )}

              {status === "verifying" && searchParams.get("token_hash") && (
                <>
                  <Loader2 className="h-12 w-12 text-secondary animate-spin mx-auto mb-6" />
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                    Verifying Your Email
                  </h1>
                  <p className="text-muted-foreground">
                    Please wait while we verify your email address...
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                    Email Verified!
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Your email has been verified successfully. You can now log in to your account.
                  </p>
                  <Button variant="hero" onClick={handleContinue} className="w-full">
                    Continue to Login
                  </Button>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                    Verification Failed
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    {errorMessage || "The verification link may have expired or is invalid."}
                  </p>
                  <Button variant="hero" onClick={() => navigate("/login")} className="w-full">
                    Back to Login
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
