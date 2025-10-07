"use client";

import { StarRating } from "./StarRating";
import { PlayerLink } from "./PlayerLink";
import { cn } from "@/lib/utils";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useGameTrailer } from "@/hooks/useGameTrailer";
import { GameStatusBadge, type GameStatus } from "./GameStatusSelector";

interface GameCardProps {
  id: string;
  title: string;
  coverImage: string;
  genres?: string[];
  ratings: {
    playerId: string;
    rating: number;
    playerName: string;
    playerAvatar?: string | null;
    status?: string | null;
  }[];
  onRatingChange: (gameId: string, playerId: string, rating: number) => void;
  onRemoveGame?: (gameId: string) => void;
  onClick?: () => void;
  className?: string;
  loggedInPlayerId?: string;
  index?: number;
  rawgId?: number;
}

export const GameCard = ({
  id,
  title,
  coverImage,
  genres,
  ratings,
  onRatingChange,
  onRemoveGame,
  onClick,
  className,
  loggedInPlayerId,
  index = 0,
  rawgId,
}: GameCardProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const { media } = useGameTrailer(rawgId || null, isHovering);

  // Rotacionar screenshots
  useEffect(() => {
    if (media?.type === 'screenshots' && media.screenshots && isHovering) {
      const interval = setInterval(() => {
        setCurrentScreenshotIndex((prev) =>
          (prev + 1) % (media.screenshots?.length || 1)
        );
      }, 800); // Troca a cada 800ms

      return () => clearInterval(interval);
    }
  }, [media, isHovering]);

  const { loggedInRating, otherRatings } = useMemo(() => {
    const userRating = loggedInPlayerId
      ? ratings.find((r) => r.playerId === loggedInPlayerId)
      : undefined;

    const others = loggedInPlayerId
      ? ratings.filter((r) => r.playerId !== loggedInPlayerId)
      : ratings;

    return { loggedInRating: userRating, otherRatings: others };
  }, [ratings, loggedInPlayerId]);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja remover "${title}"?`)) {
      if (onRemoveGame) {
        setIsRemoving(true);
        await onRemoveGame(id);
        setIsRemoving(false);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{
        duration: 0.2,
      }}
      className={cn(
        "bg-gradient-to-br from-card to-card/80 rounded-xl shadow-lg overflow-hidden flex flex-col cursor-pointer relative z-0 group",
        "hover:shadow-[0_8px_40px_rgba(156,163,175,0.1)]",
        className
      )}
      onClick={onClick}
    >
      {onRemoveGame && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isRemoving ? "Removendo..." : "Remover jogo"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div
        className="relative w-full h-48 bg-muted"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setCurrentScreenshotIndex(0);
        }}
      >
        {isHovering && media ? (
          <>
            {/* Vídeo direto da RAWG */}
            {media.type === 'video' && media.url && (
              <video
                src={media.url}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            )}

            {/* YouTube embed do IGDB */}
            {media.type === 'youtube' && media.youtubeId && (
              <iframe
                src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${media.youtubeId}`}
                className="absolute inset-0 w-full h-full object-cover"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            )}

            {/* Screenshots em rotação */}
            {media.type === 'screenshots' && media.screenshots && (
              <Image
                src={media.screenshots[currentScreenshotIndex]}
                alt={`Screenshot ${currentScreenshotIndex + 1} de ${title}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-top transition-opacity duration-300"
                quality={85}
              />
            )}
          </>
        ) : (
          <Image
            src={coverImage || "/placeholder.svg"}
            alt={`Capa de ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top"
            quality={85}
            priority={index < 3}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
            {title}
          </h3>
          {loggedInRating?.status && (
            <div className="mt-2">
              <GameStatusBadge status={loggedInRating.status as GameStatus} />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow relative pb-14">
        <div className="mb-4">
          <div className="h-64 flex flex-col">
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
                {genres.map((genre, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 bg-muted/50 rounded border border-border/50 text-muted-foreground"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            {loggedInPlayerId && (
              <div
                className="mb-4 pb-3 border-b border-border flex-shrink-0 transition-opacity duration-200"
                style={{ opacity: ratings.length > 0 ? 1 : 0 }}
              >
                <span className="text-xs text-muted-foreground block mb-2">
                  Sua avaliação:
                </span>
                <div className="min-h-[28px]">
                  {loggedInRating && (
                    <StarRating
                      rating={loggedInRating.rating}
                      onRatingChange={(newRating) =>
                        onRatingChange(id, loggedInPlayerId, newRating)
                      }
                      size={16}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 flex-grow overflow-hidden">
              {otherRatings.map((rating) => (
                <div
                  key={rating.playerId}
                  className="flex items-center justify-between"
                >
                  <PlayerLink
                    playerId={rating.playerId}
                    playerName={rating.playerName}
                    avatarUrl={rating.playerAvatar}
                    showAvatar={false}
                    className="text-sm text-muted-foreground mr-1.5"
                  />
                  <StarRating
                    rating={rating.rating}
                    onRatingChange={() => {}}
                    size={14}
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-border bg-gradient-to-br from-card to-card/80 transition-colors">
          <div className="flex justify-between items-center text-xs text-muted-foreground uppercase">
            <span>Média da Galera</span>
            <span>
              {(() => {
                const validRatings = ratings.filter((r) => r.rating > 0);
                const average =
                  validRatings.length > 0
                    ? (
                        validRatings.reduce((sum, r) => sum + r.rating, 0) /
                        validRatings.length
                      ).toFixed(1)
                    : "—";
                return `${average} (${validRatings.length})`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
