import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

interface AdBannerProps {
  format?: "horizontal" | "vertical" | "box";
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ format = "horizontal", className }) => {
  const { isPro, isLoading } = useSubscription();

  if (isLoading || isPro) {
    return null;
  }

  const getFormatClasses = () => {
    switch (format) {
      case "horizontal":
        return "w-full min-h-[90px] flex-row items-center justify-between px-6 py-4";
      case "vertical":
        return "w-full min-h-[600px] flex-col items-center justify-center p-4 text-center space-y-4";
      case "box":
        return "w-full aspect-square flex-col items-center justify-center p-6 text-center space-y-4";
      default:
        return "w-full min-h-[90px] flex-row items-center justify-between px-6 py-4";
    }
  };

  return (
    <div
      data-testid="ad-banner"
      className={cn(
        "bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border border-secondary/20 rounded-xl overflow-hidden relative group",
        getFormatClasses(),
        "flex",
        className
      )}
    >
      <div className={cn("flex flex-col gap-1", format !== "horizontal" && "items-center")}>
        <div className="flex items-center gap-2 text-secondary font-serif font-bold">
          <Sparkles className="w-4 h-4" />
          <span>StageLink Ads</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          {format === "horizontal"
            ? "Support local theater. Advertise your show here."
            : "Reach thousands of theater enthusiasts."}
        </p>
      </div>

      <div className={cn("flex items-center gap-2", format !== "horizontal" && "w-full")}>
        <Button
          variant="outline"
          size="sm"
          className="border-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-xs h-8"
          asChild
        >
          <Link to="/settings">
            Remove Ads
          </Link>
        </Button>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-muted-foreground bg-background/80 px-1 rounded border border-border">
          AD
        </span>
      </div>
    </div>
  );
};
