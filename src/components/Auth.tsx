// Arquivo: src/components/Auth.tsx

import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

// Este componente recebe 'open' e 'onOpenChange' para controlar sua visibilidade
export const Auth = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acesse sua Conta</DialogTitle>
        </DialogHeader>
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['github', 'google']} // Opcional: adicione logins sociais
        />
      </DialogContent>
    </Dialog>
  );
};