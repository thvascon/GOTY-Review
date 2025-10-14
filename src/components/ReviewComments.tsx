"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notifyReviewComment } from '@/hooks/use-notifications';
import { getErrorMessage } from '@/utils/errorMessages';

interface ReviewComment {
  id: string;
  comment: string;
  created_at: string;
  person_id: string;
  personName?: string;
  personAvatar?: string | null;
}

interface ReviewCommentsProps {
  gameId: string;
  reviewPersonId: string;
  reviewPersonName: string;
}

export function ReviewComments({
  gameId,
  reviewPersonId,
  reviewPersonName
}: ReviewCommentsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [gameId, reviewPersonId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('review_comments')
        .select(`
          id,
          comment,
          created_at,
          person_id,
          people:person_id (
            name,
            avatar_url
          )
        `)
        .eq('game_id', gameId)
        .eq('review_person_id', reviewPersonId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedComments = (data || []).map((c: any) => ({
        id: c.id,
        comment: c.comment,
        created_at: c.created_at,
        person_id: c.person_id,
        personName: c.people?.name || 'Usuário',
        personAvatar: c.people?.avatar_url
      }));

      setComments(mappedComments);
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('review_comments')
        .insert({
          game_id: gameId,
          review_person_id: reviewPersonId,
          person_id: profile.id,
          comment: newComment.trim(),
          review_id: crypto.randomUUID() // ID único para o comentário
        });

      if (error) throw error;

      // Buscar título do jogo e enviar notificação
      const { data: gameData } = await supabase
        .from('games')
        .select('name')
        .eq('id', gameId)
        .single();

      if (gameData && reviewPersonId !== profile.id) {
        await notifyReviewComment(reviewPersonId, profile.name, gameData.name, gameId);
      }

      toast({
        title: 'Comentário enviado!',
        duration: 2000
      });

      setNewComment('');
      await loadComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar comentário',
        description: getErrorMessage(error),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Deseja realmente excluir este comentário?')) return;

    try {
      const { error } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comentário excluído',
        duration: 2000
      });

      await loadComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir comentário',
        description: getErrorMessage(error),
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Carregando comentários...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>
          {comments.length === 0
            ? 'Seja o primeiro a comentar'
            : `${comments.length} ${comments.length === 1 ? 'comentário' : 'comentários'}`}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2 border-l-2 border-muted">
          {/* Lista de comentários */}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={comment.personAvatar || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.personName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.personName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      locale: ptBR,
                      addSuffix: true
                    })}
                  </span>
                  {profile?.id === comment.person_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-sm mt-1">{comment.comment}</p>
              </div>
            </div>
          ))}

          {/* Formulário de novo comentário */}
          {profile && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {profile.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Comentar na review de ${reviewPersonName}...`}
                  className="min-h-[60px] text-sm resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
