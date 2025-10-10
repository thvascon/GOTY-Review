/**
 * Traduz erros técnicos do banco de dados para mensagens amigáveis
 */

interface PostgresError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function translateDatabaseError(error: any): string {
  // Se já for uma string, tenta processar
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const errorCode = error?.code;
  const errorDetails = error?.details;

  // Erros de constraint (duplicação)
  if (errorMessage.includes('duplicate key value violates unique constraint') || errorCode === '23505') {
    // Detectar qual constraint foi violada
    if (errorMessage.includes('games_name_group_id_key')) {
      return 'Este jogo já foi adicionado ao grupo.';
    }
    if (errorMessage.includes('people_email_group_id_key')) {
      return 'Esta pessoa já está no grupo.';
    }
    if (errorMessage.includes('people_user_id_group_id_key')) {
      return 'Você já está participando deste grupo.';
    }
    if (errorMessage.includes('group_invites_code_key')) {
      return 'Este código de convite já está em uso.';
    }
    if (errorMessage.includes('reviews_game_id_person_id_key')) {
      return 'Você já avaliou este jogo.';
    }
    if (errorMessage.includes('review_likes_review_id_person_id_key')) {
      return 'Você já curtiu esta avaliação.';
    }
    return 'Este registro já existe. Tente novamente com informações diferentes.';
  }

  // Erros de foreign key (relacionamento inválido)
  if (errorMessage.includes('violates foreign key constraint') || errorCode === '23503') {
    if (errorMessage.includes('games_section_id_fkey')) {
      return 'A seção selecionada não existe.';
    }
    if (errorMessage.includes('reviews_game_id_fkey')) {
      return 'O jogo não foi encontrado.';
    }
    if (errorMessage.includes('reviews_person_id_fkey')) {
      return 'Usuário não encontrado.';
    }
    return 'Erro de relacionamento: registro associado não encontrado.';
  }

  // Erros de not null (campo obrigatório)
  if (errorMessage.includes('null value in column') || errorCode === '23502') {
    if (errorDetails?.includes('name')) {
      return 'O nome é obrigatório.';
    }
    if (errorDetails?.includes('title')) {
      return 'O título é obrigatório.';
    }
    if (errorDetails?.includes('email')) {
      return 'O email é obrigatório.';
    }
    return 'Preencha todos os campos obrigatórios.';
  }

  // Erros de check constraint
  if (errorMessage.includes('violates check constraint') || errorCode === '23514') {
    if (errorMessage.includes('rating')) {
      return 'A nota deve estar entre 0 e 10.';
    }
    return 'Os dados fornecidos não atendem aos requisitos.';
  }

  // Erros de permissão/autenticação
  if (errorMessage.includes('permission denied') || errorCode === '42501') {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (errorMessage.includes('JWT expired') || errorMessage.includes('token expired')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }

  if (errorMessage.includes('Invalid API key') || errorMessage.includes('API key')) {
    return 'Erro de autenticação. Verifique suas credenciais.';
  }

  // Erros de conexão/rede
  if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'A operação demorou muito. Tente novamente.';
  }

  // Erros de formato
  if (errorMessage.includes('invalid input syntax') || errorCode === '22P02') {
    return 'Formato de dados inválido.';
  }

  if (errorMessage.includes('value too long') || errorCode === '22001') {
    return 'O texto é muito longo. Reduza o tamanho.';
  }

  // Erros específicos de email
  if (errorMessage.includes('Invalid email')) {
    return 'O email fornecido é inválido.';
  }

  if (errorMessage.includes('Email not confirmed')) {
    return 'Confirme seu email antes de continuar.';
  }

  // Erros de senha
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos.';
  }

  if (errorMessage.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }

  // Erros de arquivo/upload
  if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
    return 'O arquivo é muito grande. Use um arquivo menor.';
  }

  if (errorMessage.includes('file type') || errorMessage.includes('invalid type')) {
    return 'Tipo de arquivo não permitido.';
  }

  // Erros genéricos do Supabase
  if (errorMessage.includes('Failed to fetch')) {
    return 'Não foi possível conectar ao servidor. Tente novamente.';
  }

  // Se não conseguiu traduzir, retorna uma mensagem genérica
  // (mas registra o erro original no console para debug)
  if (errorMessage) {
    console.error('Erro não traduzido:', { message: errorMessage, code: errorCode, details: errorDetails });
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  return 'Ocorreu um erro. Tente novamente.';
}

/**
 * Wrapper para usar com toast - retorna uma mensagem traduzida
 */
export function getErrorMessage(error: any): string {
  return translateDatabaseError(error);
}
