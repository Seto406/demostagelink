import * as React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  className?: string;
  color?: "gold" | "maroon" | "primary";
  height?: number;
}

const colorStyles = {
  gold: "bg-secondary",
  maroon: "bg-primary",
  primary: "bg-primary",
};

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className,
  color = "gold",
  height = 3,
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform for glow position
  const glowLeft = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Check for reduced motion preference
  const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <>
      <motion.div
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] origin-left",
          colorStyles[color],
          className
        )}
        style={{
          scaleX,
          height,
          boxShadow: `0 0 10px hsl(43 72% 52% / 0.5), 0 0 20px hsl(43 72% 52% / 0.3)`,
        }}
      />
      
      {/* Glow effect at the progress point */}
      <motion.div
        className="fixed top-0 z-[60] pointer-events-none"
        style={{
          left: glowLeft,
          width: 20,
          height: height + 4,
          background: `radial-gradient(circle, hsl(43 72% 52%) 0%, transparent 70%)`,
          filter: "blur(4px)",
          transform: "translateX(-50%)",
        }}
      />
    </>
  );
};

// Simple percentage indicator (optional add-on)
export const ScrollPercentage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const [percentage, setPercentage] = React.useState(0);

  React.useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: percentage > 5 ? 1 : 0, scale: 1 }}
      className="fixed bottom-4 right-4 z-50 bg-card/80 backdrop-blur-sm border border-secondary/30 rounded-full px-3 py-1.5 text-xs text-secondary font-medium shadow-lg"
    >
      {percentage}%
    </motion.div>
  );
};
