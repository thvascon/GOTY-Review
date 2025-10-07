"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Star, Award, Target } from 'lucide-react';

interface Review {
  rating: number;
  games?: {
    name: string;
  } | null;
}

interface ProfileStatsProps {
  reviews: Review[];
}

export function ProfileStats({ reviews }: ProfileStatsProps) {
  const stats = useMemo(() => {
    const validReviews = reviews.filter(r => r.rating > 0);

    if (validReviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: [],
        highestRated: null,
      };
    }

    // Calcular média
    const sum = validReviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / validReviews.length;

    // Distribuição de notas (1-5)
    const distribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const count = validReviews.filter(r => r.rating === rating).length;
      return {
        rating: rating.toString(),
        count,
        label: `${rating}★`,
      };
    });

    // Jogo com maior nota
    const highest = validReviews.reduce((max, r) =>
      r.rating > max.rating ? r : max
    , validReviews[0]);

    return {
      totalReviews: validReviews.length,
      averageRating: average,
      distribution,
      highestRated: highest.games?.name || 'N/A',
      highestRating: highest.rating,
    };
  }, [reviews]);

  // Cores do gradiente baseadas na nota
  const getBarColor = (rating: number) => {
    if (rating >= 8) return 'hsl(var(--primary))'; // Verde
    if (rating >= 6) return '#3b82f6'; // Azul
    if (rating >= 4) return '#f59e0b'; // Amarelo
    return '#ef4444'; // Vermelho
  };

  if (stats.totalReviews === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Nenhuma avaliação ainda. Comece avaliando alguns jogos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Avaliações</p>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Geral</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}★</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior Nota</p>
              <p className="text-lg font-bold truncate">{stats.highestRating}★</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de distribuição */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Distribuição de Notas
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.distribution}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {stats.distribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(index + 1)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Quantidade de jogos por nota
        </p>
      </div>
    </div>
  );
}
