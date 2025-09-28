import { useEffect, useState } from "react";
import { Gamepad2, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { AddGameDialog } from "@/components/AddGameDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  GameDetailsModal,
  GameWithDetails,
} from "@/components/GameDetailsModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Player {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  coverImage: string;
  sectionId?: string;
}

interface Rating {
  gameId: string;
  playerId: string;
  rating: number;
}

interface Section {
  id: string;
  title: string;
}

const Index = () => {
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGameDetails, setSelectedGameDetails] =
    useState<GameWithDetails | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Buscando todos os dados...");

      const { data: peopleData } = await supabase.from("people").select("*");
      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*");
      const { data: gamesData } = await supabase.from("games").select("*");
      const { data: reviewsData } = await supabase.from("reviews").select("*");

      setPlayers(peopleData || []);
      setSections(sectionsData || []);

      setGames(
        (gamesData || []).map((g: any) => ({
          id: g.id,
          title: g.name,
          coverImage: g.cover_image || "/placeholder.svg", 
          sectionId: g.section_id,
        }))
      );

      setRatings(
        (reviewsData || []).map((r: any) => ({
          gameId: r.game_id,
          playerId: r.person_id,
          rating: r.rating,
        }))
      );
    };

    fetchData();

    const channel = supabase
      .channel("table-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" }, 
        (payload) => {
          console.log("Mudança recebida!", payload);
          fetchData();
        }
      )
      .subscribe();

    // 4. Limpeza
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCardClick = (game: Game) => {
    const initialDetails: GameWithDetails = {
      ...game,
      description: "", 
      ratings: getGameRatings(game.id),
    };

    setSelectedGameDetails(initialDetails);

    setIsModalOpen(true);
  };

  const handleRatingChange = async (
    gameId: string,
    playerId: string,
    newRating: number
  ) => {
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
  }) => {
    const { data, error } = await supabase
      .from("games")
      .insert([
        {
          name: gameData.title,
          cover_image: gameData.coverImage || "/placeholder.svg",
          section_id: gameData.sectionId || null,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header
          onAddGame={handleAddGame}
          onAddPerson={handleAddPerson}
          existingPersonNames={players.map((p) => p.name)}
        />

        <main>
          <Accordion type="single" collapsible className="w-full">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games
                      .filter((game) => game.sectionId === section.id)
                      .map((game) => (
                        <div key={game.id} className="relative z-0 hover:z-10">
                          <GameCard
                            id={game.id}
                            title={game.title}
                            coverImage={game.coverImage}
                            ratings={getGameRatings(game.id)}
                            onRatingChange={handleRatingChange}
                            onRemoveGame={handleRemoveGame}
                            onClick={() => handleCardClick(game)}
                          />
                        </div>
                      ))}
                  </div>
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
                Adicione alguns jogos para começar a avaliar com seus amigos!
              </p>
              <AddGameDialog
                onAddGame={handleAddGame}
                trigger={
                  <Button className="btn-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Jogo
                  </Button>
                }
              />
            </div>
          )}
        </main>
      </div>
      <GameDetailsModal
        game={selectedGameDetails}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Index;
