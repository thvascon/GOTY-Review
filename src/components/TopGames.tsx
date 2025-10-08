"use client";

import { useMemo } from 'react';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Game {
  id: string;
  title: string;
  coverImage: string;
}

interface Rating {
  gameId: string;
  rating: number;
}

interface TopGamesProps {
  games: Game[];
  ratings: Rating[];
  limit?: number;
  onGameClick?: (gameId: string) => void;
}

export function TopGames({ games, ratings, limit = 10, onGameClick }: TopGamesProps) {
  const topGames = useMemo(() => {
    // Calcular média por jogo
    const gameStats = games.map(game => {
      const gameRatings = ratings.filter(r => r.gameId === game.id && r.rating > 0);

      if (gameRatings.length === 0) {
        return null;
      }

      const sum = gameRatings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / gameRatings.length;

      return {
        ...game,
        averageRating: average,
        totalRatings: gameRatings.length,
      };
    });

    // Filtrar nulls e ordenar por média (e depois por quantidade de avaliações em caso de empate)
    return gameStats
      .filter(Boolean)
      .sort((a, b) => {
        if (b!.averageRating === a!.averageRating) {
          return b!.totalRatings - a!.totalRatings;
        }
        return b!.averageRating - a!.averageRating;
      })
      .slice(0, limit) as NonNullable<typeof gameStats[0]>[];
  }, [games, ratings, limit]);

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return null;
  };

  const getMedalColor = (position: number) => {
    if (position === 0) return 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30';
    if (position === 1) return 'from-gray-400/20 to-gray-500/5 border-gray-400/30';
    if (position === 2) return 'from-amber-700/20 to-amber-800/5 border-amber-700/30';
    return 'from-muted/50 to-background border-border';
  };

  if (topGames.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Nenhum jogo avaliado ainda. Comece avaliando alguns jogos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {topGames.map((game, index) => (
          <div
            key={game.id}
            onClick={() => onGameClick?.(game.id)}
            className={cn(
              'group relative overflow-hidden rounded-lg border bg-gradient-to-r p-4 transition-all',
              'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
              getMedalColor(index)
            )}
          >
            <div className="flex items-center gap-4">
              {/* Posição */}
              <div className="flex-shrink-0 w-12 text-center">
                {getMedalIcon(index) || (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Capa do jogo */}
              <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden shadow-md">
                <Image
                  src={game.coverImage}
                  alt={game.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 120px, 160px"
                  quality={100}
                  priority={index < 3}
                  unoptimized
                />
              </div>

              {/* Info do jogo */}
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {game.totalRatings} {game.totalRatings === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              {/* Nota */}
              <div className="flex-shrink-0 text-right">
                <div className="text-3xl font-bold text-primary">
                  {game.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">★ / 5</div>
              </div>
            </div>

            {/* Barra de progresso (visual) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(game.averageRating / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
