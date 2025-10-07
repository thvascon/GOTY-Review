"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Gamepad2, UserPlus, Activity, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";

interface MobileMenuProps {
  onAddGameClick: () => void;
  onAddPersonClick: () => void;
}

export const MobileMenu = ({ onAddGameClick, onAddPersonClick }: MobileMenuProps) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const handleMenuItemClick = (callback?: () => void) => {
    setOpen(false);
    if (callback) {
      setTimeout(callback, 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Menu
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          {/* Perfil */}
          <Link
            href={profile?.id ? `/profile?id=${profile.id}` : "/profile"}
            onClick={() => handleMenuItemClick()}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{profile?.name || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground">Ver perfil</span>
            </div>
          </Link>

          <div className="h-px bg-border my-2" />

          {/* Feed */}
          <Link
            href="/feed"
            onClick={() => handleMenuItemClick()}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Feed de Atividades</span>
              <span className="text-xs text-muted-foreground">Ver o que está rolando</span>
            </div>
          </Link>

          <div className="h-px bg-border my-2" />

          {/* Adicionar Jogo */}
          <button
            onClick={() => handleMenuItemClick(onAddGameClick)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Adicionar Jogo</span>
              <span className="text-xs text-muted-foreground">Novo jogo na biblioteca</span>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};