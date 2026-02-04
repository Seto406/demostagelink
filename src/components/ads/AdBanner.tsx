import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  format: "horizontal" | "vertical" | "box";
  className?: string;
  variant?: "placeholder" | "adsense" | "sponsorship";
  // AdSense props
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  // Sponsorship props
  sponsorName?: string;
  sponsorImage?: string;
  sponsorLink?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdBanner = ({
  format,
  className,
  variant = "placeholder",
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  sponsorName,
  sponsorImage,
  sponsorLink
}: AdBannerProps) => {
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

  useEffect(() => {
    if (variant === "adsense" && adClient && adSlot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [variant, adClient, adSlot]);

  if (variant === "adsense") {
    // For AdSense, we usually let it handle dimensions via adFormat="auto",
    // but we can enforce container width.
    return (
      <div className={cn("overflow-hidden flex justify-center my-6", className)}>
         <ins className="adsbygoogle"
              style={{ display: 'block', width: '100%' }}
              data-ad-client={adClient}
              data-ad-slot={adSlot}
              data-ad-format={adFormat}
              data-full-width-responsive={fullWidthResponsive ? "true" : "false"}></ins>
      </div>
    );
  }

  if (variant === "sponsorship") {
    return (
      <a
        href={sponsorLink || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block overflow-hidden rounded-xl transition-opacity hover:opacity-90 my-6", getDimensions(), className)}
      >
        {sponsorImage ? (
          <img src={sponsorImage} alt={sponsorName || "Sponsor"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/20">
             <span className="text-secondary font-bold text-center p-4">{sponsorName || "Sponsor Space Available"}</span>
          </div>
        )}
      </a>
    );
  }

  // Default Placeholder
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
