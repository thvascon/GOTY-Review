import { Gamepad2 } from "lucide-react";
import { AddGameDialog } from "./AddGameDialog";
import { AddPersonDialog } from "./AddPersonDialog";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  onAddGame: (game: { title: string; coverImage?: string }) => void;
  onAddPerson: (person: { name: string }) => void;
  existingPersonNames: string[];
  className?: string;
}

export const Header = ({
  onAddGame,
  onAddPerson,
  existingPersonNames,
  className,
}: HeaderProps) => {
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

      <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
        <AddGameDialog onAddGame={onAddGame} />
        <AddPersonDialog
          onAddPerson={onAddPerson}
          existingNames={existingPersonNames}
        />
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
