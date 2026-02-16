import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";

interface ShowDetails {
  title: string;
  price: number;
  date: string | null;
  venue: string | null;
}

interface PaymentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  show: ShowDetails;
  isProcessing: boolean;
}

export function PaymentSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  show,
  isProcessing,
}: PaymentSummaryModalProps) {

  // Format date if available
  const formattedDate = show.date
    ? new Date(show.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Date TBA";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-center text-foreground">
            Order Summary
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Please review your ticket details before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
            <h3 className="font-serif font-bold text-lg text-foreground mb-1">
              {show.title}
            </h3>

            <div className="space-y-2 mt-3 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 mt-0.5 text-secondary" />
                <span>{formattedDate}</span>
              </div>

              {show.venue && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 text-secondary" />
                  <span>{show.venue}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-muted-foreground">Seat Commitment</span>
            <span className="font-bold text-foreground">{formatCurrency(25)}</span>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-muted-foreground">Remaining Balance</span>
            <span className="font-bold text-foreground">{formatCurrency(Math.max(0, show.price - 25))}</span>
          </div>
          <p className="text-xs text-muted-foreground px-2 text-right -mt-2">(To be paid at the door)</p>

          <div className="h-px bg-border my-2" />

          <div className="flex justify-between items-center px-2 text-lg">
            <span className="font-bold text-foreground">Total Ticket Price</span>
            <span className="font-bold text-secondary">{formatCurrency(show.price)}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="hero" onClick={onConfirm} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
