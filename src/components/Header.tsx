"use client";

import { useState } from "react";
import { AddGameDialog } from "./AddGameDialog";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";
import { LogOut, Activity, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { Plus } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { InviteCodeButton } from "@/components/InviteCodeButton";
import { useTheme } from "@/components/ThemeProvider";
import { PlayerLevel, PlayerLevelBadge } from "@/components/PlayerLevel";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { NotificationButton } from "@/components/NotificationButton";
import { ManageGroupMembersDialog } from "@/components/ManageGroupMembersDialog";
import { GroupSwitcher } from "@/components/GroupSwitcher";

interface HeaderProps {
  onAddGame: (game: { title: string; coverImage?: string }) => void;
  onAddPerson: (person: { name: string }) => void;
  existingPersonNames: string[];
  className?: string;
  searchTerm?: string;
  session: any;
  onSearchTerm?: (value: string) => void;
}

export const Header = ({
  onAddGame,
  onAddPerson,
  existingPersonNames,
  className,
  searchTerm,
  onSearchTerm,
}: HeaderProps) => {
  const { profile } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  const currentTheme = (theme === 'system' ? resolvedTheme : theme) || 'light';

  console.log('Tema atual:', currentTheme);

  const handleLogout = async () => {
    try {
      // Força o logout e limpa o localStorage
      await supabase.auth.signOut({ scope: 'local' });

      // Limpa qualquer cache remanescente
      localStorage.removeItem('supabase.auth.token');

      // Força reload para garantir que tudo seja limpo
      window.location.reload();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, tenta limpar e recarregar
      window.location.reload();
    }
  };

  return (
    <>
      <header
        className={cn(
          "relative flex items-center gap-3 mb-3 flex-wrap md:flex-nowrap",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="GOTY Review Logo"
              width={160}
              height={160}
              className="w-28 h-28 -ml-2"
              priority
            />
          </h1>
        </div>

        {/* Barra de busca - Absolutamente centralizada (Desktop) */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar jogo..."
              value={searchTerm}
              onChange={(e) => onSearchTerm?.(e.target.value)}
              className="w-full pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Botões Desktop - Direita */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto">
          {profile?.xp !== undefined && profile?.level !== undefined && (
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <div className="mr-1 cursor-pointer">
                  <PlayerLevelBadge xp={profile.xp} level={profile.level} size="sm" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" align="start">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Seu Progresso</h4>
                  <PlayerLevel xp={profile.xp} level={profile.level} size="sm" showProgress={true} />
                </div>
              </HoverCardContent>
            </HoverCard>
          )}

          <Button
            onClick={() => setIsAddGameOpen(true)}
            className="btn-glow"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>

          <NotificationButton />

          <GroupSwitcher />

          <ManageGroupMembersDialog />

          <Button asChild variant="outline" size="icon">
            <Link href="/feed">
              <Activity className="w-4 h-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="icon">
            <Link href={profile?.id ? `/profile?id=${profile.id}` : "/profile"}>
              <Avatar className="w-6 h-6">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </Button>

          <InviteCodeButton />
          <ModeToggle className="text-white hover:text-white hover:bg-white/10" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Controles Mobile */}
        <div className="flex items-center gap-2 md:hidden ml-auto">
          <NotificationButton />
          <ModeToggle className="text-white hover:text-white hover:bg-white/10" />
          <MobileMenu
            onAddGameClick={() => setIsAddGameOpen(true)}
            onAddPersonClick={() => setIsAddPersonOpen(true)}
          />
        </div>

        {/* Barra de busca Mobile - Ocupa linha inteira */}
        <div className="w-full md:hidden relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar jogo..."
            value={searchTerm}
            onChange={(e) => onSearchTerm?.(e.target.value)}
            className="w-full pl-10 rounded-full"
          />
        </div>
      </header>

      {/* Dialog para mobile */}
      <AddGameDialog
        onAddGame={(game) => {
          onAddGame(game);
          setIsAddGameOpen(false);
        }}
        open={isAddGameOpen}
        onOpenChange={setIsAddGameOpen}
      />
    </>
  );
};
