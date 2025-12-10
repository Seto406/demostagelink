import { motion, useInView, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";

interface CurtainRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const CurtainReveal = ({ children, className = "", delay = 0 }: CurtainRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.5 }}
      >
        {children}
      </motion.div>

      {/* Left Curtain */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-primary z-10 pointer-events-none"
        initial={{ x: 0 }}
        animate={isInView ? { x: "-100%" } : { x: 0 }}
        transition={{
          duration: 0.8,
          delay,
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
        animate={isInView ? { x: "100%" } : { x: 0 }}
        transition={{
          duration: 0.8,
          delay,
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
        className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-primary to-primary/80 z-20 pointer-events-none"
        initial={{ scaleY: 1 }}
        animate={isInView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{
          duration: 0.5,
          delay: delay + 0.6,
          ease: "easeOut",
        }}
        style={{ transformOrigin: "top" }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/50" />
      </motion.div>
    </div>
  );
};

export default CurtainReveal;
