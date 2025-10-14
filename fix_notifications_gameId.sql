-- Script para adicionar gameId nas notificações antigas
-- Execute este script no SQL Editor do Supabase Dashboard

-- Passo 1: Ver as notificações que precisam ser corrigidas
SELECT
  n.id,
  n.type,
  n.message,
  n.data,
  n.created_at
FROM notifications n
WHERE n.type IN ('review_like', 'review_comment')
  AND (n.data IS NULL OR n.data->>'gameId' IS NULL)
ORDER BY n.created_at DESC;

-- Passo 2: Tentar adicionar gameId baseado no nome do jogo na mensagem
-- CUIDADO: Isso pode não funcionar 100% se houver jogos com nomes muito similares

-- Para notificações de like
UPDATE notifications n
SET data = jsonb_set(
  COALESCE(n.data, '{}'::jsonb),
  '{gameId}',
  to_jsonb(g.id)
)
FROM games g
WHERE n.type = 'review_like'
  AND (n.data IS NULL OR n.data->>'gameId' IS NULL)
  AND n.message LIKE '%"' || g.name || '"%';

-- Para notificações de comentário
UPDATE notifications n
SET data = jsonb_set(
  COALESCE(n.data, '{}'::jsonb),
  '{gameId}',
  to_jsonb(g.id)
)
FROM games g
WHERE n.type = 'review_comment'
  AND (n.data IS NULL OR n.data->>'gameId' IS NULL)
  AND n.message LIKE '%"' || g.name || '"%';

-- Passo 3: Verificar o resultado
SELECT
  n.id,
  n.type,
  n.message,
  n.data,
  g.name as game_name
FROM notifications n
LEFT JOIN games g ON (n.data->>'gameId')::uuid = g.id
WHERE n.type IN ('review_like', 'review_comment')
ORDER BY n.created_at DESC
LIMIT 20;

-- Se houver notificações que não puderam ser corrigidas, você pode deletá-las:
-- DELETE FROM notifications
-- WHERE type IN ('review_like', 'review_comment')
--   AND (data IS NULL OR data->>'gameId' IS NULL);
