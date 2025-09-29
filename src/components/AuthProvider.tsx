// Arquivo: src/components/AuthProvider.tsx (Versão atualizada)
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

// Interface para o perfil do usuário (da sua tabela 'people')
interface Profile {
  id: string;
  name: string;
  user_id: string;
}

// O contexto agora guarda a sessão E o perfil
const AuthContext = createContext<{
  session: Session | null;
  profile: Profile | null;
}>({ session: null, profile: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log("Objeto supabase DENTRO do AuthProvider:", supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Se há uma sessão, buscamos o perfil correspondente na tabela 'people'
        const { data: userProfile } = await supabase
          .from("people")
          .select("id, name, user_id")
          .eq("user_id", session.user.id)
          .maybeSingle(); // <-- A correção
        setProfile(userProfile);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Se o usuário deslogar, limpa o perfil
      if (!session) {
        setProfile(null);
      } else {
        fetchSessionAndProfile(); // Se logar, busca o perfil
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ session, profile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
