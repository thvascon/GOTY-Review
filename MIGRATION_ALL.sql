-- ============================================
-- MIGRATION COMPLETA - Sistema XP + Comentários
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- PARTE 1: SISTEMA DE XP E NÍVEIS
-- ============================================

-- Adicionar campos de XP na tabela people
ALTER TABLE people
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Comentários explicativos
COMMENT ON COLUMN people.xp IS 'Experiência acumulada do jogador';
COMMENT ON COLUMN people.level IS 'Nível calculado baseado no XP';

-- Sistema de recompensas:
-- - Criar review com nota: 50 XP
-- - Adicionar comentário: +25 XP extra
-- - Definir status do jogo: +10 XP extra
-- Total máximo por review: 85 XP

-- Tabela para histórico de XP (opcional, para tracking)
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_xp_history_person ON xp_history(person_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at DESC);

-- Função para calcular XP de uma review
CREATE OR REPLACE FUNCTION calculate_review_xp(
  p_rating INTEGER,
  p_comment TEXT,
  p_status TEXT
) RETURNS INTEGER AS $$
DECLARE
  xp_amount INTEGER := 0;
BEGIN
  -- XP base por criar/atualizar review
  IF p_rating > 0 THEN
    xp_amount := 50;
  END IF;

  -- XP extra por comentário
  IF p_comment IS NOT NULL AND LENGTH(TRIM(p_comment)) > 0 THEN
    xp_amount := xp_amount + 25;
  END IF;

  -- XP extra por definir status
  IF p_status IS NOT NULL THEN
    xp_amount := xp_amount + 10;
  END IF;

  RETURN xp_amount;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular nível baseado em XP
-- Sistema: Nível 1 = 0 XP, cada nível requer 100 XP a mais que o anterior
-- Nível 2 = 100 XP, Nível 3 = 300 XP, Nível 4 = 600 XP, etc.
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER) RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  xp_needed INTEGER := 0;
BEGIN
  WHILE xp >= xp_needed LOOP
    xp_needed := xp_needed + (level * 100);
    IF xp >= xp_needed THEN
      level := level + 1;
    END IF;
  END LOOP;

  RETURN level;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar XP quando uma review é criada/atualizada
CREATE OR REPLACE FUNCTION update_player_xp_on_review()
RETURNS TRIGGER AS $$
DECLARE
  old_xp INTEGER := 0;
  new_xp INTEGER := 0;
  xp_diff INTEGER := 0;
  new_level INTEGER := 1;
BEGIN
  -- Calcular XP da review antiga (se existir)
  IF TG_OP = 'UPDATE' THEN
    old_xp := calculate_review_xp(OLD.rating, OLD.comment, OLD.status);
  END IF;

  -- Calcular XP da review nova
  new_xp := calculate_review_xp(NEW.rating, NEW.comment, NEW.status);

  -- Diferença de XP
  xp_diff := new_xp - old_xp;

  -- Atualizar XP do jogador
  UPDATE people
  SET xp = GREATEST(0, xp + xp_diff)
  WHERE id = NEW.person_id;

  -- Recalcular nível
  SELECT xp INTO new_xp FROM people WHERE id = NEW.person_id;
  new_level := calculate_level(new_xp);

  UPDATE people
  SET level = new_level
  WHERE id = NEW.person_id;

  -- Registrar no histórico (apenas se ganhou XP)
  IF xp_diff > 0 THEN
    INSERT INTO xp_history (person_id, amount, reason, game_id)
    VALUES (
      NEW.person_id,
      xp_diff,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Review criada'
        ELSE 'Review atualizada'
      END,
      NEW.game_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_xp ON reviews;
CREATE TRIGGER trigger_update_xp
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_player_xp_on_review();

-- Popular XP inicial para reviews existentes
DO $$
DECLARE
  review_record RECORD;
  xp_amount INTEGER;
BEGIN
  FOR review_record IN SELECT * FROM reviews WHERE rating > 0 LOOP
    xp_amount := calculate_review_xp(
      review_record.rating,
      review_record.comment,
      review_record.status
    );

    UPDATE people
    SET xp = xp + xp_amount
    WHERE id = review_record.person_id;
  END LOOP;

  -- Recalcular níveis de todos
  UPDATE people
  SET level = calculate_level(xp);
END $$;

-- ============================================
-- PARTE 2: SISTEMA DE COMENTÁRIOS EM REVIEWS
-- ============================================

-- Sistema de comentários em reviews
-- Permite que usuários comentem nas avaliações de outros jogadores

CREATE TABLE IF NOT EXISTS review_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para garantir que review existe (game_id + person_id da review)
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  review_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

  -- Índice composto para buscar review
  CONSTRAINT review_ref FOREIGN KEY (game_id, review_person_id)
    REFERENCES reviews(game_id, person_id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_review_comments_game_review
  ON review_comments(game_id, review_person_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_person
  ON review_comments(person_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at
  ON review_comments(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_review_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_comment_updated_at ON review_comments;
CREATE TRIGGER trigger_update_review_comment_updated_at
BEFORE UPDATE ON review_comments
FOR EACH ROW
EXECUTE FUNCTION update_review_comment_updated_at();

-- Comentários explicativos
COMMENT ON TABLE review_comments IS 'Comentários em reviews de jogos';
COMMENT ON COLUMN review_comments.review_id IS 'ID único do comentário (não relacionado diretamente)';
COMMENT ON COLUMN review_comments.game_id IS 'Jogo da review comentada';
COMMENT ON COLUMN review_comments.review_person_id IS 'Pessoa que fez a review comentada';
COMMENT ON COLUMN review_comments.person_id IS 'Pessoa que fez o comentário';
COMMENT ON COLUMN review_comments.comment IS 'Texto do comentário';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
