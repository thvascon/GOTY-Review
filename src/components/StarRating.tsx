import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export const StarRating = ({
  rating,
  onRatingChange,
  disabled = false,
  maxRating = 10,
  size = 16,
  className,
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const getRatingColor = (currentRating: number) => {
    if (currentRating === 0) return "star-unplayed";
    if (currentRating >= 8) return "star-excellent";
    if (currentRating >= 6) return "star-good";
    return "star-poor";
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;
  const colorClass = getRatingColor(displayRating);

  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              className={cn(
                "transition-all duration-200",
                !disabled && "hover:scale-110",
                disabled && "cursor-not-allowed",
                colorClass
              )}
              onMouseEnter={
                !disabled ? () => setHoveredRating(starValue) : undefined
              }
              onMouseLeave={
                !disabled ? () => setHoveredRating(null) : undefined
              }
              onClick={(event) => {
                if (!disabled) {
                  event.stopPropagation();
                  if (starValue === rating) {
                    onRatingChange(0);
                  } else {
                    onRatingChange(starValue);
                  }
                }
              }}
            >
              <Star
                size={size}
                className={cn(
                  "transition-all duration-200",
                  isFilled
                    ? "fill-current"
                    : "fill-transparent stroke-current opacity-60"
                )}
              />
            </button>
          );
        })}
      </div>
      <span
        className={cn(
          "ml-2 text-sm font-medium tabular-nums flex-shrink-0",
          colorClass
        )}
      >
        {displayRating > 0 ? `${displayRating}/10` : ""}
      </span>
    </div>
  );
};
