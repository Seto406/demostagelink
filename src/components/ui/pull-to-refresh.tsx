import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { BrandedLoader } from "./branded-loader";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const controls = useAnimation();
  
  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const rotation = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      pullDistance.set(0);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) * 0.5);
    pullDistance.set(Math.min(distance, threshold * 1.5));
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    const distance = pullDistance.get();
    
    if (distance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      pullDistance.set(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        await controls.start({ y: 0 });
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, isRefreshing, disabled]);

  // Only show on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-auto">
      {/* Pull indicator */}
      <motion.div
        style={{ 
          height: pullDistance,
          opacity,
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-10 bg-background/80 backdrop-blur-sm"
      >
        <motion.div style={{ scale, rotate: rotation }}>
          {isRefreshing ? (
            <BrandedLoader size="sm" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <motion.div
                style={{ rotate: rotation }}
                className="w-8 h-8 rounded-full border-2 border-secondary/50 flex items-center justify-center"
              >
                <span className="text-lg">🎭</span>
              </motion.div>
              <motion.span 
                style={{ opacity }}
                className="text-xs text-muted-foreground"
              >
                {pullDistance.get() >= threshold ? "Release to refresh" : "Pull to refresh"}
              </motion.span>
            </div>
          )}
        </motion.div>
      </motion.div>
      
      {/* Content */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
