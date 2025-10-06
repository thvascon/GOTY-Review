import { useState } from "react";
import { AddGameDialog } from "./AddGameDialog";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";
import { LogOut, Gamepad2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { Plus } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { InviteCodeButton } from "@/components/InviteCodeButton";

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
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

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
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8",
          className
        )}
      >
        <div className="flex items-center w-full sm:w-auto justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-purple-500" />
            GOTY <span className="font-normal">Review</span>
          </h1>

          {/* Controles Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <InviteCodeButton />
            <ModeToggle />
            <MobileMenu
              onAddGameClick={() => setIsAddGameOpen(true)}
              onAddPersonClick={() => setIsAddPersonOpen(true)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="w-full sm:w-96">
          <Input
            type="text"
            placeholder="Buscar jogo..."
            value={searchTerm}
            onChange={(e) => onSearchTerm?.(e.target.value)}
          />
        </div>

        {/* Botões Desktop - Simples */}
        <div className="hidden md:flex flex-row gap-3">
          <Button
            onClick={() => setIsAddGameOpen(true)}
            className="btn-glow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Novo Jogo
          </Button>
          <Button asChild variant="outline">
            <Link to="/feed">
              <Activity className="w-4 h-4 mr-2" />
              Feed
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link to="/profile">
              <Avatar className="w-6 h-6">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              Meu Perfil
            </Link>
          </Button>
        </div>

        {/* Controles Desktop direita */}
        <div className="hidden md:flex items-center gap-2">
          <InviteCodeButton />
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
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
