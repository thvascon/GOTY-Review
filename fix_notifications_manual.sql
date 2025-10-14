-- ========================================
-- SCRIPT PARA CORRIGIR NOTIFICAÇÕES
-- Execute este script no SQL Editor do Supabase Dashboard
-- ========================================

-- 1. Remover a tabela antiga
DROP TABLE IF EXISTS notifications CASCADE;

-- 2. Criar a tabela com a estrutura correta
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Este é o auth.uid(), NÃO o people.id
  type TEXT NOT NULL CHECK (type IN ('level_up', 'review_like', 'review_comment', 'new_member')),
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- 4. Ativar Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ========================================
-- PRONTO! A tabela está corrigida.
-- Agora as notificações devem funcionar.
-- ========================================
