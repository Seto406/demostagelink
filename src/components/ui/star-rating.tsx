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
            aria-label={`Rate ${starValue} stars`}
            onClick={() => !readOnly && onRatingChange?.(starValue)}
            className={cn(
              "transition-all duration-200 focus:outline-none",
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
