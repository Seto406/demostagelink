import { useRef } from "react";
import ReactJoyride, { Step, CallBackProps, STATUS, EVENTS } from "react-joyride";
import type { StoreHelpers } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";

interface TourGuideProps {
  isTrialExpired?: boolean;
  run: boolean;
  setRun: (run: boolean) => void;
  onFinish?: () => void;
}

export const TourGuide = ({ isTrialExpired = false, run, setRun, onFinish }: TourGuideProps) => {
  const { user, profile } = useAuth();
  const helpersRef = useRef<StoreHelpers | null>(null);

  // Kill switch: If the user has already completed the tour, never render it again.
  if (profile?.has_completed_tour) {
    return null;
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Skip to next step when target element isn't found (e.g. collapsed sidebar on mobile)
      helpersRef.current?.next();
      return;
    }

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (onFinish) {
        onFinish();
      }
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content: "Welcome to StageLink! Let’s get your theater group ready for the spotlight.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "#dashboard-stats",
      content: "This is your command center. Once you have shows live, you'll see your ticket click-through rates and audience engagement here.",
    },
    {
      target: isTrialExpired ? "#quick-actions-container" : "#add-show-button",
      content: isTrialExpired
        ? "Your trial has ended. This section allows you to manage your subscription and shows."
        : "Ready to show off? Click here to add an Ongoing Show or archive a Previous Show to build your portfolio.",
    },
    {
      target: "#profile-tab",
      content: "Pro-tip: A high-fidelity profile with rich media attracts more audience engagement!",
    },
  ];

  if (!run) return null;

  return (
    <ReactJoyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      getHelpers={(helpers) => { helpersRef.current = helpers; }}
      scrollToFirstStep
      styles={{
        options: {
          primaryColor: "#800000", // Maroon
          textColor: "#333",
          zIndex: 10000,
        },
        buttonNext: {
            backgroundColor: "#800000",
            color: "#FFD700", // Gold text
        },
        buttonBack: {
            color: "#800000",
        }
      }}
      locale={{
        last: "Finish",
        skip: "Skip Tour",
      }}
    />
  );
};
