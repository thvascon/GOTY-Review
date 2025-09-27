import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react'; // NOVO: Importamos o ícone de 'X'
import { Button } from '@/components/ui/button'; // NOVO: Importamos o Button


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
  onRemoveGame?: (gameId: string) => void; // NOVO: Função para remover o jogo
  onClick?: () => void;
  className?: string;
}

export const GameCard = ({ 
  id, 
  title, 
  coverImage, 
  ratings, 
  onRatingChange,
  onRemoveGame, // NOVO: Recebemos a função para remover o jogo
  onClick,
  className 
}: GameCardProps) => {

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão afete outros elementos
    onRemoveGame(id);
  };

  return (
    <div className={cn("game-card p-4 relative rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105 ", className)}
    onClick={onClick}
    >
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 w-7 h-7 z-10 opacity-10 hover:opacity-100 "
        onClick={handleRemoveClick}
      >
        <X className="w-4 h-4" />
      </Button>
      {/* Game Cover Image */}
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg">
        <img
          src={coverImage}
          alt={`Capa do jogo ${title}`}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Game Title */}
      <h3 className="mb-4 text-xl font-bold text-foreground line-clamp-2">
        {title}
      </h3>

      {/* Player Ratings */}
      <div className="space-y-3">
        {ratings.map((rating) => (
          <div key={rating.playerId} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0">
              {rating.playerName}
            </span>
            <div className="flex-1 min-w-0">
              <StarRating
                rating={rating.rating}
                onRatingChange={(newRating) => onRatingChange(id, rating.playerId, newRating)}
                size={14}
                className="w-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Average Rating */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Média da Galera
          </span>
          <div className="flex items-center gap-2">
            {(() => {
              const validRatings = ratings.filter(r => r.rating > 0);
              const average = validRatings.length > 0 
                ? validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length 
                : 0;
              
              const getRatingColor = (avg: number) => {
                if (avg === 0) return 'text-rating-unplayed';
                if (avg >= 8) return 'text-rating-excellent';
                if (avg >= 6) return 'text-rating-good';
                return 'text-rating-poor';
              };

              return (
                <>
                  <span className={cn("text-lg font-bold tabular-nums", getRatingColor(average))}>
                    {average > 0 ? average.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({validRatings.length}/{ratings.length})
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};