import { cn } from "@/lib/utils";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

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
