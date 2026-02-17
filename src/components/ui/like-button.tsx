import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  isLiked: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LikeButton = ({
  isLiked,
  onClick,
  className,
  size = "md"
}: LikeButtonProps) => {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11"
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center transition-all",
        "bg-background/80 backdrop-blur-sm border border-secondary/30",
        "hover:border-primary/50 hover:bg-background/90",
        sizeClasses[size],
        className
      )}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <motion.div
        initial={false}
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-colors",
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-500"
          )}
        />
      </motion.div>
    </motion.button>
  );
};
