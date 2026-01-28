import { motion } from "framer-motion";
import { LucideIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const PremiumEmptyState = ({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  className,
}: PremiumEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 rounded-2xl",
        "bg-card/50 border border-secondary/10 backdrop-blur-sm",
        "shadow-[0_0_40px_-20px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Glowing background behind icon */}
        <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full scale-150 animate-pulse-subtle" />

        <div className="relative bg-background/80 p-4 rounded-full border border-secondary/30 shadow-lg ring-4 ring-secondary/5">
          <Icon className="w-8 h-8 text-secondary" />
        </div>
      </div>

      <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
        {title}
      </h3>

      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed text-sm sm:text-base">
        {description}
      </p>

      {action && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action}
        </motion.div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-secondary/30 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary/30 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-secondary/30 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-secondary/30 rounded-br-xl" />
    </motion.div>
  );
};
