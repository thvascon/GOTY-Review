import { useState, useRef, useEffect } from "react";
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
  maxRating = 5,
  size = 16,
  className,
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset hover quando o mouse sai da área das estrelas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || disabled) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;

      if (isOutside && hoveredRating !== null) {
        setHoveredRating(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredRating, disabled]);

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
    
    let newRating: number;
    
    if (hoveredRating !== null) {
      newRating = hoveredRating;
    } else {
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
    <div
      ref={containerRef}
      className={cn("flex items-center justify-between w-full", className)}
      onMouseLeave={() => !disabled && setHoveredRating(null)}
    >
      <div
        className="flex items-center gap-0.5 flex-shrink-0"
      >
        {Array.from({ length: maxRating }, (_, index) => {
          const starPosition = index + 1;

          // Calcula o estado visual baseado no rating atual (rating real, não hover)
          const actualIsFull = starPosition <= rating;
          const actualIsHalf = !actualIsFull && (starPosition - 0.5) <= rating && rating < starPosition;

          // Calcula o estado de hover
          const hoverIsFull = hoveredRating !== null && starPosition <= hoveredRating;
          const hoverIsHalf = hoveredRating !== null && !hoverIsFull && (starPosition - 0.5) <= hoveredRating && hoveredRating < starPosition;

          // Usa hover se estiver hovereando, senão usa o rating real
          const isFull = hoveredRating !== null ? hoverIsFull : actualIsFull;
          const isHalf = hoveredRating !== null ? hoverIsHalf : actualIsHalf;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              className={cn(
                "star-button transition-colors duration-200 relative",
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
              <span className="relative inline-block" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }}>
                {isHalf ? (
                  <>
                    <Star
                      size={size}
                      className="fill-transparent stroke-current opacity-60 absolute"
                      style={{ top: 0, left: 0, transform: 'none' }}
                    />
                    <span className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%', height: '100%', display: 'block' }}>
                      <Star
                        size={size}
                        className="fill-current"
                        style={{ transform: 'none' }}
                      />
                    </span>
                  </>
                ) : (
                  <Star
                    size={size}
                    className={cn(
                      "transition-colors duration-200",
                      isFull
                        ? "fill-current"
                        : "fill-transparent stroke-current opacity-60"
                    )}
                    style={{ transform: 'none', position: 'absolute', top: 0, left: 0 }}
                  />
                )}
              </span>
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