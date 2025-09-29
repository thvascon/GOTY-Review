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

useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("Buscando todos os dados em paralelo...");

      // Usamos Promise.all para fazer todas as buscas ao mesmo tempo
      const [peopleRes, sectionsRes, gamesRes, reviewsRes] = await Promise.all([
        supabase.from('people').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('games').select('*'),
        supabase.from('reviews').select('*')
      ]);

      // Verificamos se houve algum erro em qualquer uma das chamadas
      if (peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error) {
        console.error("Erro ao buscar dados:", peopleRes.error || sectionsRes.error || gamesRes.error || reviewsRes.error);
        return; // Sai da função se houver qualquer erro
      }
      
      // Se tudo deu certo, atualizamos os estados com os dados recebidos
      setPlayers(peopleRes.data || []);
      setSections(sectionsRes.data || []);
      setGames((gamesRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.name,
        coverImage: g.cover_image || "/placeholder.svg",
        sectionId: g.section_id,
      })));
      setRatings((reviewsRes.data || []).map((r: any) => ({
        gameId: r.game_id,
        playerId: r.person_id,
        rating: r.rating,
        comment: r.comment,
      })));

    } catch (error) {
      console.error("Erro geral no fetchData:", error);
    }
  };

  fetchData();

  const channel = supabase.channel('public-tables')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      console.log('Mudança no banco detectada, buscando dados novamente...', payload);
      fetchData();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  useEffect(() => {
    // Se o usuário está logado (session existe) E o modal de login ainda está aberto...
    if (session && isAuthModalOpen) {
      // ...então feche o modal.
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
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    onClick={() => supabase.auth.signOut()}
                  >
                    Sair (Logout)
                  </Button>
                </div>
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
                              <div
                                key={game.id}
                                className="relative z-0 hover:z-10"
                              >
                                <GameCard
                                  id={game.id}
                                  title={game.title}
                                  coverImage={game.coverImage}
                                  ratings={getGameRatings(game.id)}
                                  onRatingChange={handleRatingChange}
                                  onRemoveGame={handleRemoveGame}
                                  onClick={() => handleCardClick(game)}
                                  loggedInPlayerId={profile?.id} // Passa o ID do jogador logado
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
                      Adicione alguns jogos para começar a avaliar com seus
                      amigos!
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
