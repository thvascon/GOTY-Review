import { useState, useEffect } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const InviteCodeButton = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!profile?.group_id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("invite_code, name")
        .eq("id", profile.group_id)
        .single();

      if (error) {
        console.error("Erro ao buscar código do grupo:", error);
      } else if (data) {
        setInviteCode(data.invite_code);
        setGroupName(data.name);
      }
      setLoading(false);
    };

    fetchGroupInfo();
  }, [profile?.group_id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "O código de convite foi copiado para a área de transferência.",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  if (!profile?.group_id) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <UserPlus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convide amigos para o grupo</DialogTitle>
          <DialogDescription>
            Compartilhe este código para que outras pessoas possam entrar no grupo "{groupName}"
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Código de convite</p>
                <p className="text-3xl font-bold tracking-wider">{inviteCode}</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleCopy}
            disabled={loading || !inviteCode}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar código
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Pessoas com este código poderão entrar no seu grupo e ver todos os jogos e avaliações.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
