"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface Player {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface Game {
  id: string;
  title: string;
  coverImage: string;
  sectionId?: string;
  genres?: string[];
  groupId?: string;
}

interface Rating {
  gameId: string;
  playerId: string;
  rating: number;
  comment?: string;
  status?: string | null;
}

interface Section {
  id: string;
  title: string;
  groupId?: string;
  groupName?: string;
}

interface GameDataContextType {
  players: Player[];
  games: Game[];
  ratings: Rating[];
  sections: Section[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

// Cache global fora do componente para sobreviver a remontagens
let cachedData: {
  players: Player[];
  games: Game[];
  ratings: Rating[];
  sections: Section[];
  isFetched: boolean;
} = {
  players: [],
  games: [],
  ratings: [],
  sections: [],
  isFetched: false,
};

export const GameDataProvider = ({ children }: { children: ReactNode }) => {
  const { session, profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>(cachedData.players);
  const [games, setGames] = useState<Game[]>(cachedData.games);
  const [ratings, setRatings] = useState<Rating[]>(cachedData.ratings);
  const [sections, setSections] = useState<Section[]>(cachedData.sections);
  // Só loading se não tem cache E não tem dados
  const [loading, setLoading] = useState(!cachedData.isFetched && cachedData.games.length === 0);
  const isFetchingRef = useRef(false);

  console.log("GameDataProvider renderizou - cache:", cachedData.isFetched, "games:", games.length, "loading:", loading);

  const fetchData = async (forceRefetch = false) => {
    if (!session || !profile || profile.name === session.user.email) {
      setLoading(false);
      return;
    }

    // Se já tem dados no cache global e não é um refetch forçado, não buscar
    if (cachedData.isFetched && !forceRefetch) {
      console.log("Dados já em cache, não buscando novamente");
      if (loading) setLoading(false);
      return;
    }

    // Evitar fetch duplicado simultâneo
    if (isFetchingRef.current) {
      console.log("Fetch já em andamento, ignorando...");
      return;
    }

    console.log("Buscando dados do servidor de todos os grupos...");
    isFetchingRef.current = true;
    // Só mostrar loading se não tiver nenhum dado ainda
    if (cachedData.games.length === 0) {
      setLoading(true);
    }

    try {
      // Tentar buscar grupos via nova função (se migration foi aplicada)
      const { data: userGroups, error: groupsError } = await supabase.rpc("get_user_groups");

      let groupIds: string[] = [];

      if (groupsError) {
        // Fallback: Se a função não existe, usar group_id do profile (modo legado)
        console.log("Usando modo legado (sem multi-group):", groupsError.message);
        if (profile?.group_id) {
          groupIds = [profile.group_id];
        } else {
          console.log("Usuário não está em nenhum grupo");
          setLoading(false);
          return;
        }
      } else {
        // Usar os grupos da nova função
        groupIds = (userGroups || []).map((g: any) => g.group_id);

        if (groupIds.length === 0) {
          console.log("Usuário não está em nenhum grupo");
          setLoading(false);
          return;
        }
      }

      // Buscar dados de todos os grupos do usuário
      const [peopleRes, sectionsRes, gamesRes, reviewsRes, groupsDataRes] = await Promise.all([
        supabase.from("people").select("id, name, avatar_url, group_id").in("group_id", groupIds),
        supabase.from("sections").select("*").in("group_id", groupIds),
        supabase.from("games").select("*").in("group_id", groupIds),
        supabase.from("reviews").select("*"),
        supabase.from("groups").select("id, name").in("id", groupIds),
      ]);

      if (peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error) {
        console.error("Erro ao buscar dados:",
          peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error
        );
        return;
      }

      const groupsMap = new Map((groupsDataRes.data || []).map((g: any) => [g.id, g.name]));

      const playersData = peopleRes.data || [];
      const sectionsData = (sectionsRes.data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        groupId: s.group_id,
        groupName: groupsMap.get(s.group_id) || "Grupo",
      }));
      const gamesData = (gamesRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.name,
        coverImage: g.cover_image || "/placeholder.svg",
        sectionId: g.section_id,
        genres: g.genres || [],
        rawgId: g.rawg_id,
        groupId: g.group_id,
      }));
      const ratingsData = (reviewsRes.data || []).map((r: any) => ({
        gameId: r.game_id,
        playerId: r.person_id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
      }));

      // Atualizar cache global
      cachedData = {
        players: playersData,
        games: gamesData,
        ratings: ratingsData,
        sections: sectionsData,
        isFetched: true,
      };

      setPlayers(playersData);
      setSections(sectionsData);
      setGames(gamesData);
      setRatings(ratingsData);

      console.log("Dados carregados com sucesso e salvos no cache!");
    } catch (error) {
      console.error("Erro geral no fetchData:", error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("game-data-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "reviews"
      }, () => {
        console.log("Mudança detectada em reviews, atualizando...");
        fetchData(true); // Força refetch
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "games"
      }, () => {
        console.log("Mudança detectada em games, atualizando...");
        fetchData(true); // Força refetch
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "people"
      }, () => {
        console.log("Mudança detectada em people, atualizando...");
        fetchData(true); // Força refetch
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, profile]);

  return (
    <GameDataContext.Provider value={{
      players,
      games,
      ratings,
      sections,
      loading,
      refetch: () => fetchData(true) // Sempre força refetch quando chamado manualmente
    }}>
      {children}
    </GameDataContext.Provider>
  );
};

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
};