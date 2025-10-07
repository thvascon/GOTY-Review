"use client";

import { useState } from "react";
import { AddGameDialog } from "./AddGameDialog";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";
import { LogOut, Activity, Search, Video } from "lucide-react";
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
import { updateGamesWithRawgId } from "@/utils/updateGamesWithRawgId";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isUpdatingRawgIds, setIsUpdatingRawgIds] = useState(false);

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

  const handleUpdateRawgIds = async () => {
    if (!profile?.group_id) {
      toast({
        title: "Erro",
        description: "Você precisa estar em um grupo",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRawgIds(true);
    toast({
      title: "Atualizando...",
      description: "Buscando trailers para os jogos. Isso pode levar alguns minutos.",
    });

    try {
      const result = await updateGamesWithRawgId(profile.group_id);

      if (result.success) {
        toast({
          title: "Atualização concluída!",
          description: `${result.updated} jogos atualizados com sucesso.`,
        });
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao atualizar rawgIds:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar jogos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRawgIds(false);
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
              className="w-24 h-24 -ml-2"
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
          <Button
            onClick={() => setIsAddGameOpen(true)}
            className="btn-glow"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>

          <Button
            onClick={handleUpdateRawgIds}
            variant="outline"
            size="icon"
            disabled={isUpdatingRawgIds}
            title="Adicionar trailers aos jogos"
          >
            <Video className="w-4 h-4" />
          </Button>

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
