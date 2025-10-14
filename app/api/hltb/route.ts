import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - CommonJS module
import pkg from 'howlongtobeat-js';

const { HowLongToBeat } = pkg;

// Otimizações de cache
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 horas

const hltbService = new HowLongToBeat();
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

    // Buscar no HowLongToBeat usando a biblioteca atualizada
    console.log('📡 Fazendo requisição ao HowLongToBeat...');
    const rawResults = await hltbService.search(title);
    console.log(`📊 Recebeu ${rawResults?.length || 0} resultados`);

    if (!rawResults || rawResults.length === 0) {
      console.log('❌ Nenhum resultado encontrado');
      return NextResponse.json([]);
    }

    // Formatar resultados para o formato esperado pelo frontend
    const results = rawResults.map((game: any) => ({
      id: String(game.gameId),
      name: game.gameName,
      imageUrl: game.gameImageUrl,
      main: Math.round(game.mainStory || 0),
      mainExtra: Math.round(game.mainExtra || 0),
      completionist: Math.round(game.completionist || 0),
      platforms: game.profilePlatforms || [],
      similarity: game.similarity || 0
    }));

    console.log('🔍 Primeiro resultado:', {
      id: results[0].id,
      name: results[0].name,
      main: results[0].main,
      mainExtra: results[0].mainExtra,
      completionist: results[0].completionist
    });

    // Salvar no cache
    cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return NextResponse.json(results, {
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
