import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  title?: string;
  description?: string;
}

export const UpsellModal = ({
  open,
  onOpenChange,
  featureName,
  title,
  description
}: UpsellModalProps) => {
  const { initiateCheckout, isCheckingOut } = useSubscription();

  const displayTitle = title || (featureName ? `Unlock ${featureName} with Premium` : "Unlock the Full StageLink Experience");
  const displayDescription = description || "Upgrade to Pro for ₱399/mo to access advanced analytics and cast networking.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-secondary/30">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Star className="w-8 h-8 text-primary fill-primary" />
          </div>
          <DialogTitle className="text-center font-serif text-2xl">
            {displayTitle}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            {displayDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-1 rounded-full">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-foreground">Detailed Analytics (Charts/Graphs)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-1 rounded-full">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-foreground">Cast & Crew Management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-1 rounded-full">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-foreground">Featured Show Promotion</span>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto font-semibold text-lg px-8"
            onClick={initiateCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? "Loading..." : "Start 30-Day Free Trial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
