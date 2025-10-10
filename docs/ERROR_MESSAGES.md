# Sistema de Mensagens de Erro Amigáveis

Este documento explica como funciona o sistema de tradução de erros técnicos para mensagens amigáveis ao usuário.

## Como Funciona

O utilitário `errorMessages.ts` intercepta erros do banco de dados (PostgreSQL/Supabase) e os traduz automaticamente para mensagens compreensíveis.

## Uso

```typescript
import { getErrorMessage } from "@/utils/errorMessages";

// Em vez de usar error.message diretamente
toast({
  title: "Erro ao adicionar jogo",
  description: error.message, // ❌ Mostra erro técnico
  variant: "destructive",
});

// Use o tradutor
toast({
  title: "Erro ao adicionar jogo",
  description: getErrorMessage(error), // ✅ Mostra mensagem amigável
  variant: "destructive",
});
```

## Exemplos de Traduções

### Erros de Duplicação (23505)

**Antes:**
```
duplicate key value violates unique constraint "games_name_group_id_key"
```

**Depois:**
```
Este jogo já foi adicionado ao grupo.
```

### Erros de Relacionamento (23503)

**Antes:**
```
insert or update on table "reviews" violates foreign key constraint "reviews_game_id_fkey"
```

**Depois:**
```
O jogo não foi encontrado.
```

### Erros de Autenticação

**Antes:**
```
Invalid login credentials
```

**Depois:**
```
Email ou senha incorretos.
```

### Erros de Campos Obrigatórios (23502)

**Antes:**
```
null value in column "name" violates not-null constraint
```

**Depois:**
```
O nome é obrigatório.
```

## Constraints Suportados

O sistema detecta automaticamente as seguintes constraints:

- `games_name_group_id_key` → "Este jogo já foi adicionado ao grupo."
- `people_email_group_id_key` → "Esta pessoa já está no grupo."
- `reviews_game_id_person_id_key` → "Você já avaliou este jogo."
- `review_likes_review_id_person_id_key` → "Você já curtiu esta avaliação."

## Códigos de Erro PostgreSQL

| Código | Tipo | Mensagem Padrão |
|--------|------|-----------------|
| 23505 | Unique Violation | Registro duplicado |
| 23503 | Foreign Key Violation | Relacionamento inválido |
| 23502 | Not Null Violation | Campo obrigatório |
| 23514 | Check Constraint | Dados não atendem requisitos |
| 42501 | Insufficient Privilege | Sem permissão |

## Adicionando Novas Traduções

Para adicionar uma nova tradução, edite o arquivo `src/utils/errorMessages.ts`:

```typescript
// Adicione no local apropriado
if (errorMessage.includes('sua_constraint_aqui')) {
  return 'Mensagem amigável para o usuário';
}
```

## Debug

Todos os erros não traduzidos são automaticamente registrados no console para facilitar o debug:

```javascript
console.error('Erro não traduzido:', {
  message: errorMessage,
  code: errorCode,
  details: errorDetails
});
```

Isso permite que você identifique novos tipos de erros que podem precisar de tradução.

## Componentes Atualizados

Os seguintes componentes já estão usando o sistema de mensagens traduzidas:

- ✅ [app/page.tsx](../app/page.tsx)
- ✅ [app/profile/page.tsx](../app/profile/page.tsx)
- ✅ [src/components/AddGameDialog.tsx](../src/components/AddGameDialog.tsx)
- ✅ [src/components/Login.tsx](../src/components/Login.tsx)
- ✅ [src/components/ReviewComments.tsx](../src/components/ReviewComments.tsx)
- ✅ [src/components/ModalReview.tsx](../src/components/ModalReview.tsx)
- ✅ [src/components/UserCommentCard.tsx](../src/components/UserCommentCard.tsx)
- ✅ [src/pages-old/Index.tsx](../src/pages-old/Index.tsx)
- ✅ [src/pages-old/Profile.tsx](../src/pages-old/Profile.tsx)

## Boas Práticas

1. **Sempre use `getErrorMessage(error)`** em vez de `error.message`
2. **Mantenha as mensagens curtas e objetivas** (máximo 2 linhas)
3. **Seja específico** quando possível (ex: "Este jogo já foi adicionado" em vez de "Registro duplicado")
4. **Não exponha detalhes técnicos** ao usuário final
5. **Sugira ações** quando apropriado (ex: "Verifique sua internet e tente novamente")
