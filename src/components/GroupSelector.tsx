import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyNewMember } from "@/hooks/use-notifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, KeyRound } from "lucide-react";

interface GroupSelectorProps {
  userId: string;
  onGroupSelected: () => void;
}

export const GroupSelector = ({ userId, onGroupSelected }: GroupSelectorProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o grupo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate invite code
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_invite_code"
      );

      if (codeError) {
        console.error("Erro ao gerar código:", codeError);
        toast({
          title: "Erro",
          description: "Erro ao gerar código de convite.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const inviteCode = codeData as string;

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert([
          {
            name: groupName,
            invite_code: inviteCode,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (groupError) {
        console.error("Erro ao criar grupo:", groupError);
        toast({
          title: "Erro",
          description: "Não foi possível criar o grupo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get user's profile
      const { data: profileData } = await supabase
        .from("people")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        // Update existing profile with group_id
        const { error: updateError } = await supabase
          .from("people")
          .update({ group_id: groupData.id })
          .eq("id", profileData.id);

        if (updateError) {
          console.error("Erro ao atualizar perfil:", updateError);
          toast({
            title: "Erro",
            description: "Erro ao associar perfil ao grupo.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "Grupo criado!",
        description: `Código de convite: ${inviteCode}. Adicione jogos e crie suas próprias seções!`,
        duration: 5000,
      });

      onGroupSelected();
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

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, digite o código de convite.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (groupError || !groupData) {
        toast({
          title: "Código inválido",
          description: "Grupo não encontrado. Verifique o código e tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get user's profile
      const { data: profileData } = await supabase
        .from("people")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        // Update profile with group_id
        const { error: updateError } = await supabase
          .from("people")
          .update({ group_id: groupData.id })
          .eq("id", profileData.id);

        if (updateError) {
          console.error("Erro ao atualizar perfil:", updateError);
          toast({
            title: "Erro",
            description: "Erro ao entrar no grupo.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Notificar outros membros do grupo sobre o novo membro
        await notifyNewMember(groupData.id, profileData.name, profileData.id);
      }

      toast({
        title: "Sucesso!",
        description: `Você entrou no grupo "${groupData.name}"`,
      });

      onGroupSelected();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Crie um novo grupo ou entre em um grupo existente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Users className="w-4 h-4 mr-2" />
                Criar Grupo
              </TabsTrigger>
              <TabsTrigger value="join">
                <KeyRound className="w-4 h-4 mr-2" />
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
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={createGroup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Criando..." : "Criar Grupo"}
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
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={joinGroup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Entrando..." : "Entrar no Grupo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Digite o código fornecido pelo criador do grupo
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
