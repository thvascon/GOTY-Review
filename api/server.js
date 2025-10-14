import cors from 'cors';
import express from 'express';
import pkg from 'howlongtobeat-js';
const { HowLongToBeat } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const hltbService = new HowLongToBeat();
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 horas

app.get('/api/hltb', async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      console.log('⚠️  Título não fornecido');
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Nova busca: "${title}"`);
    console.log('='.repeat(60));

    // Verificar cache
    const cacheKey = title.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Retornando do cache');
      console.log(`📊 ${cached.data.length} resultados`);
      console.log('='.repeat(60) + '\n');
      return res.json(cached.data);
    }

    // Buscar usando a biblioteca atualizada
    console.log('📡 Fazendo requisição ao HowLongToBeat...');
    const rawResults = await hltbService.search(title);
    console.log(`📊 Recebeu ${rawResults?.length || 0} resultados`);

    if (!rawResults || rawResults.length === 0) {
      console.log('❌ Nenhum resultado encontrado\n');
      return res.json([]);
    }

    // Formatar resultados para o formato esperado pelo frontend
    const results = rawResults.map(game => ({
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
    console.log('='.repeat(60) + '\n');

    // Salvar no cache
    cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    res.json(results);

  } catch (error) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao buscar no HLTB',
      message: error.message
    });
  }
});

// Endpoint para limpar cache (útil para debug)
app.post('/api/hltb/clear-cache', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache limpo com sucesso' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    cache_size: cache.size,
    message: '🎮 Servidor HLTB rodando!'
  });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});