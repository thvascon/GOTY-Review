// Salve como components/BuscaJogo.tsx

"use client"; // Se estiver usando Next.js App Router

import React, { useState, useEffect } from 'react';

// 1. Definimos uma interface simples para os dados do jogo
interface Game {
  id: number;
  name: string;
  background_image: string; // A API retorna a imagem da capa neste campo
}

// O único componente que você precisa
export function BuscaJogo() {
  // Estado para guardar o texto que o usuário digita
  const [termoDeBusca, setTermoDeBusca] = useState('');
  
  // Estado para guardar a lista de jogos que a API retorna
  const [resultados, setResultados] = useState<Game[]>([]);
  
  // Estado para guardar o jogo que o usuário selecionou
  const [jogoSelecionado, setJogoSelecionado] = useState<Game | null>(null);

  // Coloque sua chave da API aqui
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

  // 2. Este "efeito" roda toda vez que o 'termoDeBusca' muda
  useEffect(() => {
    // Não busca se o campo estiver vazio
    if (termoDeBusca.trim() === '') {
      setResultados([]);
      return;
    }

    // Função para chamar a API
    const buscarJogos = async () => {
      try {
        const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${termoDeBusca}&page_size=5`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        // Guardamos a lista de resultados no nosso estado
        setResultados(dados.results || []);
      } catch (error) {
        console.error("Falha ao buscar jogos:", error);
      }
    };

    // Chamamos a função de busca
    buscarJogos();
    
  }, [termoDeBusca]); // A dependência: Roda de novo quando 'termoDeBusca' mudar

  return (
    <div style={{ fontFamily: 'sans-serif', color: 'white', padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      
      <h3>Adicionar Novo Jogo</h3>
      
      {/* 3. O campo de input simples */}
      <input
        type="text"
        placeholder="Digite o nome de um jogo..."
        value={termoDeBusca}
        onChange={(e) => setTermoDeBusca(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '16px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
      />

      {/* 4. A lista de resultados (só aparece se tivermos resultados) */}
      {resultados.length > 0 && (
        <ul style={{ background: '#222', listStyle: 'none', padding: '10px', margin: '5px 0 0 0', borderRadius: '4px' }}>
          {resultados.map((jogo) => (
            <li
              key={jogo.id}
              onClick={() => {
                setJogoSelecionado(jogo); // Guarda o jogo selecionado
                setTermoDeBusca(''); // Limpa a busca
                setResultados([]); // Esconde a lista
              }}
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #444' }}
            >
              {jogo.name}
            </li>
          ))}
        </ul>
      )}

      {/* 5. A imagem do jogo selecionado (só aparece se um jogo foi selecionado) */}
      {jogoSelecionado && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h4>{jogoSelecionado.name}</h4>
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