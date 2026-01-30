import { useEffect, useState } from "react";
import ReactJoyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";

interface TourGuideProps {
  isTrialExpired?: boolean;
}

export const TourGuide = ({ isTrialExpired = false }: TourGuideProps) => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenTour = localStorage.getItem(`stagelink_tour_seen_${user.id}`);
      if (!hasSeenTour) {
        setRun(true);
      }
    }
  }, [user]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (user) {
        localStorage.setItem(`stagelink_tour_seen_${user.id}`, "true");
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
