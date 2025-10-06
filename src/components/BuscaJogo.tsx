import React, { useState, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;
  background_image: string;
  genres: Genre[];
}

interface BuscaJogoProps {
  onGameSelected: (gameData: { title: string; coverImage: string; genres: string[] }) => void;
}

export function BuscaJogo({ onGameSelected }: BuscaJogoProps) {
  const [termoDeBusca, setTermoDeBusca] = useState('');
  const [resultados, setResultados] = useState<Game[]>([]);
  const [jogoSelecionado, setJogoSelecionado] = useState<Game | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

  useEffect(() => {
    if (termoDeBusca.trim() === '') {
      setResultados([]);
      return;
    }

    const buscarJogos = async () => {
      try {
        const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${termoDeBusca}&page_size=5`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        setResultados(dados.results || []);
      } catch (error) {
        console.error("Falha ao buscar jogos:", error);
      }
    };

    buscarJogos();
    
  }, [termoDeBusca, API_KEY]);

  return (
    <div style={{ fontFamily: 'sans-serif', color: 'white', padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h3>Adicionar Novo Jogo</h3>
      
      <input
        type="text"
        placeholder="Digite o nome de um jogo..."
        value={termoDeBusca}
        onChange={(e) => setTermoDeBusca(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '16px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
      />

      {resultados.length > 0 && (
        <ul style={{ background: '#222', listStyle: 'none', padding: '10px', margin: '5px 0 0 0', borderRadius: '4px' }}>
          {resultados.map((jogo) => (
            <li
              key={jogo.id}
              onClick={() => {
                const generosFormatados = jogo.genres.map(g => g.name);
                onGameSelected({ 
                  title: jogo.name, 
                  coverImage: jogo.background_image, 
                  genres: generosFormatados 
                });
                setJogoSelecionado(jogo);
                setTermoDeBusca('');
                setResultados([]);
              }}
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #444' }}
            >
              <div>{jogo.name}</div>
              {jogo.genres && jogo.genres.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {jogo.genres.map((genre) => (
                    <span 
                      key={genre.id}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {jogoSelecionado && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h4>{jogoSelecionado.name}</h4>
          {jogoSelecionado.genres && jogoSelecionado.genres.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              {jogoSelecionado.genres.map((genre) => (
                <span 
                  key={genre.id}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
          <img
            src={jogoSelecionado.background_image}
            alt={`Capa do jogo ${jogoSelecionado.name}`}
            style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }}
          />
        </div>
      )}
    </div>
  );
}