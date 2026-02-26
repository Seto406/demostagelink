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
        else if (index === 16) {
          setRun(false);
          if (isProducer) {
            navigate("/dashboard");
          } else {
             // For non-producers, go to a demo group profile
             navigate("/group/demo-1");
          }
          setTimeout(() => setRun(true), 1000);
        }
        // Dashboard (17-19) -> Group Profile (Producer only)
        else if (isProducer && index === 19) {
          setRun(false);
          if (user?.id && profile?.id) {
             navigate(`/producer/${profile.id}`);
          } else {
             navigate("/group/demo-1");
          }
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
        // Dashboard/Group Profile (17) -> Directory (16)
        else if (index === 17) {
          // If isProducer, 17 is Dashboard step 1.
          // If !isProducer, 17 is Group Profile step 1.
          // Both come from Directory (16).
          setRun(false);
          navigate("/directory");
          setTimeout(() => setRun(true), 1000);
        }
        // Group Profile (20) -> Dashboard (19) (Producer only)
        else if (isProducer && index === 20) {
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
