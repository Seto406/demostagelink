import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { performNuclearWipe } from "@/lib/cleanupStorage";

interface BrandedLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export const BrandedLoader = ({ 
  size = "md", 
  className,
  text 
}: BrandedLoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <img
        src={stageLinkLogo}
        alt="Loading..."
        className={cn("animate-pulse object-contain", sizeClasses[size])}
      />

      {/* Loading text */}
      {text && (
        <p
          className={cn(
            "text-muted-foreground font-medium tracking-wide",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Full page loader variant
interface FullPageLoaderProps {
  text?: string;
  autoRecovery?: boolean;
}

export const FullPageLoader = ({ text = "Loading...", autoRecovery = false }: FullPageLoaderProps) => {
  const [showReset, setShowReset] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (autoRecovery) {
      // 5 seconds threshold for auto-recovery mode
      const timer = setTimeout(() => {
        setShowRecovery(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // 10 seconds threshold for standard manual reset
      const timer = setTimeout(() => {
        setShowReset(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [autoRecovery]);

  useEffect(() => {
    if (showRecovery) {
      if (countdown > 0) {
        const interval = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
      } else {
        performNuclearWipe();
      }
    }
  }, [showRecovery, countdown]);

  const handleReset = () => {
    performNuclearWipe();
  };

  const displayText = showRecovery
    ? `Optimizing your session... Auto-refreshing in ${countdown}...`
    : text;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <BrandedLoader size="xl" text={displayText} />

      {/* Standard Manual Reset */}
      {!autoRecovery && showReset && (
        <button
          onClick={handleReset}
          className="mt-8 text-xs text-muted-foreground hover:text-foreground underline transition-colors animate-in fade-in duration-700"
        >
          Taking too long? Click here to reset cache
        </button>
      )}

      {/* Auto-Recovery Backup Button */}
      {autoRecovery && showRecovery && (
        <button
          onClick={handleReset}
          className="mt-8 px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-all animate-in fade-in duration-700"
        >
          Refresh Now
        </button>
      )}
    </div>
  );
};

// Inline loader for buttons/cards
export const InlineLoader = ({ className }: { className?: string }) => {
  return <BrandedLoader size="sm" className={className} />;
};

export default BrandedLoader;
