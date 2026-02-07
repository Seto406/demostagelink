/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnhancedToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  onDismiss: (id: string) => void;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    border: "border-border",
    icon: null,
    progressColor: "bg-secondary",
  },
  success: {
    bg: "bg-card",
    border: "border-emerald-500/50",
    icon: CheckCircle,
    progressColor: "bg-emerald-500",
  },
  error: {
    bg: "bg-card",
    border: "border-destructive/50",
    icon: AlertCircle,
    progressColor: "bg-destructive",
  },
  warning: {
    bg: "bg-card",
    border: "border-amber-500/50",
    icon: AlertTriangle,
    progressColor: "bg-amber-500",
  },
  info: {
    bg: "bg-card",
    border: "border-blue-500/50",
    icon: Info,
    progressColor: "bg-blue-500",
  },
};

const iconColors = {
  default: "text-secondary",
  success: "text-emerald-500",
  error: "text-destructive",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  id,
  title,
  description,
  variant = "default",
  duration = 5000,
  onDismiss,
}) => {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newValue = prev - (100 / (duration / 50));
        if (newValue <= 0) {
          clearInterval(interval);
          onDismiss(id);
          return 0;
        }
        return newValue;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, id, onDismiss, isPaused]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm",
        "w-full max-w-sm pointer-events-auto",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {Icon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <Icon className={cn("h-5 w-5 mt-0.5", iconColors[variant])} />
          </motion.div>
        )}
        
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-foreground"
          >
            {title}
          </motion.p>
          {description && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {description}
            </motion.p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDismiss(id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30">
        <motion.div
          className={cn("h-full", styles.progressColor)}
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

// Toast container and hook
type ToastData = Omit<EnhancedToastProps, "onDismiss">

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const EnhancedToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <EnhancedToast key={toast.id} {...toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useEnhancedToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useEnhancedToast must be used within EnhancedToastProvider");
  }
  return context;
};

// Standalone toast function for simple usage
let toastHandler: ((toast: Omit<ToastData, "id">) => void) | null = null;

export const setToastHandler = (handler: (toast: Omit<ToastData, "id">) => void) => {
  toastHandler = handler;
};

export const enhancedToast = {
  success: (title: string, description?: string, duration?: number) => {
    toastHandler?.({ title, description, variant: "success", duration });
  },
  error: (title: string, description?: string, duration?: number) => {
    toastHandler?.({ title, description, variant: "error", duration });
  },
  warning: (title: string, description?: string, duration?: number) => {
    toastHandler?.({ title, description, variant: "warning", duration });
  },
  info: (title: string, description?: string, duration?: number) => {
    toastHandler?.({ title, description, variant: "info", duration });
  },
  default: (title: string, description?: string, duration?: number) => {
    toastHandler?.({ title, description, variant: "default", duration });
  },
};
