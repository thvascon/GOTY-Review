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
