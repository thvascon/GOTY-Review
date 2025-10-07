"use client";

import { Check, Clock, Trophy, X, Star, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GameStatus = 'playing' | 'completed' | 'dropped' | 'wishlist' | 'plan_to_play' | null;

interface GameStatusSelectorProps {
  currentStatus: GameStatus;
  onStatusChange: (status: GameStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  playing: {
    label: 'Jogando',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  completed: {
    label: 'Completado',
    icon: Trophy,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  dropped: {
    label: 'Dropado',
    icon: X,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  wishlist: {
    label: 'Wishlist',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  plan_to_play: {
    label: 'Pretendo Jogar',
    icon: Loader2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
};

export function GameStatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'md',
}: GameStatusSelectorProps) {
  const sizeClasses = {
    sm: 'h-7 text-xs px-2',
    md: 'h-9 text-sm px-3',
    lg: 'h-11 text-base px-4',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentConfig = currentStatus ? statusConfig[currentStatus] : null;
  const CurrentIcon = currentConfig?.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            'gap-2 transition-all',
            currentConfig && [
              currentConfig.color,
              currentConfig.bgColor,
              currentConfig.borderColor,
              'hover:opacity-80',
            ]
          )}
        >
          {currentConfig ? (
            <>
              {CurrentIcon && <CurrentIcon className={iconSizes[size]} />}
              <span>{currentConfig.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Definir Status</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = currentStatus === key;

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onStatusChange(key as GameStatus)}
              className={cn(
                'gap-2 cursor-pointer',
                isSelected && 'bg-accent'
              )}
            >
              <div className={cn('p-1 rounded', config.bgColor)}>
                <Icon className={cn('w-4 h-4', config.color)} />
              </div>
              <span>{config.label}</span>
              {isSelected && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
          );
        })}

        {currentStatus && (
          <>
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem
              onClick={() => onStatusChange(null)}
              className="gap-2 cursor-pointer text-muted-foreground"
            >
              <X className="w-4 h-4" />
              <span>Remover Status</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Badge simples para mostrar status (sem interação)
export function GameStatusBadge({ status }: { status: GameStatus }) {
  if (!status) return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}
