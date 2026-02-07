/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wider font-sans active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(0_100%_25%/0.5)] rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline:
          "border border-secondary/50 bg-transparent text-secondary hover:bg-secondary/10 hover:border-secondary rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "text-foreground hover:bg-muted hover:text-foreground rounded-xl",
        link: "text-secondary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground border border-secondary/30 hover:border-secondary hover:shadow-[0_0_40px_hsl(0_100%_25%/0.6)] text-base rounded-2xl",
        gold: "bg-secondary text-secondary-foreground hover:shadow-[0_0_30px_hsl(43_72%_52%/0.5)] rounded-xl",
        ios: "bg-[hsl(221_83%_53%)] text-white hover:bg-[hsl(221_83%_48%)] rounded-xl font-semibold normal-case tracking-normal",
        "ios-secondary": "bg-muted/80 text-foreground hover:bg-muted rounded-xl font-semibold normal-case tracking-normal backdrop-blur-sm",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
