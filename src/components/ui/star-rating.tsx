import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  totalStars?: number;
  size?: number;
  className?: string;
  readOnly?: boolean;
}

export const StarRating = ({
  rating,
  onRatingChange,
  totalStars = 5,
  size = 20,
  className,
  readOnly = false,
}: StarRatingProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: totalStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = rating >= starValue;

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onRatingChange?.(starValue)}
            aria-label={readOnly ? `${starValue} of ${totalStars} stars` : `Rate ${starValue} stars`}
            className={cn(
              "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 rounded-sm",
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isFilled
                  ? "fill-secondary text-secondary"
                  : "fill-transparent text-muted-foreground/40",
                !readOnly && !isFilled && "hover:text-secondary/60"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
