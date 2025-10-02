import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // Aceita valores de 0 a 5 (incluindo 0.5, 1.5, 2.5, etc.)
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
  maxRating = 5,
  size = 16,
  className,
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const getRatingColor = (currentRating: number) => {
    if (currentRating === 0) return "star-unplayed";
    if (currentRating >= 4) return "star-excellent";
    if (currentRating >= 3) return "star-good";
    return "star-poor";
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;
  const colorClass = getRatingColor(displayRating);

  const handleStarClick = (event: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (disabled) return;
    
    event.stopPropagation();
    
    // Usa o hoveredRating se existir, senão calcula baseado no click
    let newRating: number;
    
    if (hoveredRating !== null) {
      // Usa o rating que está sendo mostrado no hover
      newRating = hoveredRating;
    } else {
      // Fallback: calcula baseado na posição do click
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const starWidth = rect.width;
      const isLeftHalf = clickX < starWidth / 2;
      newRating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    }
    
    if (newRating === rating) {
      onRatingChange(0);
    } else {
      onRatingChange(newRating);
    }
  };

  const handleStarHover = (event: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    if (disabled) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isLeftHalf = hoverX < starWidth / 2;
    
    const hoverRating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    setHoveredRating(hoverRating);
  };

  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {Array.from({ length: maxRating }, (_, index) => {
          const starPosition = index + 1;
          const isFull = starPosition <= displayRating;
          const isHalf = !isFull && (starPosition - 0.5) <= displayRating && displayRating < starPosition;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              className={cn(
                "transition-all duration-200 relative",
                !disabled && "hover:scale-110",
                disabled && "cursor-not-allowed",
                colorClass
              )}
              onMouseMove={
                !disabled ? (e) => handleStarHover(e, index) : undefined
              }
              onMouseLeave={
                !disabled ? () => setHoveredRating(null) : undefined
              }
              onClick={(e) => handleStarClick(e, index)}
            >
              {isHalf ? (
                <div className="relative inline-block">
                  <Star
                    size={size}
                    className="fill-transparent stroke-current opacity-60"
                  />
                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                    <Star
                      size={size}
                      className="fill-current"
                    />
                  </div>
                </div>
              ) : (
                <Star
                  size={size}
                  className={cn(
                    "transition-all duration-200",
                    isFull
                      ? "fill-current"
                      : "fill-transparent stroke-current opacity-60"
                  )}
                />
              )}
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
        {displayRating > 0 ? `${displayRating.toFixed(1)}/5` : ""}
      </span>
    </div>
  );
};