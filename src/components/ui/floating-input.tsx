import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, type = "text", value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!value);
    const generatedId = React.useId();
    const id = props.id || generatedId;

    React.useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    return (
      <div className="relative">
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: isFloating ? -24 : 0,
            x: isFloating ? -4 : 0,
            scale: isFloating ? 0.85 : 1,
            color: isFocused 
              ? "hsl(43 72% 52%)" 
              : error 
                ? "hsl(0 84% 60%)" 
                : "hsl(var(--muted-foreground))",
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            mass: 0.5
          }}
          className={cn(
            "absolute left-3 top-3 origin-left pointer-events-none",
            "text-sm font-medium z-10",
            "bg-gradient-to-b from-transparent via-background to-background",
            isFloating && "px-1"
          )}
        >
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </motion.label>
        
        <input
          id={id}
          type={type}
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-background px-3 pt-4 pb-2 text-sm",
            "ring-offset-background transition-all duration-200",
            "placeholder:text-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isFocused
              ? "border-secondary ring-secondary/20 shadow-[0_0_0_4px_hsl(43_72%_52%/0.1)]"
              : error
                ? "border-destructive ring-destructive/20"
                : "border-input hover:border-muted-foreground/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {/* Focus glow effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 -z-10 rounded-xl bg-secondary/5 blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-destructive mt-1.5 pl-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

// Floating Textarea variant
interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, error, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!value);
    const generatedId = React.useId();
    const id = props.id || generatedId;

    React.useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    return (
      <div className="relative">
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: isFloating ? -24 : 0,
            x: isFloating ? -4 : 0,
            scale: isFloating ? 0.85 : 1,
            color: isFocused 
              ? "hsl(43 72% 52%)" 
              : error 
                ? "hsl(0 84% 60%)" 
                : "hsl(var(--muted-foreground))",
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            mass: 0.5
          }}
          className={cn(
            "absolute left-3 top-3 origin-left pointer-events-none",
            "text-sm font-medium z-10",
            "bg-gradient-to-b from-transparent via-background to-background",
            isFloating && "px-1"
          )}
        >
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </motion.label>
        
        <textarea
          id={id}
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "flex min-h-[100px] w-full rounded-xl border bg-background px-3 pt-6 pb-2 text-sm",
            "ring-offset-background transition-all duration-200 resize-none",
            "placeholder:text-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isFocused
              ? "border-secondary ring-secondary/20 shadow-[0_0_0_4px_hsl(43_72%_52%/0.1)]"
              : error
                ? "border-destructive ring-destructive/20"
                : "border-input hover:border-muted-foreground/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-destructive mt-1.5 pl-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingTextarea.displayName = "FloatingTextarea";

export { FloatingInput, FloatingTextarea };
