import { StarRating } from './StarRating';
import { PlayerLink } from './PlayerLink';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface GameCardProps {
  id: string;
  title: string;
  coverImage: string;
  genres?: string[];
  ratings: { playerId: string; rating: number; playerName: string; playerAvatar?: string | null }[];
  onRatingChange: (gameId: string, playerId: string, rating: number) => void;
  onRemoveGame?: (gameId: string) => void;
  onClick?: () => void;
  className?: string;
  loggedInPlayerId?: string;
  index?: number; // Para animação escalonada
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
}: GameCardProps) => {
  const [isRemoving, setIsRemoving] = useState(false);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.03 }}
      className={cn("bg-card rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer relative z-0 hover:z-10 group", className)}
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

      <div className="relative w-full h-48 bg-muted">
        <img
          src={coverImage}
          alt={`Capa de ${title}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-4">
          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
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

          <div className="h-56 flex flex-col">
            {loggedInPlayerId && (
              <div className="mb-4 pb-3 border-b border-border flex-shrink-0 transition-opacity duration-200" style={{ opacity: ratings.length > 0 ? 1 : 0 }}>
                <span className="text-xs text-muted-foreground block mb-2">Sua avaliação:</span>
                <div className="min-h-[28px]">
                  {loggedInRating && (
                    <StarRating
                      rating={loggedInRating.rating}
                      onRatingChange={(newRating) => onRatingChange(id, loggedInPlayerId, newRating)}
                      size={16}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 flex-grow overflow-hidden">
              {otherRatings.map((rating) => (
                <div key={rating.playerId} className="flex items-center justify-between">
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

        <div className="pt-4 mt-4 border-t border-border">
          <div className="flex justify-between items-center text-xs text-muted-foreground uppercase">
            <span>Média da Galera</span>
            <span>
              {(() => {
                const validRatings = ratings.filter(r => r.rating > 0);
                const average = validRatings.length > 0
                  ? (validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length).toFixed(1)
                  : '—';
                return `${average} (${validRatings.length}/${ratings.length})`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};