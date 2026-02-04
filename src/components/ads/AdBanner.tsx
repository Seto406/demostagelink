import React from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  format: "horizontal" | "vertical" | "box";
  className?: string;
}

export const AdBanner = ({ format, className }: AdBannerProps) => {
  const getDimensions = () => {
    switch (format) {
      case "horizontal":
        return "w-full h-32";
      case "vertical":
        return "w-40 h-[600px]";
      case "box":
        return "w-full aspect-square min-h-[250px]";
      default:
        return "w-full h-32";
    }
  };

  return (
    <div
      className={cn(
        "bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground p-4 my-6 transition-all hover:bg-secondary/10",
        getDimensions(),
        className
      )}
    >
      <span className="text-xs uppercase tracking-widest font-semibold mb-1 text-secondary">
        Advertisement
      </span>
      <p className="text-center text-xs opacity-75 max-w-[80%]">
        Support local theater by viewing our sponsors.
      </p>
    </div>
  );
};
