import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProModal = ({ open, onOpenChange }: ProModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary/30 max-w-md">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <DialogTitle className="font-serif text-2xl mb-2">
            This is a Pro Feature
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            Upgrade to unlock deep insights and advanced theater tools.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => navigate("/settings")}
            variant="default"
            size="lg"
            className="w-full"
          >
            Start 30-Day Free Trial
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
