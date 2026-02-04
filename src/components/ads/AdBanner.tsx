import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  className?: string;
  format?: "horizontal" | "vertical" | "box";
}

export const AdBanner = ({ className, format = "horizontal" }: AdBannerProps) => {
  const isBox = format === "box";

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-muted/30", className)}>
       <CardContent
         className={cn(
           "p-0 relative flex items-center justify-center bg-gradient-to-r from-muted to-muted/50",
           isBox ? "min-h-[250px] flex-col text-center" : "min-h-[100px]"
         )}
       >
         <div className="text-center p-4">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-muted-foreground/30 px-1.5 py-0.5 rounded mb-2 inline-block">Ad</span>
           <p className="font-serif text-lg text-foreground/80">Support Local Theater</p>
           <p className="text-xs text-muted-foreground mt-1">Your brand here. Contact us to advertise.</p>
         </div>
       </CardContent>
    </Card>
  );
};
