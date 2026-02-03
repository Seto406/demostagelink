import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-secondary/20 rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Payment Cancelled</h2>
        <p className="text-muted-foreground">
          You have cancelled the payment process. No charges were made.
        </p>
        <Button onClick={() => navigate("/settings")} className="w-full">
          Return to Settings
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
