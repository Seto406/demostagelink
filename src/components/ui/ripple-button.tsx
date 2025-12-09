import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wider font-sans active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(0_100%_25%/0.5)] rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline:
          "border border-secondary/50 bg-transparent text-secondary hover:bg-secondary/10 hover:border-secondary rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "text-foreground hover:bg-muted hover:text-foreground rounded-xl",
        link: "text-secondary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground border border-secondary/30 hover:border-secondary hover:shadow-[0_0_40px_hsl(0_100%_25%/0.6)] text-base rounded-2xl",
        gold: "bg-secondary text-secondary-foreground hover:shadow-[0_0_30px_hsl(43_72%_52%/0.5)] rounded-xl",
        ios: "bg-[hsl(221_83%_53%)] text-white hover:bg-[hsl(221_83%_48%)] rounded-xl font-semibold normal-case tracking-normal",
        "ios-secondary": "bg-muted/80 text-foreground hover:bg-muted rounded-xl font-semibold normal-case tracking-normal backdrop-blur-sm",
        "ios-destructive": "bg-destructive text-white hover:bg-destructive/90 rounded-xl font-semibold normal-case tracking-normal",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RippleData {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  rippleColor?: string;
  disableRipple?: boolean;
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant, size, asChild = false, rippleColor, disableRipple = false, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<RippleData[]>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Check for reduced motion preference
    const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);
    
    React.useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setShouldReduceMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple && !shouldReduceMotion && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const newRipple: RippleData = {
          id: Date.now(),
          x,
          y,
          size,
        };

        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }

      onClick?.(e);
    };

    // Determine ripple color based on variant
    const getRippleColor = () => {
      if (rippleColor) return rippleColor;
      switch (variant) {
        case "ios":
        case "hero":
        case "default":
        case "gold":
          return "rgba(255, 255, 255, 0.3)";
        case "outline":
        case "ghost":
        case "ios-secondary":
          return "rgba(212, 175, 55, 0.2)";
        default:
          return "rgba(255, 255, 255, 0.3)";
      }
    };

    if (asChild) {
      return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Slot>;
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={(node) => {
          (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x - ripple.size / 2,
                top: ripple.y - ripple.size / 2,
                width: ripple.size,
                height: ripple.size,
                backgroundColor: getRippleColor(),
              }}
            />
          ))}
        </AnimatePresence>
        
        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export { RippleButton, buttonVariants };
