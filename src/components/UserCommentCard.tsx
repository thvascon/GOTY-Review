import { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { PlayerLink } from './PlayerLink';
import { ReviewComments } from './ReviewComments';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserCommentCardProps {
  playerId: string;
  userName: string;
  avatarUrl?: string | null;
  rating: number;
  comment: string | null;
  gameId?: string;
}

export const UserCommentCard = ({
  playerId,
  userName,
  avatarUrl,
  rating,
  comment,
  gameId
}: UserCommentCardProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadLikes();
    }
  }, [gameId, playerId, profile]);

  const loadLikes = async () => {
    if (!gameId) return;

    try {
      // Buscar total de likes
      const { count, error: countError } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId)
        .eq('review_person_id', playerId);

      if (countError) throw countError;
      setLikesCount(count || 0);

      // Verificar se o usuário logado deu like
      if (profile) {
        const { data, error } = await supabase
          .from('review_likes')
          .select('id')
          .eq('game_id', gameId)
          .eq('review_person_id', playerId)
          .eq('person_id', profile.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setIsLiked(!!data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar likes:', error);
    }
  };

  const handleLike = async () => {
    if (!profile || !gameId) {
      toast({
        title: 'Faça login para curtir',
        variant: 'destructive'
      });
      return;
    }

    if (profile.id === playerId) {
      toast({
        title: 'Você não pode curtir sua própria review',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Remover like
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('game_id', gameId)
          .eq('review_person_id', playerId)
          .eq('person_id', profile.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Adicionar like
        const { error } = await supabase
          .from('review_likes')
          .insert({
            game_id: gameId,
            review_person_id: playerId,
            person_id: profile.id
          });

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Erro ao processar like:', error);
      toast({
        title: 'Erro ao processar like',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canLike = profile && profile.id !== playerId;

  return (
    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
      <div className="flex items-start justify-between gap-3">
        <PlayerLink
          playerId={playerId}
          playerName={userName}
          avatarUrl={avatarUrl}
          showAvatar={true}
          className="font-semibold"
        />
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <StarRating
              rating={rating}
              onRatingChange={() => {}}
              disabled
              size={14}
            />
          </div>

          {/* Botão de Like */}
          {gameId && (
            <button
              onClick={handleLike}
              disabled={isLoading || !canLike}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all text-sm",
                isLiked
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                !canLike && "opacity-50 cursor-not-allowed"
              )}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all",
                  isLiked && "fill-current"
                )}
              />
              <span className="font-medium">{likesCount}</span>
            </button>
          )}
        </div>
      </div>

      {comment && (
        <p className="text-sm text-muted-foreground italic">
          "{comment}"
        </p>
      )}

      {/* Sistema de comentários na review */}
      {gameId && (
        <ReviewComments
          gameId={gameId}
          reviewPersonId={playerId}
          reviewPersonName={userName}
        />
      )}
    </div>
  );
};