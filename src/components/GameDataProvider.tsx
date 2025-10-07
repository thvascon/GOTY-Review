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
    if (!session || !profile || profile.name === session.user.email || !profile.group_id) {
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

    console.log("Buscando dados do servidor...");
    isFetchingRef.current = true;
    // Só mostrar loading se não tiver nenhum dado ainda
    if (cachedData.games.length === 0) {
      setLoading(true);
    }

    try {
      const [peopleRes, sectionsRes, gamesRes, reviewsRes] = await Promise.all([
        supabase.from("people").select("id, name, avatar_url").eq("group_id", profile.group_id),
        supabase.from("sections").select("*").eq("group_id", profile.group_id),
        supabase.from("games").select("*").eq("group_id", profile.group_id),
        supabase.from("reviews").select("*"),
      ]);

      if (peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error) {
        console.error("Erro ao buscar dados:", 
          peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error
        );
        return;
      }

      const playersData = peopleRes.data || [];
      const sectionsData = sectionsRes.data || [];
      const gamesData = (gamesRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.name,
        coverImage: g.cover_image || "/placeholder.svg",
        sectionId: g.section_id,
        genres: g.genres || [],
        rawgId: g.rawg_id,
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