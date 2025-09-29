import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameCard } from "@/components/GameCard";

export type Game = {
  id: string;
  title: string;
  coverImage: string;
  averageRating: number;
  sectionId?: string;
};

interface GameListProps {
  games: Game[];
  loggedInPlayerId?: string;
  onCardClick: (game: Game) => void;
  onRatingChange: (gameId: string, playerId: string, newRating: number) => Promise<void>;
  onRemoveGame: (gameId: string) => Promise<void>;
  getGameRatings: (gameId: string) => Array<{
    playerId: string;
    playerName: string;
    rating: number;
  }>;
}

export function GameList({ 
  games, 
  loggedInPlayerId, 
  onCardClick, 
  onRatingChange, 
  onRemoveGame, 
  getGameRatings 
}: GameListProps) {
  const [sortBy, setSortBy] = useState<"alphabetical" | "rating">(
    "alphabetical"
  );

  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
    if (sortBy === "rating") return b.averageRating - a.averageRating;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Select para escolher a ordenação */}
      <div className="flex justify-end">
        <Select
          value={sortBy}
          onValueChange={(val) => setSortBy(val as "alphabetical" | "rating")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alphabetical">Ordem alfabética</SelectItem>
            <SelectItem value="rating">Média de nota</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de GameCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedGames.map((game) => (
          <div
            key={game.id}
            className="relative z-0 hover:z-10"
          >
            <GameCard
              id={game.id}
              title={game.title}
              coverImage={game.coverImage}
              ratings={getGameRatings(game.id)}
              onRatingChange={onRatingChange}
              onRemoveGame={onRemoveGame}
              onClick={() => onCardClick(game)}
              loggedInPlayerId={loggedInPlayerId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}