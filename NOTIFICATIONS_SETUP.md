# Sistema de Notificações - Instruções de Setup

## O que foi implementado

✅ **Componente de Notificações** - Botão de sino no header com badge de contagem
✅ **Notificações de Likes** - Quando alguém curtir sua review
✅ **Notificações de Comentários** - Quando alguém comentar na sua review
✅ **Notificações de Novos Membros** - Quando alguém entrar no seu grupo
⏳ **Notificações de Level Up** - Preparado mas precisa implementar sistema de XP

## Como executar a migration

### Opção 1: Supabase Dashboard (Mais fácil)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/migrations/20250108_create_notifications.sql`
6. Cole no editor e clique em **Run**

### Opção 2: Supabase CLI

```bash
# Na raiz do projeto
supabase db push
```

## Como testar

1. Execute a migration acima
2. Faça login na aplicação
3. Teste as notificações:
   - **Like**: Vá no perfil de outro usuário e curta uma review dele
   - **Comentário**: Comente em uma review de outro usuário
   - **Novo membro**: Entre em um grupo existente com um novo usuário

4. Clique no ícone de sino 🔔 no header para ver as notificações

## Funcionalidades

- ✅ Badge com contagem de notificações não lidas
- ✅ Notificações em tempo real (Supabase Realtime)
- ✅ Marcar notificação individual como lida ao clicar
- ✅ Botão "Marcar todas como lidas"
- ✅ Scroll infinito para notificações antigas
- ✅ Ícones diferentes por tipo de notificação
- ✅ Timestamp relativo (há 5m, há 2h, etc)

## Próximos passos (Level Up)

Para implementar notificações de level up, você precisa:

1. Ter um sistema de XP que atualiza o campo `xp` na tabela `people`
2. Adicionar a lógica de level up quando o XP atingir certo valor
3. Chamar `notifyLevelUp(userId, newLevel)` quando subir de nível

Exemplo:
```typescript
import { notifyLevelUp } from '@/hooks/use-notifications';

// Quando atualizar XP
const newXP = currentXP + earnedXP;
const oldLevel = calculateLevel(currentXP);
const newLevel = calculateLevel(newXP);

if (newLevel > oldLevel) {
  await notifyLevelUp(userId, newLevel);
}
```

## Estrutura da tabela

```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES people(id),
  type TEXT ('level_up', 'review_like', 'review_comment', 'new_member'),
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

## Arquivos criados/modificados

- ✅ `src/components/NotificationButton.tsx` - Componente principal
- ✅ `src/hooks/use-notifications.ts` - Funções helper
- ✅ `supabase/migrations/20250108_create_notifications.sql` - Migration
- ✅ `src/components/Header.tsx` - Integração do botão
- ✅ `src/components/UserCommentCard.tsx` - Trigger de likes
- ✅ `src/components/ReviewComments.tsx` - Trigger de comentários
- ✅ `src/components/GroupSelector.tsx` - Trigger de novos membros
