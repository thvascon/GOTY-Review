// Arquivo: src/components/GameCard.tsx (Versão Final Corrigida)

import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

// ... (suas interfaces PlayerRating e GameCardProps, sem alterações)
interface PlayerRating {
  playerId: string;
  playerName: string;
  rating: number;
}
interface GameCardProps {
  id: string;
  title: string;
  coverImage: string;
  ratings: PlayerRating[];
  onRatingChange: (gameId: string, playerId: string, rating: number) => void;
  onRemoveGame?: (gameId: string) => void;
  onClick?: () => void;
  className?: string;
}

export const GameCard = ({
  id,
  title,
  coverImage,
  ratings,
  onRatingChange,
  onRemoveGame,
  onClick,
  className,
}: GameCardProps) => {

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveGame) {
      onRemoveGame(id);
    }
  };

  return (
    <div
      className={cn("bg-card rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer transition-transform duration-200 hover:scale-105 relative z-0 hover:z-10 transition-transform duration-300 transform hover:scale-105 relative", className)}
      onClick={onClick}
    >
      {/* Container da Imagem */}
      <div className="relative w-full h-48 bg-muted">
        {onRemoveGame && ( // O botão de remover só aparece se a função for passada
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 w-7 h-7 z-10 opacity-70 hover:opacity-100"
            onClick={handleRemoveClick}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <img
          src={coverImage}
          alt={`Capa de ${title}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          loading="lazy"
        />
      </div>

      {/* Container do Conteúdo (Título, Avaliações, Média) */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Div principal que cresce para empurrar a média para baixo */}
        <div className="flex-grow">
          <h3 className="mb-4 text-lg font-bold line-clamp-2 h-14">
            {title}
          </h3>
          <div className="space-y-2">
            {ratings.map((rating) => (
              <div key={rating.playerId} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground mr-1.5">{rating.playerName}</span>
                <StarRating
                  rating={rating.rating}
                  onRatingChange={(newRating) => onRatingChange(id, rating.playerId, newRating)}
                  size={14}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Seção da Média, sempre no final */}
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
    </div>
  );
};