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
const STORAGE_KEY = "stagelink_last_activity";

interface IdleTimerProviderProps {
  children: React.ReactNode;
}

export const IdleTimerProvider: React.FC<IdleTimerProviderProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5 * 60); // 5 minutes in seconds

  // Get last activity from localStorage
  const getStoredLastActivity = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch {
      // localStorage not available
    }
    return Date.now();
  }, []);

  // Save last activity to localStorage
  const setStoredLastActivity = useCallback((timestamp: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, timestamp.toString());
    } catch {
      // localStorage not available
    }
  }, []);

  // Clear stored activity on logout
  const clearStoredActivity = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    clearStoredActivity();
    await signOut();
    toast({
      title: "Session Expired",
      description: "You have been signed out due to inactivity.",
      variant: "default",
    });
    navigate("/login");
  }, [navigate, clearStoredActivity, signOut]);

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

  const startCountdown = useCallback((initialSeconds: number) => {
    setRemainingTime(initialSeconds);
    
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback((fromActivity: boolean = true) => {
    const now = Date.now();
    setStoredLastActivity(now);
    setShowWarning(false);
    setRemainingTime(5 * 60);
    clearAllTimers();

    if (user) {
      // Set warning timer (25 minutes from now)
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown(Math.floor(WARNING_BEFORE_MS / 1000));
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

      // Set logout timer (30 minutes from now)
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    }
  }, [user, handleLogout, clearAllTimers, setStoredLastActivity, startCountdown]);

  // Initialize from stored state on mount
  const initializeFromStorage = useCallback(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    const lastActivity = getStoredLastActivity();

    // Check if this is a fresh login or verification
    // If the user signed in AFTER the last stored activity, it's a new session
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
    const isFreshLogin = lastSignIn > lastActivity;

    // Also explicitly handle verification page to avoid race conditions
    const isVerifying = location.pathname === "/verify-email";

    if (isFreshLogin || isVerifying) {
      resetTimer(true);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastActivity;

    if (elapsed >= IDLE_TIMEOUT_MS) {
      // Session already expired - log out immediately
      handleLogout();
      return;
    }

    const timeUntilWarning = (IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) - elapsed;
    const timeUntilLogout = IDLE_TIMEOUT_MS - elapsed;

    if (timeUntilWarning <= 0) {
      // Already in warning period - show warning with correct remaining time
      setShowWarning(true);
      const remainingSeconds = Math.floor(timeUntilLogout / 1000);
      startCountdown(remainingSeconds);

      // Set logout timer for remaining time
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeUntilLogout);
    } else {
      // Normal state - set timers from remaining time
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown(Math.floor(WARNING_BEFORE_MS / 1000));
      }, timeUntilWarning);

      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeUntilLogout);
    }
  }, [user, getStoredLastActivity, handleLogout, startCountdown, resetTimer, location.pathname]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer(true);
  }, [resetTimer]);

  // Initialize on user login
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      initializedRef.current = false;
      return;
    }

    initializeFromStorage();

    // Events that indicate user activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      // Only reset if warning is not showing
      if (!showWarning) {
        resetTimer(true);
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [user, initializeFromStorage, resetTimer, clearAllTimers, showWarning]);

  // Update stored activity on route changes
  useEffect(() => {
    if (user && !showWarning) {
      resetTimer(true);
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
