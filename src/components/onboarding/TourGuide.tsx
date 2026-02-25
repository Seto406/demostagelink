import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TourStep {
  title: string;
  body: string;
  highlight?: {
    label: string;
    text: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Central Exposure Hub",
    body: "The Homepage is designed to increase visibility for productions and theatre groups. Producers share updates. Audiences discover them instantly.",
  },
  {
    title: "Highlight Features 1: Producer Updates",
    body: "When producers post updates, they automatically appear in followers’ feeds. No need for external promotion — the platform ensures your production is visible.",
    highlight: {
      label: "Visibility Impact",
      text: "More reach. More awareness. More engagement.",
    },
  },
  {
    title: "Highlight Features 2: Audience Engagement",
    body: "When audiences react, posts gain more visibility. Active productions stay highlighted, helping more people discover them.",
    highlight: {
      label: "Visibility Impact",
      text: "Interaction becomes promotion.",
    },
  },
  {
    title: "Highlight Features 3: Suggested Groups Section",
    body: "The homepage recommends theatre groups to users. This gives both new and established groups a chance to be discovered.",
    highlight: {
      label: "Visibility Impact",
      text: "Visibility is not limited to followers.",
    },
  },
];

const STORAGE_KEY = "stagelink_has_seen_tour";

export const TourGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenTour) {
      // Small delay to ensure the app is fully mounted and ready
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleSkip} // Click outside to skip/close? Or maybe just do nothing to force interaction. Let's stick to buttons.
          />

          {/* Dialog Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-[101] w-full max-w-md"
          >
            <Card className="border-secondary/20 bg-background/95 shadow-2xl backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-serif text-primary">
                    {step.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <p className="text-base leading-relaxed text-foreground/90">
                  {step.body}
                </p>

                {step.highlight && (
                  <div className="rounded-lg bg-secondary/10 p-3 border border-secondary/20">
                    <p className="text-sm font-medium text-secondary">
                      <span className="uppercase tracking-wide text-xs opacity-70 block mb-1">
                        {step.highlight.label}
                      </span>
                      {step.highlight.text}
                    </p>
                  </div>
                )}

                {/* Progress Indicators */}
                <div className="flex gap-1.5 justify-center mt-2">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-6 bg-secondary"
                          : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                {currentStep === 0 ? (
                  <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                    Skip
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}

                <Button
                  onClick={handleNext}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 min-w-[80px]"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
