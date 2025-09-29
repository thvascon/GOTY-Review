import { useState, useEffect, useMemo } from 'react';
import { UserCommentCard } from './UserCommentCard';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface ReviewData {
  gameId: string;
  playerId: string;
  rating: number;
  comment: string | null;
}

interface Player {
  id: string;
  name: string;
}

interface ModalReviewProps {
  gameId: string;
  gameTitle: string;
  players: Player[];
  reviews: ReviewData[];
}

export const ModalReview = ({ gameId, gameTitle, players, reviews }: ModalReviewProps) => {
  const { toast } = useToast();
  const { session, profile } = useAuth();

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');

  const reviewsWithUserNames = useMemo(() => {
    return reviews
      .map(review => {
        const player = players.find(p => p.id === review.playerId);
        return {
          ...review,
          userName: player ? player.name : 'Usuário desconhecido',
        };
      })
      .filter(review => review.rating > 0);
  }, [reviews, players]);

  useEffect(() => {
    if (profile) {
      const existingReview = reviews.find(r => r.playerId === profile.id);
      setUserRating(existingReview?.rating || 0);
      setUserComment(existingReview?.comment || '');
    }
  }, [profile, reviews]);

  const handleSubmit = async () => {
    if (!profile) {
      toast({ 
        title: "Erro", 
        description: "Você precisa estar logado para avaliar.",
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from('reviews').upsert({
      game_id: gameId,
      person_id: profile.id,
      rating: userRating,
      comment: userComment,
    } as any, {
      onConflict: ['person_id', 'game_id'] as any,
    });

    if (error) {
      toast({ 
        title: "Erro ao salvar avaliação", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Avaliação salva com sucesso!", 
        duration: 2000 
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SEÇÃO 1: SUA AVALIAÇÃO */}
      {session && profile ? (
        <div className="p-4 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">
            Sua Avaliação ({profile.name})
          </h2>
          
          <div className="space-y-4">
            <StarRating rating={userRating} onRatingChange={setUserRating} />
            <textarea
              placeholder="Compartilhe sua experiência..."
              className="w-full mt-2 p-2 bg-background rounded border resize-none h-24"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={userRating === 0}
              className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted rounded font-medium transition-colors"
            >
              Publicar Review
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">Avaliação</h2>
          <p className="text-muted-foreground">
            Faça login para avaliar este jogo e deixar um comentário.
          </p>
        </div>
      )}

      {/* SEÇÃO 2: COMENTÁRIOS DA GALERA */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Comentários da Galera ({reviewsWithUserNames.length})
        </h2>
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
          {reviewsWithUserNames.map((review) => (
            <UserCommentCard
              key={review.playerId}
              userName={review.userName}
              rating={review.rating}
              comment={review.comment}
            />
          ))}
          {reviewsWithUserNames.length === 0 && (
            <p className="text-muted-foreground italic">
              Seja o primeiro a comentar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};