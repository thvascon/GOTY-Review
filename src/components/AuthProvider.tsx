"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  user_id: string;
  avatar_url?: string;
  created_at: string;
  group_id?: string | null;
}

const AuthContext = createContext<{
  session: Session | null;
  profile: Profile | null;
  loading?: boolean;
  refetchProfile: () => void;
}>({ session: null, profile: null, loading: true, refetchProfile: () => {} });

// Cache global para auth
let authCache: {
  session: Session | null;
  profile: Profile | null;
  isFetched: boolean;
} = {
  session: null,
  profile: null,
  isFetched: false,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(authCache.session);
  const [profile, setProfile] = useState<Profile | null>(authCache.profile);
  // Só loading se não tem cache E não tem dados
  const [loading, setLoading] = useState(!authCache.isFetched && !authCache.session);
  const isFetchingRef = useRef(false);

  const fetchProfile = useCallback(async (currentSession: Session) => {
    const { data: userProfile } = await supabase
      .from('people')
      .select('id, name, user_id, avatar_url, created_at, group_id')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();
    setProfile(userProfile);
  }, [])

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      // Se já buscou, não buscar novamente
      if (authCache.isFetched || isFetchingRef.current) {
        setLoading(false);
        return;
      }

      isFetchingRef.current = true;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      let userProfile = null;
      if (session) {
        const { data } = await supabase
          .from("people")
          .select("id, name, user_id, avatar_url, created_at, group_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        userProfile = data;
      }

      // Atualizar cache global
      authCache = {
        session,
        profile: userProfile,
        isFetched: true,
      };

      setSession(session);
      setProfile(userProfile);
      setLoading(false);
      isFetchingRef.current = false;
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Só atualizar se a sessão realmente mudou
      if (session?.user?.id !== authCache.session?.user?.id) {
        authCache.isFetched = false;
        isFetchingRef.current = false;
        setSession(session);
        setProfile(null);
        if (session) {
          fetchSessionAndProfile();
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refetchProfile = useCallback(async () => {
    if (session) {
      await fetchProfile(session)
    }
  }, [session, fetchProfile])

  return (
    <AuthContext.Provider value={{ session, profile, loading, refetchProfile}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
