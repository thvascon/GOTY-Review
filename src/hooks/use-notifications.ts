import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'level_up' | 'review_like' | 'review_comment' | 'new_member';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  data?: any;
}

export async function createNotification({
  userId,
  type,
  message,
  data,
}: CreateNotificationParams) {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        type,
        message,
        data,
      },
    ]);

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

// Notificação de subida de nível
export async function notifyLevelUp(userId: string, newLevel: number) {
  return createNotification({
    userId,
    type: 'level_up',
    message: `🎉 Parabéns! Você subiu para o nível ${newLevel}!`,
    data: { level: newLevel },
  });
}

// Notificação de like em review
export async function notifyReviewLike(
  userId: string,
  likerName: string,
  gameTitle: string
) {
  return createNotification({
    userId,
    type: 'review_like',
    message: `${likerName} curtiu sua avaliação de "${gameTitle}"`,
    data: { likerName, gameTitle },
  });
}

// Notificação de comentário em review
export async function notifyReviewComment(
  userId: string,
  commenterName: string,
  gameTitle: string
) {
  return createNotification({
    userId,
    type: 'review_comment',
    message: `${commenterName} comentou na sua avaliação de "${gameTitle}"`,
    data: { commenterName, gameTitle },
  });
}

// Notificação de novo membro no grupo
export async function notifyNewMember(
  groupId: string,
  newMemberName: string,
  excludeUserId?: string
) {
  try {
    // Buscar todos os membros do grupo
    const { data: members, error } = await supabase
      .from('people')
      .select('id, user_id')
      .eq('group_id', groupId)
      .not('user_id', 'is', null);

    if (error) {
      console.error('Error fetching group members:', error);
      return { success: false, error };
    }

    // Criar notificações para todos os membros (exceto o novo membro)
    const notifications = members
      .filter((member) => member.id !== excludeUserId)
      .map((member) => ({
        user_id: member.id,
        type: 'new_member' as const,
        message: `${newMemberName} entrou no grupo!`,
        data: { newMemberName },
      }));

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error creating notifications:', insertError);
        return { success: false, error: insertError };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error notifying new member:', error);
    return { success: false, error };
  }
}
