import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo-new.png";
import { Eye, EyeOff, Check, X } from "lucide-react";

type ResetMode = "request" | "update";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<ResetMode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if we have a recovery token in the URL
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If there's a session with a recovery type, show password update form
      if (session?.user) {
        const event = searchParams.get("type");
        if (event === "recovery") {
          setMode("update");
        }
      }
    };

    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, generate the reset link using Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Send branded email via our edge function
        try {
          await supabase.functions.invoke("send-password-reset", {
            body: {
              email,
              redirectTo: `${window.location.origin}/reset-password?type=recovery`,
            },
          });
        } catch (emailErr) {
          console.error("Failed to send branded email, falling back to default:", emailErr);
        }
        
        setEmailSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  // Password must be 8+ characters with at least one number or special character
  const validatePassword = (pwd: string): { isValid: boolean; message: string } => {
    if (pwd.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters" };
    }
    // eslint-disable-next-line no-useless-escape
    if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return { isValid: false, message: "Password must include at least one number or special character" };
    }
    return { isValid: true, message: "" };
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements Not Met",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated!",
          description: "You can now log in with your new password.",
        });
        await supabase.auth.signOut();
        navigate("/login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
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
            <div className="bg-card border border-secondary/20 p-8">
              <img 
                src={stageLinkLogo} 
                alt="StageLink" 
                className="h-16 w-auto mx-auto mb-6"
              />

              {mode === "request" ? (
                emailSent ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
                      Check Your Email
                    </h1>
                    <p className="text-muted-foreground mb-6">
                      We've sent a password reset link to <strong className="text-foreground">{email}</strong>. 
                      Click the link in the email to reset your password.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setEmailSent(false)}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-serif font-bold text-foreground mb-2 text-center">
                      Reset Password
                    </h1>
                    <p className="text-muted-foreground text-sm mb-8 text-center">
                      Enter your email and we'll send you a reset link
                    </p>

                    <form onSubmit={handleRequestReset} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background border-secondary/30 focus:border-secondary"
                          required
                        />
                      </div>

                      <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </>
                )
              ) : (
                <>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-2 text-center">
                    Set New Password
                  </h1>
                  <p className="text-muted-foreground text-sm mb-8 text-center">
                    Enter your new password below
                  </p>

                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background border-secondary/30 focus:border-secondary pr-10"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Password Requirements Checklist */}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2 text-xs">
                          {password.length >= 8 ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className={password.length >= 8 ? "text-green-500" : "text-muted-foreground"}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {/* eslint-disable-next-line no-useless-escape */}
                          {/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password) ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {/* eslint-disable-next-line no-useless-escape */}
                          <span className={/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
                            Number or special character
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-background border-secondary/30 focus:border-secondary pr-10"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {confirmPassword.length > 0 && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                          {password === confirmPassword ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-green-500">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-red-500">Passwords don't match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </>
              )}

              <p className="text-center text-muted-foreground text-sm mt-6">
                Remember your password?{" "}
                <button 
                  onClick={() => navigate("/login")}
                  className="text-secondary cursor-pointer hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
