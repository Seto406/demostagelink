import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FloatingInput } from "@/components/ui/floating-input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { shakeVariants } from "@/hooks/use-shake";
import { Eye, EyeOff, Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

type UserType = "audience" | "producer" | null;
type AuthMode = "login" | "signup";
type PasswordStrength = "weak" | "medium" | "strong";

// Password strength calculation
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }
  // eslint-disable-next-line no-useless-escape
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: "Password must include at least one number or special character" };
  }
  return { isValid: true, message: "" };
};

const calculatePasswordStrength = (password: string): { strength: PasswordStrength; score: number; tips: string[]; isValid: boolean } => {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score += 2;
  else tips.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  else tips.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 1;
  else tips.push("Add uppercase letters");

  // eslint-disable-next-line no-useless-escape
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password);
  if (hasNumberOrSpecial) score += 2;
  else tips.push("Add a number or special character");

  let strength: PasswordStrength;
  if (score <= 3) strength = "weak";
  else if (score <= 5) strength = "medium";
  else strength = "strong";

  const isValid = password.length >= 8 && hasNumberOrSpecial;

  return { strength, score, tips: tips.slice(0, 2), isValid };
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

interface AuthFormProps {
  initialMode?: AuthMode;
  className?: string;
}

export const AuthForm = ({ initialMode = "login", className }: AuthFormProps) => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptsConsent, setAcceptsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);

  // Password match validation
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const showMatchIndicator = authMode === "signup" && confirmPassword.length > 0;

  // Password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const showStrengthIndicator = authMode === "signup" && password.length > 0;

  const triggerShake = () => {
    setFormError(true);
    setTimeout(() => setFormError(false), 500);
  };

  const handleGoogleLogin = async () => {
    try {
      if (authMode === "signup" && userType) {
         localStorage.setItem("pendingUserRole", userType);
      }

      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
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

        // Validate password meets requirements
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          toast({
            title: "Password Requirements Not Met",
            description: passwordValidation.message,
            variant: "destructive",
          });
          triggerShake();
          setIsSubmitting(false);
          return;
        }

        if (!passwordsMatch) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          triggerShake();
          setIsSubmitting(false);
          return;
        }

        if (!acceptsConsent) {
          toast({
            title: "Data Consent Required",
            description: "Please agree to the Data Privacy Act terms to continue.",
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
            description: error.message + (error.status ? ` (Status: ${error.status})` : ""),
            variant: "destructive",
          });
        } else {
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
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/feed", { replace: true });
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

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case "weak": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "strong": return "bg-green-500";
    }
  };

  const getStrengthTextColor = (strength: PasswordStrength) => {
    switch (strength) {
      case "weak": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "strong": return "text-green-500";
    }
  };

  const getStrengthIcon = (strength: PasswordStrength) => {
    switch (strength) {
      case "weak": return <ShieldAlert className="w-4 h-4" />;
      case "medium": return <Shield className="w-4 h-4" />;
      case "strong": return <ShieldCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        {!userType && authMode === "signup" ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={stageLinkLogo}
              alt="StageLink"
              className="h-20 w-auto mx-auto mb-8 rounded-full"
            />
            <h1 className="text-3xl font-sans font-bold text-foreground mb-4 tracking-tight">
              Join StageLink
            </h1>
            <p className="text-muted-foreground mb-8">
              Choose how you'd like to join
            </p>

            <div className="space-y-4">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                onClick={() => setUserType("audience")}
                className="w-full p-6 rounded-2xl border border-secondary/30 bg-card/50 backdrop-blur-xl hover:border-secondary hover:shadow-[0_0_30px_hsl(43_72%_52%/0.2)] transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🎟️</span>
                  <div>
                    <h3 className="font-sans font-semibold text-lg text-foreground group-hover:text-secondary transition-colors tracking-tight">
                      I'm an Audience Member <span className="text-sm font-normal text-muted-foreground">(Free)</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Discover shows and follow theater groups
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                onClick={() => setUserType("producer")}
                className="w-full p-6 rounded-2xl border border-secondary/30 bg-card/50 backdrop-blur-xl hover:border-primary hover:shadow-[0_0_30px_hsl(0_100%_25%/0.3)] transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🎭</span>
                  <div>
                    <h3 className="font-sans font-semibold text-lg text-foreground group-hover:text-primary transition-colors tracking-tight">
                      I'm a Theater Group <span className="text-sm font-normal text-muted-foreground">(Free & Pro)</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Submit shows and manage your group profile
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>

            <motion.p
              className="text-center text-muted-foreground text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Already have an account?{" "}
              <button
                onClick={() => setAuthMode("login")}
                className="text-secondary cursor-pointer hover:underline"
              >
                Log in
              </button>
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            className="bg-card/50 backdrop-blur-xl border border-secondary/20 p-8 rounded-3xl shadow-2xl"
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

            <h1 className="text-2xl font-sans font-bold text-foreground mb-2 tracking-tight">
              {authMode === "login" ? "Welcome Back" :
                userType === "producer" ? "Theater Group Sign Up" : "Audience Sign Up"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              {authMode === "login" ? "Enter your credentials to continue" : "Create your account"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FloatingInput
                id="email"
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="space-y-2">
                <div className="relative">
                  <FloatingInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements Helper (Signup only) */}
                {authMode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    {/* Requirements Checklist */}
                    <div className="flex flex-col gap-1">
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

                    {/* Strength Bar */}
                    {showStrengthIndicator && (
                      <>
                        <div className="flex gap-1 mt-2">
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength.score >= 1 ? getStrengthColor(passwordStrength.strength) : "bg-muted"
                          }`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength.score >= 3 ? getStrengthColor(passwordStrength.strength) : "bg-muted"
                          }`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength.score >= 5 ? getStrengthColor(passwordStrength.strength) : "bg-muted"
                          }`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength.score >= 7 ? getStrengthColor(passwordStrength.strength) : "bg-muted"
                          }`} />
                        </div>

                        {/* Strength Label */}
                        <div className={`flex items-center gap-2 text-xs ${getStrengthTextColor(passwordStrength.strength)}`}>
                          {getStrengthIcon(passwordStrength.strength)}
                          <span className="capitalize font-medium">{passwordStrength.strength}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password")}
                    className="text-xs text-secondary hover:underline mt-2 block ml-auto"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Confirm Password Field (Signup only) */}
              {authMode === "signup" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <FloatingInput
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {showMatchIndicator && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-2 text-sm ${
                          passwordsMatch ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Data Consent Checkbox */}
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="consent"
                      checked={acceptsConsent}
                      onCheckedChange={(checked) => setAcceptsConsent(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="consent" className="text-sm text-muted-foreground leading-snug">
                      I agree to the <a href="/terms" target="_blank" className="text-secondary hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-secondary hover:underline">Privacy Policy</a>, and I consent to the processing of my personal data in compliance with the Data Privacy Act.
                    </Label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all active:scale-[0.98]"
                disabled={isSubmitting || (authMode === "signup" && (!passwordsMatch || !acceptsConsent))}
              >
                {isSubmitting ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
              </Button>

              <div className="relative my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase text-muted-foreground">
                  Or continue with
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-input hover:bg-accent hover:text-accent-foreground transition-all"
                onClick={handleGoogleLogin}
              >
                <span aria-hidden="true"><GoogleIcon /></span>
                <span className="ml-2">Google</span>
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
                      setConfirmPassword("");
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
                    onClick={() => {
                      setAuthMode("login");
                      setConfirmPassword("");
                    }}
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
  );
};
