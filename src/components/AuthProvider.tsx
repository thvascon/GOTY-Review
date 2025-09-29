"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  user_id: string;
}

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
        const { data: userProfile } = await supabase
          .from("people")
          .select("id, name, user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setProfile(userProfile);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
        fetchSessionAndProfile();
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
