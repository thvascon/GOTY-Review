import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useMultiGroups } from "@/hooks/use-multi-groups";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Check, Plus, KeyRound, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserGroup {
  group_id: string;
  group_name: string;
  invite_code: string;
  is_active: boolean;
  joined_at: string;
  member_count: number;
}

interface GroupSwitcherProps {
  onGroupChange?: () => void;
}

export const GroupSwitcher = ({ onGroupChange }: GroupSwitcherProps) => {
  const { toast } = useToast();
  const { refetchProfile, profile, session } = useAuth();
  const {
    groups: localGroups,
    loading: groupsLoading,
    addGroup,
    switchGroup: switchLocalGroup,
    removeGroup,
    initializeFromProfile,
    getActiveGroup,
  } = useMultiGroups(session?.user?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupToLeave, setGroupToLeave] = useState<string | null>(null);

  // Inicializar com o grupo do profile na primeira vez
  useEffect(() => {
    if (profile?.group_id && localGroups.length === 0 && !groupsLoading) {
      initializeFromProfile(profile.group_id);
    }
  }, [profile, localGroups, groupsLoading]);

  const handleSwitchGroup = async (groupId: string) => {
    try {
      await switchLocalGroup(groupId);
      await refetchProfile();

      toast({
        title: "Grupo alterado!",
        description: "Grupo ativo alterado com sucesso.",
      });

      // Force page reload to refresh all data
      window.location.reload();

      if (onGroupChange) {
        onGroupChange();
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o grupo.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate invite code
      const { data: codeData, error: codeError } = await supabase.rpc("generate_invite_code");

      if (codeError) {
        toast({
          title: "Erro",
          description: "Erro ao gerar código de convite.",
          variant: "destructive",
        });
        return;
      }

      const newInviteCode = codeData as string;

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert([{ name: groupName, invite_code: newInviteCode, created_by: user.id }])
        .select()
        .single();

      if (groupError) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o grupo.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar ao localStorage e marcar como ativo
      await addGroup(groupData.id);

      toast({
        title: "Grupo criado!",
        description: `Código de convite: ${newInviteCode}`,
        duration: 5000,
      });

      setIsDialogOpen(false);
      setGroupName("");
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, digite o código de convite.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Buscar grupo pelo código
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (groupError || !groupData) {
        toast({
          title: "Código inválido",
          description: "Grupo não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar ao localStorage e marcar como ativo
      await addGroup(groupData.id);

      toast({
        title: "Sucesso!",
        description: `Você entrou no grupo "${groupData.name}"`,
      });

      setIsDialogOpen(false);
      setInviteCode("");
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    setGroupToLeave(groupId);
  };

  const confirmLeaveGroup = async () => {
    if (!groupToLeave) return;

    try {
      const groupToRemove = localGroups.find((g) => g.id === groupToLeave);

      // Remover do localStorage
      removeGroup(groupToLeave);

      toast({
        title: "Saiu do grupo",
        description: `Você saiu do grupo "${groupToRemove?.name}"`,
      });

      setGroupToLeave(null);

      // Se tinha mais de 1 grupo, recarregar para mostrar o próximo ativo
      if (localGroups.length > 1) {
        window.location.reload();
      } else {
        // Se era o último grupo, redirecionar para criação de grupo
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao sair do grupo.",
        variant: "destructive",
      });
    }
  };

  const activeGroup = getActiveGroup();

  if (groupsLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Users className="w-4 h-4 mr-2" />
        Carregando...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            {activeGroup?.name || "Selecione um grupo"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Seus Grupos ({localGroups.length})</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {localGroups.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Você ainda não está em nenhum grupo
            </div>
          ) : (
            localGroups.map((group) => (
              <div key={group.id} className="relative group/item">
                <DropdownMenuItem
                  onClick={() => handleSwitchGroup(group.id)}
                  className="cursor-pointer pr-10"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        {group.invite_code}
                      </span>
                    </div>
                    {group.isActive && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveGroup(group.id);
                  }}
                >
                  <LogOut className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar ou Entrar em Grupo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Grupos</DialogTitle>
            <DialogDescription>
              Crie um novo grupo ou entre em um grupo existente usando um código de convite
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Users className="w-4 h-4 mr-2" />
                Criar Grupo
              </TabsTrigger>
              <TabsTrigger value="join">
                <Plus className="w-4 h-4 mr-2" />
                Entrar em Grupo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nome do Grupo</Label>
                <Input
                  id="groupName"
                  placeholder="Ex: Amigos do Game"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isJoining}
                />
              </div>
              <Button
                onClick={createGroup}
                disabled={isJoining}
                className="w-full"
              >
                {isJoining ? "Criando..." : "Criar Grupo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Um código de convite será gerado automaticamente
              </p>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Código de Convite</Label>
                <Input
                  id="inviteCode"
                  placeholder="Ex: ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isJoining}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={joinGroup}
                disabled={isJoining}
                className="w-full"
              >
                {isJoining ? "Entrando..." : "Entrar no Grupo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Digite o código fornecido pelo criador do grupo
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!groupToLeave} onOpenChange={() => setGroupToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair do grupo "
              {localGroups.find((g) => g.id === groupToLeave)?.name}"?
              {localGroups.length === 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Este é seu último grupo. Você precisará entrar ou criar outro grupo para continuar usando o CoDEX.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair do Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
