"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: userProfile } = await supabase
          .from("people")
          .select("id, name, user_id, avatar_url, created_at, group_id")
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
      setProfile(null);
      if (session) {
        fetchSessionAndProfile();
      } else {
        setLoading(false);
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
