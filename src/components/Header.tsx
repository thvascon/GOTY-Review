import { Gamepad2 } from 'lucide-react';
import { AddGameDialog } from './AddGameDialog';
import { AddPersonDialog } from './AddPersonDialog';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onAddGame: (game: { title: string; coverImage?: string }) => void;
  onAddPerson: (person: { name: string }) => void;
  existingPersonNames: string[];
  className?: string;
}

export const Header = ({ onAddGame, onAddPerson, existingPersonNames, className }: HeaderProps) => {
  return (
    <header className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent">
          <Gamepad2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            GOTY Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <AddGameDialog onAddGame={onAddGame} />
        <AddPersonDialog 
          onAddPerson={onAddPerson} 
          existingNames={existingPersonNames}
        />
      </div>
    </header>
  );
};