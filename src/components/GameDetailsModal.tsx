// Arquivo: src/components/GameDetailsModal.tsx (versão final e correta)

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface GameWithDetails {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  ratings: { playerName: string; rating: number }[];
}

interface GameDetailsModalProps {
  game: GameWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GameDetailsModal = ({ game, isOpen, onClose }: GameDetailsModalProps) => {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // COLOQUE SUA CHAVE DA API DA RAWG AQUI
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;


  // Este useEffect busca a descrição sempre que um novo jogo é selecionado
  useEffect(() => {
    if (game) {
      setIsLoading(true);
      setDescription(""); // Limpa a descrição anterior

      const fetchDescription = async () => {
        try {
          // Busca pelo título para encontrar o ID na API da RAWG
          const searchRes = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(game.title)}&page_size=1`);
          const searchData = await searchRes.json();
          const gameIdFromApi = searchData.results?.[0]?.id;

          if (gameIdFromApi) {
            // Com o ID, busca os detalhes completos, que inclui a descrição em HTML
            const detailsRes = await fetch(`https://api.rawg.io/api/games/${gameIdFromApi}?key=${API_KEY}`);
            const fullDetails = await detailsRes.json();
            setDescription(fullDetails.description || "Nenhuma descrição detalhada encontrada.");
          } else {
            setDescription("Nenhuma descrição detalhada encontrada.");
          }
        } catch (error) {
          console.error("Erro ao buscar descrição:", error);
          setDescription("Falha ao carregar a descrição.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchDescription();
    }
  }, [game]); // A dependência [game] faz com que esta lógica rode toda vez que o modal abre com um novo jogo

  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">{game.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex-shrink-0">
              <img src={game.coverImage} alt={`Capa de ${game.title}`} className="w-full h-auto rounded-lg shadow-lg" />
            </div>
            <div className="md:w-2/3">
              <h3 className="text-lg font-semibold mb-2">Descrição</h3>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando descrição...</span>
                </div>
              ) : (
                <DialogDescription
                  className="prose prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Avaliações da Galera</h3>
            <div className="space-y-2">
              {game.ratings.map(r => (
                <div key={r.playerName} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{r.playerName}</span>
                  <Badge variant={r.rating > 0 ? "default" : "secondary"}>
                    {r.rating > 0 ? `${r.rating}/10` : "Não jogou"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};