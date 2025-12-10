import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BrandedLoader } from "@/components/ui/branded-loader";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { shakeVariants } from "@/hooks/use-shake";

type UserType = "audience" | "producer" | null;
type AuthMode = "login" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, signIn, signUp, loading } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile && !loading) {
      if (profile.role === "producer") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, profile, loading, navigate]);

  const triggerShake = () => {
    setFormError(true);
    setTimeout(() => setFormError(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(false);
    setIsSubmitting(true);

    try {
      if (authMode === "signup") {
        if (!userType) {
          toast({
            title: "Error",
            description: "Please select your account type",
            variant: "destructive",
          });
          triggerShake();
          setIsSubmitting(false);
          return;
        }
        
        const { error } = await signUp(email, password, userType);
        if (error) {
          triggerShake();
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Store email and role for resending verification
          localStorage.setItem("pendingVerificationEmail", email);
          localStorage.setItem("pendingUserRole", userType);
          toast({
            title: "Check your email",
            description: "We've sent you a verification link to confirm your account.",
          });
          navigate("/verify-email");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          triggerShake();
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      triggerShake();
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

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
            {!userType && authMode === "signup" ? (
              <div className="text-center">
                <img 
                  src={stageLinkLogo} 
                  alt="StageLink" 
                  className="h-20 w-auto mx-auto mb-8"
                />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  Join StageLink
                </h1>
                <p className="text-muted-foreground mb-8">
                  Choose how you'd like to join
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setUserType("audience")}
                    className="w-full p-6 border border-secondary/30 bg-card hover:border-secondary hover:shadow-[0_0_30px_hsl(43_72%_52%/0.2)] transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎟️</span>
                      <div>
                        <h3 className="font-serif text-lg text-foreground group-hover:text-secondary transition-colors">
                          I'm an Audience Member
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Discover shows and follow theater groups
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("producer")}
                    className="w-full p-6 border border-secondary/30 bg-card hover:border-primary hover:shadow-[0_0_30px_hsl(0_100%_25%/0.3)] transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎭</span>
                      <div>
                        <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                          I'm a Theater Group
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Submit shows and manage your group profile
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setAuthMode("login")}
                    className="text-secondary cursor-pointer hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </div>
            ) : (
              <motion.div 
                className="bg-card border border-secondary/20 p-8"
                variants={shakeVariants}
                animate={formError ? "shake" : "idle"}
              >
                {authMode === "signup" && userType && (
                  <button
                    onClick={() => setUserType(null)}
                    className="text-secondary text-sm mb-6 hover:underline"
                  >
                    ← Back
                  </button>
                )}

                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {authMode === "login" ? "Welcome Back" : 
                    userType === "producer" ? "Theater Group Sign Up" : "Audience Sign Up"}
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  {authMode === "login" ? "Enter your credentials to continue" : "Create your account"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {authMode === "login" && (
                        <button 
                          type="button"
                          onClick={() => navigate("/reset-password")}
                          className="text-xs text-secondary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background border-secondary/30 focus:border-secondary"
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  {authMode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button 
                        onClick={() => {
                          setAuthMode("signup");
                          setUserType(null);
                        }}
                        className="text-secondary cursor-pointer hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button 
                        onClick={() => setAuthMode("login")}
                        className="text-secondary cursor-pointer hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Login;
