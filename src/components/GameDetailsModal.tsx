// Arquivo: src/components/GameDetailsModal.tsx (Versão Final com RAWG)

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ModalReview } from './ModalReview';
import { Clock, Loader2 } from 'lucide-react'; // Ícones

// ... suas outras interfaces ...

export const GameDetailsModal = ({ game, isOpen, onClose, players, allReviews }) => {
  // Estados para os dados que vêm da API da RAWG
  const [description, setDescription] = useState("");
  const [playtime, setPlaytime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lembre-se de colocar a chave no seu .env.local e acessá-la aqui
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  useEffect(() => {
    // Busca os detalhes do jogo na RAWG quando o modal abre
    if (isOpen && game) {
      const fetchGameDetails = async () => {
        setIsLoading(true);
        setDescription("");
        setPlaytime(null);

        try {
          // A API da RAWG é ótima para buscar por IDs, então primeiro encontramos o ID pelo título
          const searchRes = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(game.title)}&page_size=1`);
          const searchData = await searchRes.json();
          const gameIdFromApi = searchData.results?.[0]?.id;

          if (gameIdFromApi) {
            // Com o ID, buscamos os detalhes completos
            const detailsRes = await fetch(`https://api.rawg.io/api/games/${gameIdFromApi}?key=${API_KEY}`);
            const fullDetails = await detailsRes.json();
            
            setDescription(fullDetails.description_raw || "Descrição não encontrada.");
            setPlaytime(fullDetails.playtime || 0);
          } else {
            setDescription("Descrição não encontrada.");
            setPlaytime(0);
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do jogo na RAWG:", error);
          setDescription("Falha ao carregar a descrição.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchGameDetails();
    }
  }, [isOpen, game]); // Roda sempre que o modal abre com um novo jogo

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

              {/* SEÇÃO DO TEMPO DE JOGO (vindo da RAWG) */}
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-semibold mb-2 text-lg">Tempo de Jogo</h3>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Clock size={14} /> História Principal</span>
                    <span className="font-bold">{playtime > 0 ? `${playtime} Horas` : 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-2/3">
              {/* O seu componente de review continua funcionando perfeitamente aqui */}
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