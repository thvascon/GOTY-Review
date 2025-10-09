"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserMinus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface GroupMember {
  id: string;
  name: string;
  avatar_url: string | null;
  user_id: string;
}

interface ManageGroupMembersDialogProps {
  trigger?: React.ReactNode;
}

export const ManageGroupMembersDialog = ({
  trigger,
}: ManageGroupMembersDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupCreatorId, setGroupCreatorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const isAdmin = profile?.user_id === groupCreatorId;

  useEffect(() => {
    if (open) {
      fetchGroupMembers();
    }
  }, [open, profile?.group_id]);

  const fetchGroupMembers = async () => {
    if (!profile?.group_id) return;

    setIsLoading(true);
    try {
      // Buscar informações do grupo para obter o criador
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("created_by")
        .eq("id", profile.group_id)
        .single();

      if (groupError) {
        console.error("Erro ao buscar grupo:", groupError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar informações do grupo.",
          variant: "destructive",
        });
        return;
      }

      setGroupCreatorId(groupData.created_by);

      // Buscar membros do grupo
      const { data: membersData, error: membersError } = await supabase
        .from("people")
        .select("id, name, avatar_url, user_id")
        .eq("group_id", profile.group_id)
        .order("name");

      if (membersError) {
        console.error("Erro ao buscar membros:", membersError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar membros do grupo.",
          variant: "destructive",
        });
        return;
      }

      setMembers(membersData || []);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas o criador do grupo pode remover membros.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${memberName} do grupo? Todas as avaliações deste membro serão removidas.`
    );

    if (!confirmed) return;

    setRemovingMemberId(memberId);
    try {
      // Remover o group_id do membro (isso também irá deletar as reviews devido ao cascade)
      const { error } = await supabase
        .from("people")
        .update({ group_id: null })
        .eq("id", memberId);

      if (error) {
        console.error("Erro ao remover membro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível remover o membro.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Membro removido",
        description: `${memberName} foi removido do grupo.`,
      });

      // Atualizar lista de membros
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Users className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membros do Grupo
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Gerencie os membros do seu grupo. Clique nos nomes para ver os perfis."
              : "Visualize os membros do grupo. Clique nos nomes para ver os perfis."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Carregando...</div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhum membro encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link
                    href={`/profile?id=${member.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                    onClick={() => setOpen(false)}
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-border group-hover:ring-primary transition-all">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {member.name}
                        </p>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      {member.user_id === groupCreatorId && (
                        <p className="text-xs text-muted-foreground">
                          Criador do grupo
                        </p>
                      )}
                    </div>
                  </Link>
                </div>

                {isAdmin && member.user_id !== groupCreatorId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    disabled={removingMemberId === member.id}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isAdmin && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Apenas o criador do grupo pode remover membros
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
