import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends ButtonProps {
  value: string;
  successMessage?: string;
  errorMessage?: string;
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ value, successMessage = "Copied!", errorMessage = "Failed to copy", className, children, onClick, ...props }, ref) => {
    const [hasCopied, setHasCopied] = React.useState(false);

    React.useEffect(() => {
      if (hasCopied) {
        const timeout = setTimeout(() => setHasCopied(false), 2000);
        return () => clearTimeout(timeout);
      }
    }, [hasCopied]);

    const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(value);
        setHasCopied(true);
        toast.success(successMessage);
        onClick?.(e);
      } catch (err) {
        toast.error(errorMessage);
      }
    };

    return (
      <Button
        ref={ref}
        onClick={handleCopy}
        className={cn("transition-all duration-200", className)}
        {...props}
      >
        {hasCopied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          children || (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )
        )}
      </Button>
    );
  }
);
CopyButton.displayName = "CopyButton";
