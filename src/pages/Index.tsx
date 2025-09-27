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
} from "@/components/GameDetailsModal"; // NOVO

// Import game cover images
import cyberpunkCover from "@/assets/game-cyberpunk.jpg";
import eldenRingCover from "@/assets/game-elden-ring.jpg";
import witcherCover from "@/assets/game-witcher.jpg";
import godOfWarCover from "@/assets/game-god-of-war.jpg";

interface Player {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  coverImage: string;
}

interface Rating {
  gameId: string;
  playerId: string;
  rating: number;
}

const Index = () => {
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGameDetails, setSelectedGameDetails] =
    useState<GameWithDetails | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Carrega dados do Supabase ao montar
  useEffect(() => {
    const fetchData = async () => {
      const { data: playersData } = await supabase.from("people").select("*");
      setPlayers(
        (playersData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
        }))
      );

      const { data: gamesData } = await supabase.from("games").select("*");
      setGames(
        (gamesData || []).map((g: any) => ({
          id: g.id,
          title: g.name,
          coverImage: g.cover_image || "/placeholder.svg", // <-- CORRIGIDO AQUI
        }))
      );

      const { data: ratingsData } = await supabase.from("reviews").select("*");
      setRatings(
        (ratingsData || []).map((r: any) => ({
          gameId: r.game_id,
          playerId: r.person_id,
          rating: r.rating,
        }))
      );
    };
    fetchData();
  }, []);

  const handleCardClick = (game: Game) => {
    // 1. Prepara os dados básicos que já temos (título, imagem, notas)
    const initialDetails: GameWithDetails = {
      ...game,
      description: '', // A descrição começa vazia e será carregada depois, dentro do modal
      ratings: getGameRatings(game.id),
    };
    
    // 2. Guarda esses dados iniciais no estado
    setSelectedGameDetails(initialDetails);

    // 3. Abre o modal instantaneamente
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

    // Refetch ratings
    const { data: ratingsData } = await supabase.from("reviews").select("*");
    setRatings(
      (ratingsData || []).map((r: any) => ({
        gameId: r.game_id,
        playerId: r.person_id,
        rating: r.rating,
      }))
    );

    // Show toast feedback
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
  }) => {
    const { data, error } = await supabase
      .from("games")
      .insert([
        {
          name: gameData.title,
          cover_image: gameData.coverImage || "/placeholder.svg",
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

      // Inicializa avaliações para todos os jogadores
      if (players.length > 0) {
        const ratingsToInsert = players.map((player) => ({
          game_id: data.id,
          person_id: player.id,
          rating: 0,
        }));
        await supabase.from("reviews").insert(ratingsToInsert);
        // Refetch ratings
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

      // Filtra apenas jogos com id válido
      const validGames = games.filter((game) => !!game.id);
      if (validGames.length > 0) {
        const ratingsToInsert = validGames.map((game) => ({
          game_id: game.id,
          person_id: data.id,
          rating: 0,
        }));
        await supabase.from("reviews").insert(ratingsToInsert);
        // Refetch ratings
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

    // Pedimos confirmação ao usuário, pois deletar é uma ação permanente
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o jogo "${gameToRemove.title}"? Todas as avaliações também serão removidas.`
    );

    if (!confirmed) {
      return;
    }

    // Deleta o jogo da tabela 'games' no Supabase
    const { error } = await supabase.from("games").delete().eq("id", gameId);

    if (error) {
      console.error("Erro ao remover jogo:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível remover o jogo. Tente novamente.",
        variant: "destructive",
      });
    } else {
      // Se deu certo no banco, removemos o jogo da nossa lista local (estado)
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

        {/* Games Grid */}
        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                coverImage={game.coverImage}
                ratings={getGameRatings(game.id)}
                onRatingChange={handleRatingChange}
                onRemoveGame={handleRemoveGame}
                onClick={() => handleCardClick(game)}
              />
            ))}
          </div>

          {/* Empty State Message */}
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
