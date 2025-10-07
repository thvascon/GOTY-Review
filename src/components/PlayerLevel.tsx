"use client";

import { Trophy, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerLevelProps {
  xp: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

// Função para calcular XP necessário para o próximo nível
function getXpForNextLevel(currentLevel: number): number {
  let totalXp = 0;
  for (let i = 1; i <= currentLevel; i++) {
    totalXp += i * 100;
  }
  return totalXp;
}

// Função para calcular XP do nível atual
function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel === 1) return 0;
  return getXpForNextLevel(currentLevel - 1);
}

export function PlayerLevel({
  xp,
  level,
  size = 'md',
  showProgress = true,
  className
}: PlayerLevelProps) {
  const currentLevelXp = getXpForCurrentLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  const sizeClasses = {
    sm: {
      badge: 'h-6 w-6 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs',
      progress: 'h-1.5',
    },
    md: {
      badge: 'h-8 w-8 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm',
      progress: 'h-2',
    },
    lg: {
      badge: 'h-12 w-12 text-lg',
      icon: 'w-6 h-6',
      text: 'text-base',
      progress: 'h-3',
    },
  };

  const classes = sizeClasses[size];

  // Cores baseadas no nível
  const getLevelColor = () => {
    if (level >= 50) return 'from-purple-500 to-pink-500'; // Lendário
    if (level >= 30) return 'from-yellow-400 to-orange-500'; // Épico
    if (level >= 15) return 'from-blue-400 to-cyan-500'; // Raro
    if (level >= 5) return 'from-green-400 to-emerald-500'; // Incomum
    return 'from-gray-400 to-gray-500'; // Comum
  };

  const getLevelBorderColor = () => {
    if (level >= 50) return 'border-purple-500/50';
    if (level >= 30) return 'border-yellow-500/50';
    if (level >= 15) return 'border-blue-500/50';
    if (level >= 5) return 'border-green-500/50';
    return 'border-gray-500/50';
  };

  const getLevelBgColor = () => {
    if (level >= 50) return 'bg-purple-500/10';
    if (level >= 30) return 'bg-yellow-500/10';
    if (level >= 15) return 'bg-blue-500/10';
    if (level >= 5) return 'bg-green-500/10';
    return 'bg-gray-500/10';
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Badge de Nível */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold border-2",
            "bg-gradient-to-br shadow-lg",
            classes.badge,
            getLevelColor(),
            getLevelBorderColor()
          )}
        >
          <span className="text-white drop-shadow-md">{level}</span>
        </div>
        {level >= 10 && (
          <div className="absolute -top-1 -right-1">
            <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>

      {/* Informações de XP e Progresso */}
      {showProgress && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Zap className={cn("text-yellow-500", classes.icon)} />
              <span className={cn("font-semibold", classes.text)}>
                Nível {level}
              </span>
            </div>
            <span className={cn("text-muted-foreground", classes.text)}>
              {xpInCurrentLevel}/{xpNeededForNextLevel} XP
            </span>
          </div>
          <div className={cn("w-full bg-muted rounded-full overflow-hidden mt-1", classes.progress)}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                "bg-gradient-to-r",
                getLevelColor()
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente compacto apenas com o badge
export function PlayerLevelBadge({ xp, level, size = 'sm' }: PlayerLevelProps) {
  return <PlayerLevel xp={xp} level={level} size={size} showProgress={false} />;
}

// Componente para mostrar XP ganho (animação)
export function XpGain({ amount }: { amount: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Zap className="w-3 h-3 fill-current" />
      <span>+{amount} XP</span>
    </div>
  );
}
