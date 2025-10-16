# Configuração de Suporte a Múltiplos Grupos

Esta documentação explica como aplicar a funcionalidade de múltiplos grupos no CoDEX.

## O que foi implementado?

### Funcionalidades
1. **Múltiplos Grupos por Usuário**: Agora você pode estar em vários grupos simultaneamente
2. **Grupo Ativo**: Um grupo é marcado como ativo por vez (contexto atual)
3. **Seletor de Grupos**: Dropdown no header para trocar entre grupos
4. **Visualização Unificada**: Veja jogos de todos os seus grupos com indicação "(Nome do Grupo)" em cada seção
5. **Adicionar Novos Grupos**: Entre ou crie novos grupos sem sair dos existentes

### Arquivos Criados/Modificados

#### Novos Arquivos:
- `supabase/migrations/20250116_multi_group_support.sql` - Migration SQL
- `src/components/GroupSwitcher.tsx` - Componente para trocar de grupo
- `MULTI_GROUP_SETUP.md` - Este arquivo

#### Arquivos Modificados:
- `src/components/GameDataProvider.tsx` - Busca dados de todos os grupos
- `src/components/Header.tsx` - Adiciona GroupSwitcher
- `src/components/AuthProvider.tsx` - Adiciona active_group_id
- `app/HomeContent.tsx` - Mostra "Seção (Grupo)" no accordion

## Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/migrations/20250116_multi_group_support.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Aguarde a confirmação de sucesso

### Opção 2: Via Supabase CLI

```bash
# No diretório do projeto
npx supabase db push
```

**Nota**: Se você ainda não configurou o Supabase CLI:

```bash
# Link o projeto (você precisará do project ref)
npx supabase link --project-ref seu-project-ref

# Depois aplique as migrations
npx supabase db push
```

### Opção 3: Executar SQL Manualmente

Se preferir executar parte por parte, aqui está a sequência:

1. **Criar tabela user_groups**:
```sql
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  UNIQUE(user_id, group_id)
);
```

2. **Criar índices**:
```sql
CREATE INDEX IF NOT EXISTS user_groups_user_id_idx ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS user_groups_group_id_idx ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS user_groups_active_idx ON user_groups(user_id, is_active);
```

3. **Habilitar RLS**:
```sql
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
```

4. **Criar policies**:
```sql
CREATE POLICY "Users can view their own group memberships"
  ON user_groups FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own group memberships"
  ON user_groups FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own group memberships"
  ON user_groups FOR UPDATE
  USING (user_id = auth.uid());
```

5. **Migrar dados existentes**:
```sql
INSERT INTO user_groups (user_id, group_id, is_active)
SELECT p.user_id, p.group_id, true
FROM people p
WHERE p.group_id IS NOT NULL AND p.user_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;
```

6. **Adicionar coluna active_group_id**:
```sql
ALTER TABLE people ADD COLUMN IF NOT EXISTS active_group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
UPDATE people SET active_group_id = group_id WHERE group_id IS NOT NULL;
```

7. **Criar função switch_active_group**:
```sql
CREATE OR REPLACE FUNCTION switch_active_group(p_group_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_groups
    WHERE user_id = auth.uid() AND group_id = p_group_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;

  UPDATE user_groups SET is_active = false WHERE user_id = auth.uid();
  UPDATE user_groups SET is_active = true WHERE user_id = auth.uid() AND group_id = p_group_id;
  UPDATE people SET active_group_id = p_group_id WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

8. **Criar função get_user_groups**:
```sql
CREATE OR REPLACE FUNCTION get_user_groups()
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  invite_code TEXT,
  is_active BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id as group_id,
    g.name as group_name,
    g.invite_code,
    ug.is_active,
    ug.joined_at,
    (SELECT COUNT(*) FROM user_groups WHERE group_id = g.id) as member_count
  FROM user_groups ug
  JOIN groups g ON ug.group_id = g.id
  WHERE ug.user_id = auth.uid()
  ORDER BY ug.is_active DESC, ug.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

9. **Atualizar função join_group_by_code** (se existir):
```sql
CREATE OR REPLACE FUNCTION join_group_by_code(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_user_id UUID;
  v_has_active_group BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  SELECT id INTO v_group_id FROM groups WHERE invite_code = UPPER(p_invite_code);

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (SELECT 1 FROM user_groups WHERE user_id = v_user_id AND group_id = v_group_id) THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_groups WHERE user_id = v_user_id AND is_active = true
  ) INTO v_has_active_group;

  INSERT INTO user_groups (user_id, group_id, is_active)
  VALUES (v_user_id, v_group_id, NOT v_has_active_group);

  IF NOT v_has_active_group THEN
    UPDATE people SET active_group_id = v_group_id WHERE user_id = v_user_id;
    UPDATE people SET group_id = v_group_id WHERE user_id = v_user_id;
  END IF;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verificação Pós-Migration

Execute estas queries para verificar se tudo funcionou:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM user_groups LIMIT 1;

-- Verificar se a coluna foi adicionada
SELECT id, name, group_id, active_group_id FROM people LIMIT 5;

-- Verificar se as funções existem
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('switch_active_group', 'get_user_groups', 'join_group_by_code');

-- Testar a função get_user_groups (execute logado como um usuário)
SELECT * FROM get_user_groups();
```

## Como Usar

### Para Usuários Finais

1. **Trocar de Grupo**:
   - No header, clique no botão com ícone de pessoas (Users)
   - Selecione o grupo que deseja ativar
   - A página recarregará mostrando os dados do novo grupo ativo

2. **Entrar em Novo Grupo**:
   - Clique no seletor de grupos
   - Clique em "Criar ou Entrar em Grupo"
   - Digite o código de convite
   - Você será adicionado ao grupo (sem sair dos outros)

3. **Visualizar Jogos de Todos os Grupos**:
   - Todos os jogos de todos os seus grupos aparecem na página inicial
   - Cada seção mostra "(Nome do Grupo)" ao lado do título

### Para Desenvolvedores

#### Acessar Grupo Ativo
```typescript
import { useAuth } from "@/components/AuthProvider";

const { profile } = useAuth();
const activeGroupId = profile?.active_group_id || profile?.group_id;
```

#### Forçar Refetch Após Trocar Grupo
```typescript
import { useGameData } from "@/components/GameDataProvider";

const { refetch } = useGameData();
await refetch();
```

#### Adicionar Jogo ao Grupo Ativo
```typescript
const groupId = profile?.active_group_id || profile?.group_id;

await supabase.from("games").insert({
  name: gameTitle,
  group_id: groupId, // Sempre use active_group_id se disponível
  // ... outros campos
});
```

## Estrutura do Banco de Dados

### Tabela: user_groups
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Primary key |
| user_id | UUID | Referência a auth.users |
| group_id | UUID | Referência a groups |
| joined_at | TIMESTAMP | Data de entrada no grupo |
| is_active | BOOLEAN | Se é o grupo ativo do usuário |

### Tabela: people (modificada)
| Coluna Adicionada | Tipo | Descrição |
|-------------------|------|-----------|
| active_group_id | UUID | ID do grupo atualmente ativo |

**Nota**: `group_id` permanece para compatibilidade retroativa.

## Troubleshooting

### Erro: "function get_user_groups() does not exist"
**Solução**: A migration não foi aplicada completamente. Execute novamente a criação das funções.

### Erro: "column active_group_id does not exist"
**Solução**: Execute:
```sql
ALTER TABLE people ADD COLUMN IF NOT EXISTS active_group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
```

### GroupSwitcher não aparece no Header
**Solução**: Verifique se o componente foi importado corretamente:
```typescript
import { GroupSwitcher } from "@/components/GroupSwitcher";
```

### Jogos não aparecem após trocar de grupo
**Solução**:
1. Verifique se o GameDataProvider está buscando de todos os grupos
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique os logs do console para erros

### Seções não mostram nome do grupo
**Solução**: Verifique se a interface `Section` inclui `groupName`:
```typescript
interface Section {
  id: string;
  title: string;
  groupId?: string;
  groupName?: string;
}
```

## Rollback (Se Necessário)

Se algo der errado e você precisar reverter:

```sql
-- Remover funções
DROP FUNCTION IF EXISTS get_user_groups();
DROP FUNCTION IF EXISTS switch_active_group(UUID);

-- Remover coluna
ALTER TABLE people DROP COLUMN IF EXISTS active_group_id;

-- Remover tabela
DROP TABLE IF EXISTS user_groups CASCADE;
```

**ATENÇÃO**: Isso removerá todos os relacionamentos de múltiplos grupos!

## Próximos Passos

Sugestões de melhorias futuras:
- [ ] Adicionar notificação quando alguém adiciona jogo em outro grupo
- [ ] Permitir filtrar apenas jogos de um grupo específico
- [ ] Estatísticas por grupo no perfil
- [ ] Exportar/importar jogos entre grupos
- [ ] Sincronizar seções entre grupos

## Suporte

Se encontrar problemas, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Logs do Supabase no Dashboard
3. Se as policies RLS estão corretas

Para mais ajuda, consulte a documentação do Supabase: https://supabase.com/docs
