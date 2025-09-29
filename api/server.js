import cors from 'cors';
import { HowLongToBeatService } from 'howlongtobeat';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const hltbService = new HowLongToBeatService();

const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60 * 24;

app.get('/api/hltb', async (req, res) => {
  try {
    const { title } = req.query;
    
    if (!title) {
      console.log('⚠️  Título não fornecido');
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    console.log(`🔍 Buscando: "${title}"`);

    const cacheKey = title.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Retornando do cache');
      return res.json(cached.data);
    }

    console.log('📡 Fazendo requisição ao HowLongToBeat...');
    const results = await hltbService.search(title);
    console.log(`📊 Recebeu ${results?.length || 0} resultados`);
    
    if (!results || results.length === 0) {
      console.log('❌ Nenhum resultado encontrado');
      return res.json([]);
    }

    console.log('🔍 Primeiro resultado (raw):', {
      id: results[0].id,
      name: results[0].name,
      gameplayMain: results[0].gameplayMain,
      gameplayMainExtra: results[0].gameplayMainExtra,
      gameplayCompletionist: results[0].gameplayCompletionist
    });

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

    cache.set(cacheKey, {
      data: formattedResults,
      timestamp: Date.now()
    });
    res.json(formattedResults);
    
  } catch (error) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar no HLTB',
      message: error.message 
    });
  }
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