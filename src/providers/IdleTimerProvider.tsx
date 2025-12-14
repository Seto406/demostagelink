import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before timeout

interface IdleTimerProviderProps {
  children: React.ReactNode;
}

export const IdleTimerProvider: React.FC<IdleTimerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5 * 60); // 5 minutes in seconds

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    await supabase.auth.signOut();
    toast({
      title: "Session Expired",
      description: "You have been signed out due to inactivity.",
      variant: "default",
    });
    navigate("/login");
  }, [navigate]);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingTime(5 * 60);
    clearAllTimers();

    if (user) {
      // Set warning timer (25 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingTime(5 * 60);
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

      // Set logout timer (30 minutes)
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    }
  }, [user, handleLogout, clearAllTimers]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    // Events that indicate user activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      // Only reset if warning is not showing
      if (!showWarning) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [user, resetTimer, clearAllTimers, showWarning]);

  // Reset timer on route changes (indicates activity)
  useEffect(() => {
    if (user && !showWarning) {
      resetTimer();
    }
  }, [location.pathname, user, resetTimer, showWarning]);

  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {children}
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="bg-card border-secondary/30 max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <AlertDialogTitle className="font-serif text-xl">
                Session Expiring Soon
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Your session will expire in{" "}
              <span className="font-mono text-secondary font-semibold text-lg">
                {formatTime(remainingTime)}
              </span>{" "}
              due to inactivity. Would you like to stay logged in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={handleLogout}
              className="border-secondary/30 hover:bg-destructive/10 hover:text-destructive"
            >
              Log Out Now
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStayLoggedIn}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Stay Logged In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IdleTimerProvider;
