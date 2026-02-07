import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useEffect, useState, useMemo } from "react";

interface CinematicBackgroundProps {
  children: ReactNode;
}

export const CinematicBackground = ({ children }: CinematicBackgroundProps) => {
  // Cursor spotlight tracking
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const spotlightX = useSpring(cursorX, springConfig);
  const spotlightY = useSpring(cursorY, springConfig);
  
  const [isMobile, setIsMobile] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isMobile || shouldReduceMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY, isMobile, shouldReduceMotion]);

  // Generate stable particle configs
  const fireflies = useMemo(() => {
    // Reduced from 20 to 10 for performance
    return [...Array(10)].map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        boxShadow: "0 0 4px 1px rgba(250, 204, 21, 0.4)",
        willChange: "transform, opacity",
      },
      animate: {
        y: [0, Math.random() * 100 - 50, 0],
        x: [0, Math.random() * 100 - 50, 0],
        opacity: [0, 0.8, 0],
        scale: [0, 1.2, 0],
      },
      transition: {
        duration: 5 + Math.random() * 10,
        repeat: Infinity,
        delay: Math.random() * 5,
        ease: "easeInOut",
      }
    }));
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Fixed background container */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base layer - deep charcoal */}
        <div 
          className="absolute inset-0"
          style={{ backgroundColor: "#0a0a0a" }}
        />

        {/* Animated gradient mesh background */}
        <div
          className="absolute inset-0 animate-pulse-subtle"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, rgba(139, 0, 0, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 0, 0, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 50% 80%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)
            `,
          }}
        />

        {/* Ambient Orb 1 - Top Left - Brand Red */}
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
            transform: "translate3d(0,0,0)",
            willChange: "transform",
          }}
          animate={{
            x: [0, 50, 20, 0],
            y: [0, 30, 60, 0],
            scale: [1, 1.2, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Ambient Orb 2 - Bottom Right - Brand Red */}
        <motion.div
          className="absolute -bottom-48 -right-48 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139, 0, 0, 0.12) 0%, transparent 60%)",
            filter: "blur(100px)",
            transform: "translate3d(0,0,0)",
            willChange: "transform",
          }}
          animate={{
            x: [0, -60, -30, 0],
            y: [0, -50, -20, 0],
            scale: [1, 1.15, 1.05, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />

        {/* Wandering orb - moves across screen */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 60%)",
            filter: "blur(60px)",
            transform: "translate3d(0,0,0)",
            willChange: "transform",
          }}
          animate={{
            x: ["10%", "70%", "30%", "80%", "10%"],
            y: ["20%", "60%", "80%", "30%", "20%"],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulsing center glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139, 0, 0, 0.04) 0%, transparent 40%)",
            filter: "blur(100px)",
            transform: "translate3d(0,0,0)",
            willChange: "transform",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles - disabled on reduced motion */}
        {!shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: i % 3 === 0
                    ? "rgba(212, 175, 55, 0.4)"
                    : "rgba(139, 0, 0, 0.3)",
                  willChange: "transform, opacity",
                }}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.random() * 50 - 25, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 8 + Math.random() * 8,
                  repeat: Infinity,
                  delay: Math.random() * 10,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Fireflies - slightly brighter, small, random movement */}
        {!shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {fireflies.map((firefly) => (
              <motion.div
                key={`firefly-${firefly.id}`}
                className="absolute w-[2px] h-[2px] rounded-full bg-yellow-400"
                style={firefly.style}
                animate={firefly.animate}
                transition={firefly.transition}
              />
            ))}
          </div>
        )}

        {/* Stage dust particles - disabled on reduced motion */}
        {!shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Reduced from 8 to 5 */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                className="absolute w-2 h-2 rounded-full bg-secondary/10"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${Math.random() * 100}%`,
                  filter: "blur(1px)",
                  willChange: "transform, opacity",
                }}
                animate={{
                  y: [0, -200, 0],
                  x: [0, Math.random() * 100 - 50, 0],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 15 + Math.random() * 10,
                  repeat: Infinity,
                  delay: Math.random() * 15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Cursor Spotlight - Desktop only and not reduced motion */}
        {!isMobile && !shouldReduceMotion && (
          <motion.div
            className="fixed pointer-events-none"
            style={{
              x: spotlightX,
              y: spotlightY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            {/* Main spotlight glow */}
            <div
              className="w-[400px] h-[400px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 30%, transparent 60%)",
                filter: "blur(40px)",
                willChange: "transform",
                transform: "translate3d(0,0,0)",
              }}
            />
            {/* Inner bright spot */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 60%)",
                filter: "blur(20px)",
                willChange: "transform",
                transform: "translate3d(0,0,0)",
              }}
            />
          </motion.div>
        )}

        {/* Film grain/noise texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Animated grain flicker */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' seed='15' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            willChange: "opacity",
          }}
          animate={{
            opacity: [0.02, 0.04, 0.015, 0.03, 0.02],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.5) 100%)`,
          }}
        />

        {/* Left Curtain Border */}
        <motion.div
          className="absolute top-0 left-0 bottom-0 w-16 pointer-events-none hidden md:block"
          style={{
            background: `linear-gradient(90deg, 
              rgba(139, 0, 0, 0.4) 0%, 
              rgba(139, 0, 0, 0.2) 30%,
              rgba(139, 0, 0, 0.05) 60%,
              transparent 100%)`,
          }}
        >
          {/* Curtain fold lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              180deg,
              transparent,
              transparent 20px,
              rgba(0,0,0,0.1) 20px,
              rgba(0,0,0,0.1) 22px
            )`,
          }} />
          {/* Gold trim */}
          <motion.div 
            className="absolute top-0 right-0 w-[2px] h-full"
            style={{
              background: "linear-gradient(180deg, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0.2) 50%, rgba(212, 175, 55, 0.6) 100%)",
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Subtle wave animation */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
              willChange: "transform",
            }}
            animate={{
              x: [-5, 0, -5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Right Curtain Border */}
        <motion.div
          className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none hidden md:block"
          style={{
            background: `linear-gradient(-90deg, 
              rgba(139, 0, 0, 0.4) 0%, 
              rgba(139, 0, 0, 0.2) 30%,
              rgba(139, 0, 0, 0.05) 60%,
              transparent 100%)`,
          }}
        >
          {/* Curtain fold lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              180deg,
              transparent,
              transparent 20px,
              rgba(0,0,0,0.1) 20px,
              rgba(0,0,0,0.1) 22px
            )`,
          }} />
          {/* Gold trim */}
          <motion.div 
            className="absolute top-0 left-0 w-[2px] h-full"
            style={{
              background: "linear-gradient(180deg, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0.2) 50%, rgba(212, 175, 55, 0.6) 100%)",
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          {/* Subtle wave animation */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(-90deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
              willChange: "transform",
            }}
            animate={{
              x: [5, 0, 5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </motion.div>

        {/* Top stage light beams */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-0 left-1/4 w-[2px] h-full origin-top"
            style={{
              background: "linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%)",
              filter: "blur(2px)",
              transform: "translate3d(0,0,0)",
              willChange: "opacity, transform",
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-0 right-1/4 w-[2px] h-full origin-top"
            style={{
              background: "linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%)",
              filter: "blur(2px)",
              transform: "translate3d(0,0,0)",
              willChange: "opacity, transform",
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              rotate: [2, -2, 2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-full origin-top"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)",
              filter: "blur(3px)",
              transform: "translate3d(0,0,0)",
              willChange: "opacity",
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Horizontal stage light glow */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.2) 50%, transparent 100%)",
            boxShadow: "0 0 80px 40px rgba(212, 175, 55, 0.05)",
            willChange: "opacity",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default CinematicBackground;
