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
  const [loopDetected, setLoopDetected] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (autoRecovery) {
      // Loop Detection Logic: Prevent infinite reload loops
      const lastWipe = localStorage.getItem('stagelink_last_nuclear_wipe');
      if (lastWipe && Date.now() - parseInt(lastWipe, 10) < 15000) {
        setLoopDetected(true);
        return;
      }

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
    if (showRecovery && !loopDetected) {
      if (countdown > 0) {
        const interval = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
      } else {
        performNuclearWipe();
      }
    }
  }, [showRecovery, countdown, loopDetected]);

  const handleReset = () => {
    performNuclearWipe();
  };

  if (loopDetected) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-4 text-center">
        <BrandedLoader size="xl" text="Connection Issue Detected" />

        <div className="mt-8 max-w-md space-y-4 text-sm text-muted-foreground animate-in fade-in duration-700">
          <p>We've detected a recurring issue with your session.</p>

          <div className="bg-destructive/10 p-4 rounded-xl text-left space-y-2">
            <p className="font-medium text-destructive">Required Actions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li><strong>Sync your computer clock.</strong> Supabase security rejects requests if your time is incorrect.</li>
              <li>If the issue persists, perform a full reset below.</li>
            </ol>
          </div>

          <button
            onClick={() => performNuclearWipe(false)}
            className="w-full px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-medium transition-colors"
          >
            Factory Reset & Reload
          </button>

          <p className="text-xs opacity-70">
            This will clear all app data, including your session.
          </p>
        </div>
      </div>
    );
  }

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
