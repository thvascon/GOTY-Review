-- Sistema de likes em reviews
-- Permite que usuários curtam avaliações de outros jogadores

CREATE TABLE IF NOT EXISTS review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  review_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para garantir que review existe
  CONSTRAINT review_ref FOREIGN KEY (game_id, review_person_id)
    REFERENCES reviews(game_id, person_id) ON DELETE CASCADE,

  -- Um usuário só pode dar like uma vez por review
  CONSTRAINT unique_like UNIQUE (person_id, game_id, review_person_id),

  -- Usuário não pode dar like na própria review
  CONSTRAINT no_self_like CHECK (person_id != review_person_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_review_likes_review
  ON review_likes(game_id, review_person_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_person
  ON review_likes(person_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_created_at
  ON review_likes(created_at DESC);

-- Comentários explicativos
COMMENT ON TABLE review_likes IS 'Likes em reviews de jogos';
COMMENT ON COLUMN review_likes.person_id IS 'Pessoa que deu o like';
COMMENT ON COLUMN review_likes.game_id IS 'Jogo da review curtida';
COMMENT ON COLUMN review_likes.review_person_id IS 'Pessoa que fez a review curtida';
