import { motion, useInView, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";

type EntranceType = "fadeUp" | "fadeDown" | "slideLeft" | "slideRight" | "scale" | "spotlight" | "curtainUp";

interface EntranceAnimationProps {
  children: ReactNode;
  type?: EntranceType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const entranceVariants: Record<EntranceType, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  spotlight: {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      filter: "brightness(0.3)",
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      filter: "brightness(1)",
    },
  },
  curtainUp: {
    hidden: { 
      opacity: 0, 
      y: 60,
      clipPath: "inset(100% 0 0 0)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      clipPath: "inset(0 0 0 0)",
    },
  },
};

export const EntranceAnimation = ({
  children,
  type = "fadeUp",
  delay = 0,
  duration = 0.6,
  className = "",
  once = true,
}: EntranceAnimationProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={entranceVariants[type]}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation wrapper
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  className = "",
}: StaggerContainerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
export const StaggerItem = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export default EntranceAnimation;
