import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ModalReview } from './ModalReview';
import { Clock, Plus, Trophy, Loader2, AlertCircle, Star, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HLTBEntry {
  id: number;
  name: string;
  main: number;
  mainExtra: number;
  completionist: number;
}

interface Game {
  id: string;
  title: string;
  coverImage: string;
  genres?: string[];
  ratings?: {
    playerId: string;
    playerName: string;
    rating: number;
  }[];
}

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  players: any[];
  allReviews: any[];
}

export const GameDetailsModal = ({
  game,
  isOpen,
  onClose,
  players,
  allReviews
}: GameDetailsModalProps) => {
  const [hltbData, setHltbData] = useState<HLTBEntry | null>(null);
  const [isHltbLoading, setIsHltbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && game) {
      const fetchHltbData = async () => {
        setIsHltbLoading(true);
        setHltbData(null);
        setError(null);

        try {
          const response = await fetch(
            `/api/hltb?title=${encodeURIComponent(game.title)}`
          );

          if (!response.ok) {
            throw new Error('Erro ao buscar dados');
          }

          const data = await response.json();

          if (data && data.length > 0) {
            setHltbData(data[0]);
          } else {
            setError('Jogo não encontrado');
          }
        } catch (err) {
          console.error("Erro ao buscar dados do HLTB:", err);
          setError('Erro ao conectar com o servidor');
        } finally {
          setIsHltbLoading(false);
        }
      };

      fetchHltbData();
    }
  }, [isOpen, game]);

  const formatHours = (hours: number) => {
    return hours > 0 ? `${hours}h` : '--';
  };

  if (!game) return null;

  // Calcular estatísticas
  const gameReviews = allReviews.filter(r => r.gameId === game.id && r.rating > 0);
  const averageRating = gameReviews.length > 0
    ? gameReviews.reduce((sum, r) => sum + r.rating, 0) / gameReviews.length
    : 0;
  const totalReviews = gameReviews.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col" hideDefaultClose>
        {/* Header com imagem de fundo */}
        <div className="relative h-auto md:h-64 bg-gradient-to-b from-black/60 to-background">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={game.coverImage}
              alt={game.title}
              fill
              className="object-cover blur-xl opacity-30"
              quality={50}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="relative h-full flex items-end p-3 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-end w-full">
              {/* Capa do jogo */}
              <div className="relative w-full md:w-80 h-[180px] md:h-[180px] flex-shrink-0 rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/10">
                <Image
                  src={game.coverImage}
                  alt={game.title}
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                />
              </div>

              {/* Informações do jogo */}
              <div className="flex-1 pb-2 w-full">
                <h1 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg break-words">
                  {game.title}
                </h1>

                {/* Gêneros */}
                {game.genres && game.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                    {game.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2 md:px-3 py-0.5 md:py-1 text-xs font-medium bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Estatísticas */}
                <div className="flex flex-wrap gap-3 md:gap-6">
                  <div className="flex items-center gap-2 text-white">
                    <div className="flex items-center gap-1 bg-primary px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white" />
                      <span className="font-bold text-base md:text-lg">
                        {averageRating > 0 ? averageRating.toFixed(1) : '--'}
                      </span>
                    </div>
                    <span className="text-xs md:text-sm text-white/80">de 5.0</span>
                  </div>

                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm">
                      {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex overflow-y-auto">
          <Tabs defaultValue="reviews" className="w-full">
            <div className="border-b px-6">
              <TabsList className="w-full justify-start h-12 bg-transparent p-0">
                <TabsTrigger
                  value="reviews"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Avaliações
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Informações
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="reviews" className="p-6 mt-0">
              <ModalReview
                gameId={game.id}
                gameTitle={game.title}
                players={players}
                reviews={allReviews.filter(r => r.gameId === game.id)}
              />
            </TabsContent>

            <TabsContent value="info" className="p-6 mt-0">
              <div className="max-w-2xl mx-auto">
                {/* Card de tempo para terminar */}
                <div className="bg-card rounded-xl border shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Tempo para Terminar
                  </h3>

                  {isHltbLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Buscando dados do HowLongToBeat...</span>
                    </div>
                  )}

                  {!isHltbLoading && hltbData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-muted/50 border">
                          <div className="flex justify-center mb-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="text-2xl font-bold mb-1">
                            {formatHours(hltbData.main)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            História Principal
                          </div>
                        </div>

                        <div className="text-center p-4 rounded-lg bg-muted/50 border">
                          <div className="flex justify-center mb-2">
                            <Plus className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="text-2xl font-bold mb-1">
                            {formatHours(hltbData.mainExtra)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Main + Extras
                          </div>
                        </div>

                        <div className="text-center p-4 rounded-lg bg-muted/50 border">
                          <div className="flex justify-center mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div className="text-2xl font-bold mb-1">
                            {formatHours(hltbData.completionist)}
                          </div>
                          <div className="text-[11px] text-muted-foreground px-0.5">
                            100%
                          </div>
                        </div>
                      </div>

                      {hltbData.name && hltbData.name !== game.title && (
                        <div className="text-xs text-muted-foreground pt-4 border-t text-center">
                          Dados baseados em: <span className="font-medium">{hltbData.name}</span>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground text-center pt-2">
                        Fonte: <a
                          href="https://howlongtobeat.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground transition-colors"
                        >
                          HowLongToBeat.com
                        </a>
                      </div>
                    </div>
                  )}

                  {!isHltbLoading && !hltbData && (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
                      <AlertCircle className="w-12 h-12" />
                      <div className="text-center">
                        <p className="font-medium mb-1">
                          {error || 'Dados não encontrados'}
                        </p>
                        <p className="text-sm">
                          Não foi possível encontrar informações de tempo para este jogo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameDetailsModal;
