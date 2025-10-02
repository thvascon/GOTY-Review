import { AddGameDialog } from "./AddGameDialog";
import { AddPersonDialog } from "./AddPersonDialog";
import { cn } from "@/lib/utils";
import { LogOut, Gamepad2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";

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

  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8",
        className
      )}
    >
      <div className="flex items-center w-full">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-purple-500" />
          GOTY <span className="font-normal">Review</span>
        </h1>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto sm:hidden"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
      <div className="w-full sm:w-96">
        <Input
          type="text"
          placeholder="Buscar jogo..."
          value={searchTerm}
          onChange={(e) => onSearchTerm?.(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
        <AddGameDialog onAddGame={onAddGame} />
        <AddPersonDialog
          onAddPerson={onAddPerson}
          existingNames={existingPersonNames}
        />
        
        {/* Botão do Perfil com Avatar */}
        <Button asChild variant="outline" className="gap-2">
          <Link to="/profile">
            <Avatar className="w-6 h-6">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">Meu Perfil</span>
            <User className="w-4 h-4 sm:hidden" />
          </Link>
        </Button>
      </div>
      
      <div className="">
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden sm:inline-flex"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};