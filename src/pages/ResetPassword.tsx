import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
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

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
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
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background border-secondary/30 focus:border-secondary"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-background border-secondary/30 focus:border-secondary"
                        required
                        minLength={6}
                      />
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
