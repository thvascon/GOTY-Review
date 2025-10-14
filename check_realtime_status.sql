-- Script para verificar e habilitar Realtime na tabela notifications
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a replica identity está configurada (necessário para Realtime)
SELECT
  schemaname,
  tablename,
  CASE
    WHEN relreplident = 'd' THEN 'DEFAULT (apenas chave primária)'
    WHEN relreplident = 'n' THEN 'NOTHING (sem replica)'
    WHEN relreplident = 'f' THEN 'FULL (todas as colunas)'
    WHEN relreplident = 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'notifications' AND t.schemaname = 'public';

-- 2. Habilitar replica identity FULL (permite Realtime com filtros)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- 3. Verificar novamente
SELECT
  schemaname,
  tablename,
  CASE
    WHEN relreplident = 'd' THEN 'DEFAULT (apenas chave primária)'
    WHEN relreplident = 'n' THEN 'NOTHING (sem replica)'
    WHEN relreplident = 'f' THEN 'FULL (todas as colunas)'
    WHEN relreplident = 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'notifications' AND t.schemaname = 'public';

-- 4. Verificar se a publicação do Realtime inclui a tabela notifications
-- (Supabase cria automaticamente uma publicação chamada 'supabase_realtime')
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'notifications';

-- Se NÃO aparecer nada, você precisa habilitar Realtime no Dashboard do Supabase:
-- 1. Vá em Database > Replication
-- 2. Encontre a tabela 'notifications'
-- 3. Ative o toggle de Realtime

-- OU adicione manualmente a tabela à publicação:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
