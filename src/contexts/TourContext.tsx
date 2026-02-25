import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TourContextType {
  run: boolean;
  stepIndex: number;
  tourActive: boolean;
  setRun: (run: boolean) => void;
  setStepIndex: (index: number) => void;
  startTour: () => void;
  stopTour: () => void;
  completeTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedStepIndex = localStorage.getItem("stagelink_tour_step_index");
    const savedTourActive = localStorage.getItem("stagelink_tour_active");

    if (savedTourActive === "true") {
      setTourActive(true);
      setRun(true);
      setStepIndex(savedStepIndex ? parseInt(savedStepIndex, 10) : 0);
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (tourActive) {
      localStorage.setItem("stagelink_tour_active", "true");
      localStorage.setItem("stagelink_tour_step_index", stepIndex.toString());
    } else {
      localStorage.removeItem("stagelink_tour_active");
      localStorage.removeItem("stagelink_tour_step_index");
    }
  }, [tourActive, stepIndex]);

  const startTour = () => {
    setStepIndex(0);
    setTourActive(true);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
    setTourActive(false);
    setStepIndex(0);
  };

  const completeTour = () => {
    setRun(false);
    setTourActive(false);
    localStorage.setItem("stagelink_has_seen_tour", "true");
    localStorage.removeItem("stagelink_tour_active");
    localStorage.removeItem("stagelink_tour_step_index");
  };

  return (
    <TourContext.Provider
      value={{
        run,
        stepIndex,
        tourActive,
        setRun,
        setStepIndex,
        startTour,
        stopTour,
        completeTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
