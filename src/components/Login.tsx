import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FaGithub, FaGoogle } from 'react-icons/fa';

export const Login = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Email ou senha inválidos.");
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Confirme seu email!",
        description: "Enviamos um link de confirmação para o seu email.",
      });
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Gamepad2 className="w-10 h-10 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-foreground">GOTY Review</h1>
        </div>

        <div className="bg-card p-8 rounded-lg border">
          <h2 className="text-xl font-bold text-center">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-muted-foreground text-center text-sm mt-1 mb-6">
            Faça {mode === 'login' ? 'login' : 'cadastro'} para ver, adicionar e avaliar jogos.
          </p>

          {/* Abas de Login / Cadastro */}
          <div className="grid grid-cols-2 gap-2 mb-6 bg-muted p-1 rounded-md">
            <Button 
              variant={mode === 'login' ? 'default' : 'ghost'} 
              onClick={() => setMode('login')}
              className="transition-all"
            >
              Login
            </Button>
            <Button 
              variant={mode === 'signup' ? 'default' : 'ghost'} 
              onClick={() => setMode('signup')}
              className="transition-all"
            >
              Cadastro
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button variant="outline" onClick={() => handleOAuthLogin('github')} disabled={loading}>
              <FaGithub className="w-4 h-4 mr-2" /> GitHub
            </Button>
            <Button variant="outline" onClick={() => handleOAuthLogin('google')} disabled={loading}>
              <FaGoogle className="w-4 h-4 mr-2" /> Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};