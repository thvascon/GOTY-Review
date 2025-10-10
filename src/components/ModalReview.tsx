import { useState, useEffect, useMemo } from 'react';
import { UserCommentCard } from './UserCommentCard';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { GameStatusSelector, type GameStatus } from './GameStatusSelector';
import { Zap } from 'lucide-react';
import { getErrorMessage } from '@/utils/errorMessages';

interface ReviewData {
  gameId: string;
  playerId: string;
  rating: number;
  comment: string | null;
  status?: GameStatus;
}

interface Player {
  id: string;
  name: string;
  avatar_url?: string | null;
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
  const [userStatus, setUserStatus] = useState<GameStatus>(null);

  // Carregar dados da review existente do usuário
  useEffect(() => {
    if (profile) {
      const userReview = reviews.find(r => r.playerId === profile.id);
      if (userReview) {
        setUserRating(userReview.rating || 0);
        setUserStatus((userReview.status as GameStatus) || null);
      } else {
        setUserRating(0);
        setUserStatus(null);
      }
    }
  }, [profile, reviews, gameId]);

  const reviewsWithUserInfo = useMemo(() => {
    return reviews
      .map(review => {
        const player = players.find(p => p.id === review.playerId);
        return {
          ...review,
          userName: player ? player.name : 'Usuário desconhecido',
          avatarUrl: player?.avatar_url || null,
        };
      })
      .filter(review => review.rating > 0);
  }, [reviews, players]);

  const handleSubmit = async () => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para avaliar.",
        variant: "destructive"
      });
      return;
    }

    const {data: oldReview } = await supabase
      .from('reviews')
      .select('rating')
      .eq('person_id', profile.id)
      .eq('game_id', gameId)
      .single();

    // Calcular XP que será ganho
    let xpGained = 0;
    if (userRating > 0) xpGained += 50;
    if (userComment && userComment.trim().length > 0) xpGained += 25;
    if (userStatus) xpGained += 10;

    const { error } = await supabase.from('reviews').upsert({
      game_id: gameId,
      person_id: profile.id,
      rating: userRating,
      comment: userComment,
      status: userStatus,
    } as any, {
      onConflict: ['person_id', 'game_id'] as any,
    });

    if (error) {
      toast({
        title: "Erro ao salvar avaliação",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } else {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <span>Avaliação salva com sucesso!</span>
            {xpGained > 0 && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm font-semibold">
                <Zap className="w-3 h-3 fill-current" />
                <span>+{xpGained} XP</span>
              </div>
            )}
          </div>
        ) as any,
        duration: 3000
      });
      // Não resetar os campos, manter preenchidos
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {session && profile ? (
        <div className="p-4 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">
            Sua Avaliação ({profile.name})
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Status do Jogo
              </label>
              <GameStatusSelector
                currentStatus={userStatus}
                onStatusChange={setUserStatus}
                size="md"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Sua Nota
              </label>
              <StarRating rating={userRating} onRatingChange={setUserRating} />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Comentário (opcional)
              </label>
              <textarea
                placeholder="Compartilhe sua experiência..."
                className="w-full p-2 bg-background rounded border resize-none h-24"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={userRating === 0}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted rounded font-medium transition-colors"
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

      <div>
        <h2 className="text-lg font-semibold mb-3">
          Comentários da Galera ({reviewsWithUserInfo.length})
        </h2>
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
          {reviewsWithUserInfo.map((review) => (
            <UserCommentCard
              key={review.playerId}
              playerId={review.playerId}
              userName={review.userName}
              avatarUrl={review.avatarUrl}
              rating={review.rating}
              comment={review.comment}
              gameId={gameId}
            />
          ))}
          {reviewsWithUserInfo.length === 0 && (
            <p className="text-muted-foreground italic">
              Seja o primeiro a comentar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};