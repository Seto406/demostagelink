import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-primary/20",
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Secondary glow ring */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-secondary/20",
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Theater Mask SVG */}
        <motion.div
          className={cn("relative", sizeClasses[size])}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mask Shape */}
            <motion.path
              d="M50 10C30 10 15 30 15 50C15 75 30 90 50 90C70 90 85 75 85 50C85 30 70 10 50 10Z"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--secondary))"
              strokeWidth="2"
              animate={{
                fillOpacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Left Eye - Chain Link */}
            <motion.g
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "35px 40px" }}
            >
              <ellipse
                cx="35"
                cy="40"
                rx="8"
                ry="10"
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
              />
            </motion.g>
            
            {/* Right Eye - Chain Link */}
            <motion.g
              animate={{ rotate: [0, -360] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "65px 40px" }}
            >
              <ellipse
                cx="65"
                cy="40"
                rx="8"
                ry="10"
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
              />
            </motion.g>

            {/* Connecting chain between eyes */}
            <motion.path
              d="M43 40 H57"
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              strokeDasharray="4 2"
              animate={{
                strokeDashoffset: [0, -12],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Subtle smile/expression */}
            <motion.path
              d="M35 65 Q50 75 65 65"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                d: ["M35 65 Q50 75 65 65", "M35 67 Q50 78 65 67", "M35 65 Q50 75 65 65"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Loading text */}
      {text && (
        <motion.p
          className={cn(
            "text-muted-foreground font-medium tracking-wide",
            textSizeClasses[size]
          )}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Full page loader variant
export const FullPageLoader = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <BrandedLoader size="xl" text={text} />
    </div>
  );
};

// Inline loader for buttons/cards
export const InlineLoader = ({ className }: { className?: string }) => {
  return <BrandedLoader size="sm" className={className} />;
};

export default BrandedLoader;
