import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProfileSetup = () => {
  const { profile, refetchProfile } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !name.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('people')
      .update({ name: name.trim() })
      .eq('id', profile.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar seu nome.", variant: "destructive" });
    } else {
      await refetchProfile();
      toast({ title: "Bem-vindo!", description: "Seu perfil foi configurado." });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Gamepad2 className="w-10 h-10 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground">CÓDEX</h1>
        </div>

        <div className="bg-card p-8 rounded-lg border">
          <h2 className="text-xl font-bold text-center">Complete seu Perfil</h2>
          <p className="text-muted-foreground text-center text-sm mt-1 mb-6">
            Escolha um nome de usuário para começar.
          </p>
          <form onSubmit={handleProfileSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu nome ou apelido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar e Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};