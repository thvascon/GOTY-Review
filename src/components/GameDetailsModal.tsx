import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModalReview } from './ModalReview';


export const GameDetailsModal = ({ game, isOpen, onClose, players, allReviews }) => {
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
              <img 
                src={game.coverImage} 
                alt={`Capa de ${game.title}`} 
                className="w-full h-auto rounded-lg shadow-lg" 
              />
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