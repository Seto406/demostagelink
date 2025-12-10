import { motion, useInView } from "framer-motion";
import { useRef, ReactNode, useEffect, useState } from "react";

interface CurtainRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const CurtainReveal = ({ children, className = "", delay = 0 }: CurtainRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  const shouldAnimate = isInView || hasAnimated;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Content - visible immediately after animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: shouldAnimate ? 1 : 0 }}
        transition={{ duration: 0.5, delay: shouldAnimate ? delay + 0.8 : 0 }}
      >
        {children}
      </motion.div>

      {/* Left Curtain */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-primary z-10 pointer-events-none"
        initial={{ x: 0 }}
        animate={{ x: shouldAnimate ? "-100%" : 0 }}
        transition={{
          duration: 1.2,
          delay: shouldAnimate ? delay : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Curtain texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.15) 8px,
              rgba(0,0,0,0.15) 10px
            )`,
          }}
        />
        {/* Gold trim */}
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-secondary via-secondary/60 to-secondary" />
      </motion.div>

      {/* Right Curtain */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full bg-primary z-10 pointer-events-none"
        initial={{ x: 0 }}
        animate={{ x: shouldAnimate ? "100%" : 0 }}
        transition={{
          duration: 1.2,
          delay: shouldAnimate ? delay : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Curtain texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.15) 8px,
              rgba(0,0,0,0.15) 10px
            )`,
          }}
        />
        {/* Gold trim */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary via-secondary/60 to-secondary" />
      </motion.div>

      {/* Top valance decoration */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-primary to-primary/80 z-20 pointer-events-none origin-top"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: shouldAnimate ? 0 : 1 }}
        transition={{
          duration: 0.5,
          delay: shouldAnimate ? delay + 0.9 : 0,
          ease: "easeOut",
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/50" />
      </motion.div>
    </div>
  );
};

export default CurtainReveal;
