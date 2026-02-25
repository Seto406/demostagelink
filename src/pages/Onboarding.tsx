import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/contexts/TourContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Check, Loader2, Theater } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GENRES = ["Drama", "Comedy", "Musical", "Tragedy", "Opera"];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const { startTour } = useTour();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const checkUsername = async (val: string) => {
    if (!val || val.length < 3) {
      if (val.length > 0) setUsernameError("Username too short");
      else setUsernameError("");
      return;
    }

    // If it's the user's current username, it's valid
    if (val === profile?.username) {
        setUsernameError("");
        return;
    }

    setIsCheckingUsername(true);
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', val);

    if (count && count > 0) {
      setUsernameError("Username is already taken");
    } else {
      setUsernameError("");
    }
    setIsCheckingUsername(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (step === 2 && username) {
            checkUsername(username);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, step]);


  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const updates = {
        genres: selectedGenres,
        username: username,
        has_completed_onboarding: true
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();

      // Start tour and redirect
      startTour();
      navigate('/feed');

      toast({
        title: "Welcome to StageLink!",
        description: "Your profile has been set up.",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
      setStep(prev => prev + 1);
  }

  // If loading or checking, show loader? Maybe not necessary as AuthContext handles initial load.

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-lg z-10">
        <div className="mb-8 text-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4"
            >
                <Theater className="w-8 h-8 text-primary" />
            </motion.div>
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-3xl font-bold mb-2"
            >
                {step === 1 ? "What do you like?" : "One last thing..."}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-muted-foreground"
            >
                {step === 1 ? "Select your favorite genres to personalize your feed." : "Choose a username to represent you on StageLink."}
            </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`
                      p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group
                      ${selectedGenres.includes(genre)
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                        : "border-border bg-card hover:border-primary/50 hover:bg-card/80"}
                    `}
                  >
                    <span className="font-semibold text-lg">{genre}</span>
                    {selectedGenres.includes(genre) && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <Button
                    onClick={nextStep}
                    className="w-full h-12 text-lg"
                    disabled={selectedGenres.length === 0}
                >
                    Continue
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                    Select at least one genre to continue
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                 <FloatingInput
                    id="username"
                    type="text"
                    label="Username"
                    value={username}
                    onChange={(e) => {
                         const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                         setUsername(val);
                    }}
                    required
                 />

                 <div className="h-6 mt-2 pl-1 text-sm">
                    {usernameError ? (
                        <span className="text-red-500 flex items-center gap-1">
                             {usernameError}
                        </span>
                    ) : isCheckingUsername ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                             <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                        </span>
                    ) : username && !usernameError ? (
                        <span className="text-green-500 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Available
                        </span>
                    ) : null}
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                    disabled={isSubmitting}
                >
                    Back
                </Button>
                <Button
                    onClick={handleFinish}
                    className="flex-[2] h-12"
                    disabled={!username || !!usernameError || isSubmitting || isCheckingUsername}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
                        </>
                    ) : "Get Started"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
