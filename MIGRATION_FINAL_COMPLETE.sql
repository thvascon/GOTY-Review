-- ============================================
-- MIGRATION FINAL COMPLETA
-- Execute este arquivo no SQL Editor do Supabase
-- Inclui: Sistema XP, Comentários e Likes
-- ============================================

-- ============================================
-- PARTE 1: SISTEMA DE XP E NÍVEIS
-- ============================================

-- Adicionar campos de XP na tabela people
ALTER TABLE people
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

COMMENT ON COLUMN people.xp IS 'Experiência acumulada do jogador';
COMMENT ON COLUMN people.level IS 'Nível calculado baseado no XP';

-- Tabela para histórico de XP
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_xp_history_person ON xp_history(person_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at DESC);

-- Função para calcular XP de uma review
CREATE OR REPLACE FUNCTION calculate_review_xp(
  p_rating NUMERIC,
  p_comment TEXT,
  p_status TEXT
) RETURNS INTEGER AS $$
DECLARE
  xp_amount INTEGER := 0;
BEGIN
  IF p_rating > 0 THEN xp_amount := 50; END IF;
  IF p_comment IS NOT NULL AND LENGTH(TRIM(p_comment)) > 0 THEN xp_amount := xp_amount + 25; END IF;
  IF p_status IS NOT NULL THEN xp_amount := xp_amount + 10; END IF;
  RETURN xp_amount;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular nível baseado em XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER) RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  xp_needed INTEGER := 0;
BEGIN
  WHILE xp >= xp_needed LOOP
    xp_needed := xp_needed + (level * 100);
    IF xp >= xp_needed THEN level := level + 1; END IF;
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
  IF TG_OP = 'UPDATE' THEN
    old_xp := calculate_review_xp(OLD.rating, OLD.comment, OLD.status);
  END IF;

  new_xp := calculate_review_xp(NEW.rating, NEW.comment, NEW.status);
  xp_diff := new_xp - old_xp;

  UPDATE people SET xp = GREATEST(0, xp + xp_diff) WHERE id = NEW.person_id;

  SELECT xp INTO new_xp FROM people WHERE id = NEW.person_id;
  new_level := calculate_level(new_xp);

  UPDATE people SET level = new_level WHERE id = NEW.person_id;

  IF xp_diff > 0 THEN
    INSERT INTO xp_history (person_id, amount, reason, game_id)
    VALUES (
      NEW.person_id,
      xp_diff,
      CASE WHEN TG_OP = 'INSERT' THEN 'Review criada' ELSE 'Review atualizada' END,
      NEW.game_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    xp_amount := calculate_review_xp(review_record.rating, review_record.comment, review_record.status);
    UPDATE people SET xp = xp + xp_amount WHERE id = review_record.person_id;
  END LOOP;
  UPDATE people SET level = calculate_level(xp);
END $$;

-- ============================================
-- PARTE 2: SISTEMA DE COMENTÁRIOS EM REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS review_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  review_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  CONSTRAINT review_ref FOREIGN KEY (game_id, review_person_id)
    REFERENCES reviews(game_id, person_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_comments_game_review ON review_comments(game_id, review_person_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_person ON review_comments(person_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at DESC);

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

COMMENT ON TABLE review_comments IS 'Comentários em reviews de jogos';

-- ============================================
-- PARTE 3: SISTEMA DE LIKES EM REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  review_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT review_ref_likes FOREIGN KEY (game_id, review_person_id)
    REFERENCES reviews(game_id, person_id) ON DELETE CASCADE,
  CONSTRAINT unique_like UNIQUE (person_id, game_id, review_person_id),
  CONSTRAINT no_self_like CHECK (person_id != review_person_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(game_id, review_person_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_person ON review_likes(person_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_created_at ON review_likes(created_at DESC);

COMMENT ON TABLE review_likes IS 'Likes em reviews de jogos';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
