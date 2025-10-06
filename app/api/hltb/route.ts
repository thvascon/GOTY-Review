import { NextRequest, NextResponse } from 'next/server';
import { HowLongToBeatService } from 'howlongtobeat';

// Otimizações de cache
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 horas

const hltbService = new HowLongToBeatService();
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 horas

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');

    if (!title) {
      console.log('⚠️  Título não fornecido');
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    console.log(`🔍 Buscando: "${title}"`);

    // Verificar cache
    const cacheKey = title.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Retornando do cache');
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      });
    }

    // Buscar no HowLongToBeat
    console.log('📡 Fazendo requisição ao HowLongToBeat...');
    const results = await hltbService.search(title);
    console.log(`📊 Recebeu ${results?.length || 0} resultados`);

    if (!results || results.length === 0) {
      console.log('❌ Nenhum resultado encontrado');
      return NextResponse.json([]);
    }

    console.log('🔍 Primeiro resultado (raw):', {
      id: results[0].id,
      name: results[0].name,
      gameplayMain: results[0].gameplayMain,
      gameplayMainExtra: results[0].gameplayMainExtra,
      gameplayCompletionist: results[0].gameplayCompletionist
    });

    // Formatar resultados
    const formattedResults = results.map(game => ({
      id: game.id,
      name: game.name,
      imageUrl: game.imageUrl,
      main: Math.round(game.gameplayMain || 0),
      mainExtra: Math.round(game.gameplayMainExtra || 0),
      completionist: Math.round(game.gameplayCompletionist || 0),
      platforms: game.platforms || [],
      similarity: game.similarity || 0
    })).sort((a, b) => b.similarity - a.similarity);

    // Salvar no cache
    cache.set(cacheKey, {
      data: formattedResults,
      timestamp: Date.now()
    });

    return NextResponse.json(formattedResults, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });

  } catch (error: any) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('❌ Stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Erro ao buscar no HLTB',
        message: error.message
      },
      { status: 500 }
    );
  }
}
