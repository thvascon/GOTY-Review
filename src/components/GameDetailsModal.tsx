import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalReview } from './ModalReview';
import { Clock, Plus, Trophy, Loader2, AlertCircle } from 'lucide-react';

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
            `${import.meta.env.VITE_BACK_END_URL}/api/hltb?title=${encodeURIComponent(game.title)}`
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">{game.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex-shrink-0 space-y-4">
              <img 
                src={game.coverImage} 
                alt={`Capa de ${game.title}`} 
                className="w-full h-auto rounded-lg shadow-lg" 
              />

              <div className="p-4 bg-card rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-4 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tempo para Terminar
                </h3>

                {isHltbLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando...</span>
                  </div>
                )}

                {!isHltbLoading && hltbData && (
                  <div className="space-y-3">
                    <div className="flex items-center py-2.5 px-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">História</span>
                      </div>
                      <div className="flex-grow" />
                      <span className="font-bold text-sm">
                        {formatHours(hltbData.main)}
                      </span>
                    </div>

                    <div className="flex items-center py-2.5 px-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Main + Extras</span>
                      </div>
                      <div className="flex-grow" />
                      <span className="font-bold text-sm">
                        {formatHours(hltbData.mainExtra)}
                      </span>
                    </div>

                    <div className="flex items-center py-2.5 px-3 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">100%</span>
                      </div>
                      <div className="flex-grow" />
                      <span className="font-bold text-sm">
                        {formatHours(hltbData.completionist)}
                      </span>
                    </div>

                    {hltbData.name && hltbData.name !== game.title && (
                      <p className="text-xs text-muted-foreground pt-2 border-t mt-3">
                        Dados de: <span className="font-medium">{hltbData.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {!isHltbLoading && !hltbData && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground py-4">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error || 'Dados não encontrados.'}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t text-center">
                  Fonte: HowLongToBeat.com
                </p>
              </div>
            </div>

            <div className="md:w-2/3">
              <ModalReview 
                gameId={game.id}
                gameTitle={game.title}
                players={players}
                reviews={allReviews.filter(r => r.gameId === game.id)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameDetailsModal;