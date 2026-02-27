import { useEffect, useMemo } from "react";
import ReactJoyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "@/contexts/TourContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTourSteps } from "@/config/tour-steps";
import { useTheme } from "next-themes";

export const GlobalTour = () => {
  const { run, stepIndex, setStepIndex, setRun, completeTour } = useTour();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const isProducer = profile?.role === "producer";
  const steps = useMemo(() => getTourSteps(isProducer), [isProducer]);

  // Handle navigation triggers based on step index
  // We pause the tour before navigating and resume after navigation
  useEffect(() => {
    if (!run) return;

    // Logic to resume tour if we just landed on a page and tour should be running
    // This is handled by TourContext loading from localStorage, but we might need
    // to ensure the DOM is ready. Joyride handles DOM polling usually.
  }, [location.pathname, run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Handle Finish / Skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      completeTour();
      return;
    }

    // Handle Step Changes (Navigation)
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === 'prev' ? -1 : 1);
      setStepIndex(nextIndex);

      if (action === 'next') {
        // Homepage (0-5) -> Shows
        if (index === 5) {
          setRun(false);
          navigate("/shows");
          setTimeout(() => setRun(true), 1000);
        }
        // Shows (6-10) -> Directory
        else if (index === 10) {
          setRun(false);
          navigate("/directory");
          setTimeout(() => setRun(true), 1000);
        }
        // Directory (11-16) -> Dashboard or Group Profile
        // Note: Step count varies based on isProducer due to conditional steps in Directory section
        // Non-Producer: 16 steps (0-15) + Join Step = 17 steps. Index 16 is last Directory step.
        // Producer: 16 steps (0-15) - Join Step + Collab Step = 16 steps. Index 15 is last Directory step.
        // Wait, let's re-verify the step counts from getTourSteps.
        // Homepage: 6 steps (0-5)
        // Shows: 5 steps (6-10)
        // Directory Base: 6 steps (11-16) -- Wait, let's count carefully.
        // 11: Explore Groups (body)
        // 12: Filters
        // 13: Join (Audience only) OR Collab (Producer only?) -> Collab is separate step
        // 14: Collab (Wait, Collab step title logic in config)
        // Let's trace getTourSteps:
        // 0-5: Home
        // 6-10: Shows
        // 11: Directory Intro
        // 12: Filters
        // 13: Join (Audience) OR Skipped (Producer)
        // 14: Collab (Both, but title changes) -> Wait, previous logic was:
        // Audience: 11, 12, 13(Join), 14(Collab), 15(BasicVsPremium), 16(MutualBenefit) -> Total 17 steps? (Index 16)
        // Producer: 11, 12, 14(Collab), 15, 16 -> Total 16 steps? (Index 15?)

        // Simpler approach: Check the TARGET step index or the CURRENT step index relative to known transition points.

        // Transition to Dashboard (Producer) or Group Profile (Audience)
        // For Producers: After Directory Mutual Benefit (Index 15 if Join is skipped), go to Dashboard.
        // For Audience: After Directory Mutual Benefit (Index 16), go to Group Profile.

        const isDirectoryEnd = isProducer ? index === 15 : index === 16;

        if (isDirectoryEnd) {
          setRun(false);
          if (isProducer) {
            navigate("/dashboard");
          } else {
             // For non-producers, go to a demo group profile
             navigate("/group/demo-1");
          }
          setTimeout(() => setRun(true), 1000);
        }

        // Dashboard (16-18 for Producer) -> Group Profile
        // Producer Dashboard steps: 3 steps.
        // If Producer entered Dashboard at 16. Steps are 16, 17, 18.
        // Transition at index 18.
        else if (isProducer && index === 18) {
          setRun(false);
          // Always use demo profile for tour consistency
          navigate("/group/demo-1");
          setTimeout(() => setRun(true), 1000);
        }
      } else if (action === 'prev') {
        // Shows (6) -> Homepage (5)
        if (index === 6) {
          setRun(false);
          navigate("/feed");
          setTimeout(() => setRun(true), 1000);
        }
        // Directory (11) -> Shows (10)
        else if (index === 11) {
          setRun(false);
          navigate("/shows");
          setTimeout(() => setRun(true), 1000);
        }
        // Dashboard/Group Profile -> Directory
        // Producer: Dashboard starts at 16. Prev from 16 -> 15 (Directory Mutual Benefit)
        // Audience: Group Profile starts at 17. Prev from 17 -> 16 (Directory Mutual Benefit)
        else if ((isProducer && index === 16) || (!isProducer && index === 17)) {
          setRun(false);
          navigate("/directory");
          setTimeout(() => setRun(true), 1000);
        }
        // Group Profile -> Dashboard (Producer only)
        // Producer: Group Profile starts at 19. Prev from 19 -> 18 (Dashboard End)
        else if (isProducer && index === 19) {
          setRun(false);
          navigate("/dashboard");
          setTimeout(() => setRun(true), 1000);
        }
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
        // If target not found, we skip the step
        // This is crucial for handling empty states (e.g. no shows, no members)
        // or conditional elements that might not be present.
        const stepIncrement = action === ACTIONS.PREV ? -1 : 1;

        // Ensure we don't go out of bounds (though Joyride handles this via FINISHED status usually)
        // We set the step index to the NEXT one, skipping the missing one.
        setStepIndex(index + stepIncrement);
        console.warn(`Target not found for step ${index}, skipping to ${index + stepIncrement}`);
    }
  };

  if (!steps.length) return null;

  return (
    <ReactJoyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress={false}
      showSkipButton
      disableOverlayClose
      disableCloseOnEsc
      spotlightClicks
      callback={handleJoyrideCallback}
      locale={{
        next: "Next",
        last: "Finish",
        back: "Back",
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#EAB308", // Secondary/Gold color from theme roughly
          backgroundColor: theme === "dark" ? "#1f1f1f" : "#ffffff",
          textColor: theme === "dark" ? "#ffffff" : "#333333",
          arrowColor: theme === "dark" ? "#1f1f1f" : "#ffffff",
        },
        tooltip: {
            fontSize: '14px',
            borderRadius: '8px',
        },
        buttonNext: {
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--secondary-foreground))',
            fontWeight: 'bold',
            borderRadius: '4px',
        },
        buttonBack: {
            color: 'hsl(var(--muted-foreground))',
            marginRight: '10px',
        }
      }}
      floaterProps={{
        hideArrow: false,
      }}
    />
  );
};
