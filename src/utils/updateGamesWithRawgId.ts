import { supabase } from '@/integrations/supabase/client';

const API_KEY = '9eff84ebd7de491fae3fbbc05e37a83c';

interface Game {
  id: string;
  name: string;
  rawg_id: number | null;
}

interface RawgSearchResult {
  id: number;
  name: string;
  slug: string;
}

/**
 * Busca o rawgId na API RAWG para um jogo específico
 */
async function fetchRawgId(gameName: string): Promise<number | null> {
  try {
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const game: RawgSearchResult = data.results[0];
      console.log(`✓ Encontrado: "${gameName}" → ${game.name} (ID: ${game.id})`);
      return game.id;
    }

    console.log(`✗ Não encontrado: "${gameName}"`);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar "${gameName}":`, error);
    return null;
  }
}

/**
 * Atualiza todos os jogos sem rawgId no banco de dados
 */
export async function updateGamesWithRawgId(groupId: string) {
  console.log('🎮 Iniciando atualização de jogos com rawgId...\n');

  // Buscar todos os jogos do grupo que não têm rawg_id
  const { data: games, error: fetchError } = await supabase
    .from('games')
    .select('id, name, rawg_id')
    .eq('group_id', groupId)
    .is('rawg_id', null);

  if (fetchError) {
    console.error('❌ Erro ao buscar jogos:', fetchError);
    return { success: false, error: fetchError };
  }

  if (!games || games.length === 0) {
    console.log('✅ Todos os jogos já têm rawgId!');
    return { success: true, updated: 0, total: 0 };
  }

  console.log(`📋 Encontrados ${games.length} jogos sem rawgId\n`);

  let updated = 0;
  let failed = 0;

  // Processar cada jogo
  for (const game of games) {
    const rawgId = await fetchRawgId(game.name);

    if (rawgId) {
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('games')
        .update({ rawg_id: rawgId })
        .eq('id', game.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar "${game.name}":`, updateError);
        failed++;
      } else {
        updated++;
      }
    } else {
      failed++;
    }

    // Aguardar um pouco entre requests para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Resumo:');
  console.log(`   Total: ${games.length}`);
  console.log(`   ✅ Atualizados: ${updated}`);
  console.log(`   ❌ Falhas: ${failed}`);

  return {
    success: true,
    total: games.length,
    updated,
    failed,
  };
}
