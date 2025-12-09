import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { CheckCircle, Loader2, XCircle, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "verifying" | "pending" | "success" | "error";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check and update cooldown timer
  useEffect(() => {
    const checkCooldown = () => {
      const lastSent = localStorage.getItem("lastVerificationEmailSent");
      if (lastSent) {
        const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
        const remaining = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
        setCooldownRemaining(remaining);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      const { data: { session } } = await supabase.auth.getSession();
      const storedEmail = localStorage.getItem("pendingVerificationEmail");
      setEmail(session?.user?.email || storedEmail);

      if (tokenHash && type === "email") {
        setStatus("verifying");
        try {
          const { data, error } = await supabase.auth.verifyOtp({
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
            localStorage.removeItem("pendingVerificationEmail");
            localStorage.removeItem("lastVerificationEmailSent");
            
            if (data.user?.email) {
              const userRole = localStorage.getItem("pendingUserRole") as "audience" | "producer" || "audience";
              try {
                await supabase.functions.invoke("send-welcome-email", {
                  body: {
                    email: data.user.email,
                    name: data.user.user_metadata?.group_name,
                    role: userRole,
                  },
                });
              } catch (err) {
                console.error("Failed to send welcome email:", err);
              }
              localStorage.removeItem("pendingUserRole");
            }
            
            toast({
              title: "Email verified!",
              description: "Your account is now active. Check your inbox for a welcome email!",
            });
          }
        } catch (err) {
          setStatus("error");
          setErrorMessage("An unexpected error occurred");
        }
      } else {
        if (session?.user?.email_confirmed_at) {
          navigate("/");
        } else {
          setStatus("pending");
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email address found. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    if (cooldownRemaining > 0) {
      toast({
        title: "Please wait",
        description: `You can resend in ${cooldownRemaining} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Set cooldown
        localStorage.setItem("lastVerificationEmailSent", Date.now().toString());
        setCooldownRemaining(RESEND_COOLDOWN_SECONDS);
        toast({
          title: "Email sent!",
          description: "Check your inbox for the verification link.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

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

              {status === "pending" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-8 w-8 text-secondary" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                    Check Your Email
                  </h1>
                  <p className="text-muted-foreground mb-2">
                    We've sent a verification link to:
                  </p>
                  {email && (
                    <p className="text-secondary font-medium mb-6">{email}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-6">
                    Please click the link in the email to verify your account.
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={handleResendEmail}
                      disabled={isResending || cooldownRemaining > 0}
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : cooldownRemaining > 0 ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Resend in {cooldownRemaining}s
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Didn't receive the email? Check your spam folder or click above to resend.
                    </p>
                  </div>
                </>
              )}

              {status === "verifying" && (
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
                    Your email has been verified successfully. Check your inbox for a welcome email!
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
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </Button>
                    <Button variant="hero" onClick={() => navigate("/login")} className="w-full">
                      Back to Login
                    </Button>
                  </div>
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
