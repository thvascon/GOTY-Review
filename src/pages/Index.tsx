import { useEffect, useState } from "react";
import { Gamepad2, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { AddGameDialog } from "@/components/AddGameDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GameDetailsModal } from "@/components/GameDetailsModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/components/AuthProvider";
import { Auth } from "@/components/Auth";
import { GameList } from "@/components/GameList";

interface Player {
  id: string;
  name: string;
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

interface GameWithDetails extends Game {
  ratings: {
    playerId: string;
    playerName: string;
    rating: number;
  }[];
  genres?: string[];
}

const Index = () => {
  console.log("Objeto supabase DENTRO do Index.tsx:", supabase);
  const { toast } = useToast();
  const { session, profile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGameDetails, setSelectedGameDetails] =
    useState<GameWithDetails | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Buscando todos os dados em paralelo...");

        const [peopleRes, sectionsRes, gamesRes, reviewsRes] =
          await Promise.all([
            supabase.from("people").select("*"),
            supabase.from("sections").select("*"),
            supabase.from("games").select("*"),
            supabase.from("reviews").select("*"),
          ]);

        if (
          peopleRes.error ||
          sectionsRes.error ||
          gamesRes.error ||
          reviewsRes.error
        ) {
          console.error(
            "Erro ao buscar dados:",
            peopleRes.error ||
              sectionsRes.error ||
              gamesRes.error ||
              reviewsRes.error
          );
          return;
        }

        setPlayers(peopleRes.data || []);
        setSections(sectionsRes.data || []);

        const sectionsData = sectionsRes.data || [];
        if (sectionsData.length > 0 && !openAccordion) {
          const geralSection = sectionsData.find((s) => s.title === "Gerais");
          setOpenAccordion(geralSection ? geralSection.id : sectionsData[0].id);
        }

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
      } catch (error) {
        console.error("Erro geral no fetchData:", error);
      }
    };

    fetchData();

    const channel = supabase
      .channel("public-tables")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        console.log(
          "Mudança no banco detectada, buscando dados novamente...",
          payload
        );
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (session && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [session, isAuthModalOpen]);

  const handleCardClick = (game: Game) => {
    const initialDetails: GameWithDetails = {
      ...game,
      ratings: getGameRatings(game.id),
    };

    setSelectedGameDetails(initialDetails);

    setIsModalOpen(true);
  };

  const handleRatingChange = async (
    gameId: string,
    _playerId_ignored: string,
    newRating: number
  ) => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para avaliar.",
        variant: "destructive",
      });
      return;
    }

    const playerId = profile.id;
    const existing = ratings.find(
      (r) => r.gameId === gameId && r.playerId === playerId
    );

    if (existing) {
      await supabase
        .from("reviews")
        .update({ rating: newRating })
        .eq("game_id", gameId)
        .eq("person_id", playerId);
    } else {
      await supabase
        .from("reviews")
        .insert([{ game_id: gameId, person_id: playerId, rating: newRating }]);
    }

    const { data: ratingsData } = await supabase.from("reviews").select("*");
    setRatings(
      (ratingsData || []).map((r: any) => ({
        gameId: r.game_id,
        playerId: r.person_id,
        rating: r.rating,
        comment: r.comment,
      }))
    );

    const game = games.find((g) => g.id === gameId);
    const player = players.find((p) => p.id === playerId);

    if (game && player) {
      if (newRating === 0) {
        toast({
          title: "Avaliação removida!",
          description: `${player.name} removeu a avaliação de "${game.title}"`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Avaliação atualizada!",
          description: `${player.name} avaliou "${game.title}" com ${newRating}/10 estrelas`,
          duration: 2000,
        });
      }
    }
  };

  const handleAddGame = async (gameData: {
    title: string;
    coverImage?: string;
    sectionId?: string;
    genres?: string[];
  }) => {
    const { data, error } = await supabase
      .from("games")
      .insert([
        {
          name: gameData.title,
          cover_image: gameData.coverImage || "/placeholder.svg",
          section_id: gameData.sectionId || null,
          genres: gameData.genres || [],
        },
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar jogo",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setGames((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.name,
          coverImage: (data as any).cover_image || "/placeholder.svg",
          sectionId: data.section_id,
          genres: (data as any).genres || [],
        },
      ]);

      if (players.length > 0) {
        const ratingsToInsert = players.map((player) => ({
          game_id: data.id,
          person_id: player.id,
          rating: 0,
        }));
        await supabase.from("reviews").insert(ratingsToInsert);
        const { data: ratingsData } = await supabase
          .from("reviews")
          .select("*");
        setRatings(
          (ratingsData || []).map((r: any) => ({
            gameId: r.game_id,
            playerId: r.person_id,
            rating: r.rating,
            comment: r.comment,
          }))
        );
      }
    }
  };

  const handleAddPerson = async (personData: { name: string }) => {
    const { data, error } = await supabase
      .from("people")
      .insert([{ name: personData.name }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar pessoa",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setPlayers((prev) => [...prev, { id: data.id, name: data.name }]);

      const validGames = games.filter((game) => !!game.id);
      if (validGames.length > 0) {
        const ratingsToInsert = validGames.map((game) => ({
          game_id: game.id,
          person_id: data.id,
          rating: 0,
        }));
        await supabase.from("reviews").insert(ratingsToInsert);
        const { data: ratingsData } = await supabase
          .from("reviews")
          .select("*");
        setRatings(
          (ratingsData || []).map((r: any) => ({
            gameId: r.game_id,
            playerId: r.person_id,
            rating: r.rating,
            comment: r.comment,
          }))
        );
      }
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    const gameToRemove = games.find((g) => g.id === gameId);
    if (!gameToRemove) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja remover o jogo "${gameToRemove.title}"? Todas as avaliações também serão removidas.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("games").delete().eq("id", gameId);

    if (error) {
      console.error("Erro ao remover jogo:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível remover o jogo. Tente novamente.",
        variant: "destructive",
      });
    } else {
      setGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
      toast({
        title: "Jogo removido!",
        description: `"${gameToRemove.title}" foi removido com sucesso.`,
      });
    }
  };

  const getGameRatings = (gameId: string) => {
    return players.map((player) => {
      const rating = ratings.find(
        (r) => r.gameId === gameId && r.playerId === player.id
      );
      return {
        playerId: player.id,
        playerName: player.name,
        rating: rating?.rating || 0,
      };
    });
  };

  const getAverageRating = (gameId: string) => {
    const gameRatings = getGameRatings(gameId);
    const validRatings = gameRatings.filter((r) => r.rating > 0);
    if (validRatings.length === 0) return 0;

    const sum = validRatings.reduce((total, r) => total + r.rating, 0);
    return sum / validRatings.length;
  };

  const renderGameCardsForSection = (sectionId: string) => {
    const sectionGames = games
      .filter((game) => game.sectionId === sectionId)
      .map((game) => ({
        ...game,
        averageRating: getAverageRating(game.id),
      }));

    return (
      <GameList
        games={sectionGames}
        loggedInPlayerId={profile?.id}
        onCardClick={handleCardClick}
        onRatingChange={handleRatingChange}
        onRemoveGame={handleRemoveGame}
        getGameRatings={getGameRatings}
      />
    );
  };

  return (
    <>
      <Auth open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Header
            onAddGame={handleAddGame}
            onAddPerson={handleAddPerson}
            existingPersonNames={players.map((p) => p.name)}
          />

          <main>
            {session ? (
              <>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={openAccordion}
                  onValueChange={setOpenAccordion}
                >
                  {sections.map((section) => (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border-b-0 overflow-visible relative"
                    >
                      <AccordionTrigger className="text-2xl font-bold hover:no-underline">
                        {section.title}
                      </AccordionTrigger>
                      <AccordionContent className="overflow-visible relative">
                        {renderGameCardsForSection(section.id)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {games.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum jogo adicionado ainda
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Adicione alguns jogos para começar a avaliar com seus
                      amigos!
                    </p>
                    <AddGameDialog
                      onAddGame={handleAddGame as any}
                      trigger={
                        <Button className="btn-glow">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Jogo
                        </Button>
                      }
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                <h2 className="text-2xl font-bold mb-4">
                  Bem-vindo ao Game Review da Galera!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Faça login para ver, adicionar e avaliar jogos.
                </p>
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  Fazer Login ou Cadastrar
                </Button>
              </div>
            )}
          </main>
        </div>
        <GameDetailsModal
          game={selectedGameDetails}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          players={players}
          allReviews={ratings}
        />
      </div>
    </>
  );
};

export default Index;
