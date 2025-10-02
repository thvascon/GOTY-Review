import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const GameDataProvider = ({ children }: { children: ReactNode }) => {
  const { session, profile } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetched, setIsFetched] = useState(false);

  const fetchData = async () => {
    if (!session || !profile || profile.name === session.user.email) {
      setLoading(false);
      return;
    }

    if (isFetched) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [peopleRes, sectionsRes, gamesRes, reviewsRes] = await Promise.all([
        supabase.from("people").select("id, name, avatar_url"),
        supabase.from("sections").select("*"),
        supabase.from("games").select("*"),
        supabase.from("reviews").select("*"),
      ]);

      if (peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error) {
        console.error("Erro ao buscar dados:", 
          peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error
        );
        return;
      }

      setPlayers(peopleRes.data || []);
      setSections(sectionsRes.data || []);
      setGames(
        (gamesRes.data || []).map((g: any) => ({
          id: g.id,
          title: g.name,
          coverImage: g.cover_image || "/placeholder.svg",
          sectionId: g.section_id,
          genres: g.genres || [],
        }))
      );
      setRatings(
        (reviewsRes.data || []).map((r: any) => ({
          gameId: r.game_id,
          playerId: r.person_id,
          rating: r.rating,
          comment: r.comment,
        }))
      );

      setIsFetched(true);
    } catch (error) {
      console.error("Erro geral no fetchData:", error);
    } finally {
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
        fetchData();
      })
      .on("postgres_changes", { 
        event: "*", 
        schema: "public",
        table: "games"
      }, () => {
        fetchData();
      })
      .on("postgres_changes", { 
        event: "*", 
        schema: "public",
        table: "people"
      }, () => {
        fetchData();
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
      refetch: fetchData 
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