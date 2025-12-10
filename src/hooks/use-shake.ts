import { useState, useCallback } from "react";
import { Variants } from "framer-motion";

export const useShake = () => {
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const shakeAnimation = isShaking
    ? {
        animation: "shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
      }
    : {};

  const shakeClassName = isShaking ? "animate-shake" : "";

  return { isShaking, triggerShake, shakeAnimation, shakeClassName };
};

// Framer motion shake variants - mutable arrays for framer-motion compatibility
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
    transition: {
      duration: 0.5,
    },
  },
  idle: {
    x: 0,
  },
};

export default useShake;
