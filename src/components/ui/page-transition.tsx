import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};

// Curtain-style page transition wrapper (kept as no-op for compatibility)
export const CurtainTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};

// Spotlight-style page transition (kept as no-op for compatibility)
export const SpotlightTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};

export default PageTransition;
