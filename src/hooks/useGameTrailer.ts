import { useState, useEffect } from 'react';

interface TrailerData {
  id: number;
  name: string;
  preview: string;
  data: {
    480?: string;
    max?: string;
  };
}

interface TrailerResponse {
  count: number;
  results: TrailerData[];
}

interface ScreenshotData {
  id: number;
  image: string;
}

interface ScreenshotResponse {
  count: number;
  results: ScreenshotData[];
}

interface IGDBGameVideo {
  video_id: string; // YouTube video ID
}

export type MediaType = 'video' | 'youtube' | 'screenshots';

export interface GameMedia {
  type: MediaType;
  url?: string; // Para vídeo direto
  youtubeId?: string; // Para YouTube embed
  screenshots?: string[]; // Para screenshots
}

export function useGameTrailer(rawgId: number | null, shouldFetch: boolean = false) {
  const [media, setMedia] = useState<GameMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!rawgId || !shouldFetch || hasFetched) {
      return;
    }

    const fetchMedia = async () => {
      setLoading(true);
      try {
        const RAWG_API_KEY = '9eff84ebd7de491fae3fbbc05e37a83c';

        // MODO TESTE: FORÇAR SCREENSHOTS (DESATIVADO)
        // Descomente o bloco abaixo para testar apenas screenshots
    
        console.log(`📸 MODO TESTE: Pulando para screenshots...`);
        const screenshotsUrlTest = `https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}`;
        const screenshotsResponseTest = await fetch(screenshotsUrlTest);
        const screenshotsDataTest: ScreenshotResponse = await screenshotsResponseTest.json();

        if (screenshotsDataTest.results && screenshotsDataTest.results.length > 0) {
          const screenshots = screenshotsDataTest.results.slice(0, 4).map(s => s.image);
          console.log(`✅ ${screenshots.length} screenshots encontradas!`);
          setMedia({ type: 'screenshots', screenshots });
          setHasFetched(true);
          setLoading(false);
          return;
        }
    
        // FIM DO MODO TESTE

        // 1. Tentar buscar trailer na RAWG
        console.log(`🎬 Tentando buscar trailer na RAWG para jogo ${rawgId}...`);
        const rawgUrl = `https://api.rawg.io/api/games/${rawgId}/movies?key=${RAWG_API_KEY}`;
        const rawgResponse = await fetch(rawgUrl);
        const rawgData: TrailerResponse = await rawgResponse.json();

        if (rawgData.results && rawgData.results.length > 0) {
          const video = rawgData.results[0];
          const videoUrl = video.data['480'] || video.data['max'];
          if (videoUrl) {
            console.log(`✅ Trailer encontrado na RAWG!`);
            setMedia({ type: 'video', url: videoUrl });
            setHasFetched(true);
            setLoading(false);
            return;
          }
        }

        console.log(`❌ Trailer não encontrado na RAWG`);

        // 2. Tentar buscar no IGDB (YouTube)
        console.log(`🎬 Tentando buscar trailer no IGDB...`);
        try {
          // Primeiro, buscar o jogo na IGDB pelo nome da RAWG
          const rawgGameUrl = `https://api.rawg.io/api/games/${rawgId}?key=${RAWG_API_KEY}`;
          const rawgGameResponse = await fetch(rawgGameUrl);
          const rawgGameData = await rawgGameResponse.json();
          const gameName = rawgGameData.name;

          // Buscar jogo no IGDB através da nossa API route
          const igdbSearchResponse = await fetch('/api/igdb', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: 'games',
              body: `search "${gameName}"; fields id,name,videos; limit 1;`
            })
          });

          const igdbGames = await igdbSearchResponse.json();

          if (igdbGames && igdbGames.length > 0 && igdbGames[0].videos && igdbGames[0].videos.length > 0) {
            // Buscar detalhes do vídeo
            const videoId = igdbGames[0].videos[0];
            const igdbVideoResponse = await fetch('/api/igdb', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                endpoint: 'game_videos',
                body: `fields video_id; where id = ${videoId};`
              })
            });

            const igdbVideos = await igdbVideoResponse.json();

            if (igdbVideos && igdbVideos.length > 0 && igdbVideos[0].video_id) {
              console.log(`✅ Trailer encontrado no IGDB (YouTube)!`);
              setMedia({ type: 'youtube', youtubeId: igdbVideos[0].video_id });
              setHasFetched(true);
              setLoading(false);
              return;
            }
          }
        } catch (igdbError) {
          console.error('Erro ao buscar no IGDB:', igdbError);
        }

        console.log(`❌ Trailer não encontrado no IGDB`);

        // 3. Fallback para screenshots da RAWG
        console.log(`📸 Buscando screenshots na RAWG...`);
        const screenshotsUrl = `https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}`;
        const screenshotsResponse = await fetch(screenshotsUrl);
        const screenshotsData: ScreenshotResponse = await screenshotsResponse.json();

        if (screenshotsData.results && screenshotsData.results.length > 0) {
          const screenshots = screenshotsData.results.slice(0, 4).map(s => s.image);
          console.log(`✅ ${screenshots.length} screenshots encontradas!`);
          setMedia({ type: 'screenshots', screenshots });
        } else {
          console.log(`❌ Nenhuma screenshot encontrada`);
          setMedia(null);
        }

        setHasFetched(true);
      } catch (error) {
        console.error('Erro ao buscar mídia:', error);
        setMedia(null);
        setHasFetched(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [rawgId, shouldFetch, hasFetched]);

  return { media, loading };
}
