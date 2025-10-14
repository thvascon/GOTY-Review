# 🧪 Guia de Testes Automatizados - CoDEX

## 📋 O QUE FOI IMPLEMENTADO

Criei uma suite completa de testes E2E (End-to-End) usando **Playwright** que testa TUDO no seu site antes de publicar!

### ✅ 4 Suites de Testes:

1. **01-basic-navigation.spec.ts** - Navegação básica e PWA
2. **02-authentication.spec.ts** - Login, cadastro, logout
3. **03-main-features.spec.ts** - Funcionalidades principais
4. **04-performance-accessibility.spec.ts** - Performance e acessibilidade

---

## 🚀 COMO RODAR OS TESTES

### Pré-requisitos:
```bash
# Já instalado! Mas se precisar:
npm install -D @playwright/test playwright
```

### Rodar TODOS os testes:
```bash
npm test
```

Isso vai:
1. Iniciar o servidor de dev automaticamente
2. Abrir o Chrome em background
3. Rodar todos os testes
4. Mostrar relatório no terminal

### Rodar com interface visual (recomendado):
```bash
npm run test:ui
```

Abre uma interface onde você pode:
- Ver cada teste rodando
- Pausar e inspecionar
- Ver screenshots e vídeos

### Rodar vendo o browser (headed mode):
```bash
npm run test:headed
```

Abre o Chrome e você VÊ os testes rodando ao vivo!

### Ver relatório HTML:
```bash
npm run test:report
```

Abre um relatório bonito com:
- Resultados de cada teste
- Screenshots de falhas
- Vídeos das execuções
- Timeline detalhado

---

## 📊 O QUE OS TESTES VERIFICAM

### Suite 1: Navegação Básica (01-basic-navigation)

✅ Página inicial carrega
✅ Logo aparece
✅ Manifest.json existe e está correto
✅ Ícones PWA (192px e 512px) existem
✅ Service Worker existe
✅ Tela de login aparece
✅ Botão de tema existe
✅ Meta tags corretas
✅ Site é responsivo (mobile)

**Total: 8 testes**

---

### Suite 2: Autenticação (02-authentication)

✅ Formulário de login existe
✅ Validação de email inválido
✅ Troca entre Login/Cadastro
✅ Validação de senha vazia
✅ Botão de logout (quando autenticado)
✅ Link de recuperar senha

**Total: 6 testes**

---

### Suite 3: Funcionalidades Principais (03-main-features)

✅ Botão "Adicionar Jogo" existe
✅ Campo de busca funciona
✅ Header/menu de navegação
✅ Botão de notificações
✅ Página de Feed existe
✅ Página de Perfil existe
✅ Sistema de XP/Level visível
✅ Menu mobile (hamburger)
✅ Sem erros críticos no console

**Total: 9 testes**

---

### Suite 4: Performance & Acessibilidade (04-performance-accessibility)

✅ Carrega rápido (< 5 segundos)
✅ Imagens têm alt text
✅ Tem estrutura de headings (h1, h2)
✅ Inputs têm labels
✅ Botões têm texto/aria-label
✅ Contraste de cores
✅ Navegável por teclado
✅ Tem favicon
✅ Sem recursos 404 críticos
✅ Meta viewport para mobile

**Total: 10 testes**

---

## 📈 TOTAL: **33 TESTES AUTOMATIZADOS**

---

## 🎯 INTERPRETANDO OS RESULTADOS

### ✅ **PASSED (Verde)**
```
✓ Deve carregar a página inicial (1.2s)
```
**Significa:** Teste passou! Tudo funcionando.

### ❌ **FAILED (Vermelho)**
```
✗ Deve ter botão de logout (2.1s)
```
**Significa:** Algo está quebrado. Veja o erro e corrija.

### ⚠️ **SKIPPED (Amarelo)**
```
⊘ Deve fazer login com usuário de teste
```
**Significa:** Teste foi pulado (geralmente falta configuração).

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### Testar em múltiplos browsers:

Edite `playwright.config.ts` e descomente:

```typescript
projects: [
  { name: 'chromium' },  // Chrome ✅
  { name: 'firefox' },   // Firefox
  { name: 'webkit' },    // Safari
]
```

### Testar em mobile:

```typescript
{
  name: 'Mobile Chrome',
  use: { ...devices['Pixel 5'] },
},
```

### Adicionar credenciais de teste:

Crie `.env.local`:
```
TEST_EMAIL=seu-teste@example.com
TEST_PASSWORD=senha-teste-123
```

Depois os testes de autenticação vão funcionar 100%!

---

## 🐛 TROUBLESHOOTING

### "Error: No tests found"
```bash
# Certifique-se que está na pasta raiz
cd /home/Estudo/Site\ Games\ Score/game-review-squad-main
npm test
```

### "Port 3000 is already in use"
```bash
# Mate o processo:
pkill -f "next dev"

# Ou use outra porta no playwright.config.ts:
baseURL: 'http://localhost:3001'
```

### "Browser not found"
```bash
# Instale os browsers do Playwright:
npx playwright install
```

### Testes muito lentos
```bash
# Rode apenas um arquivo:
npx playwright test 01-basic-navigation

# Ou rode em paralelo:
npx playwright test --workers=4
```

---

## 📸 SCREENSHOTS E VÍDEOS

Quando um teste falha, o Playwright automaticamente:

1. **Tira screenshot** da tela no momento do erro
2. **Grava vídeo** dos últimos segundos
3. **Captura trace** (timeline detalhado)

Tudo salvo em: `test-results/`

Para ver:
```bash
npm run test:report
```

---

## 🎓 COMO ADICIONAR NOVOS TESTES

Crie um arquivo em `/tests/`:

```typescript
// tests/05-meu-teste.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Minha Feature', () => {

  test('Deve fazer algo específico', async ({ page }) => {
    await page.goto('/');

    // Seu teste aqui
    const button = page.locator('button.meu-botao');
    await expect(button).toBeVisible();

    console.log('✅ Meu teste passou!');
  });

});
```

---

## 🚀 EXECUTAR ANTES DE PUBLICAR

### Checklist pré-deploy:

```bash
# 1. Rode todos os testes
npm test

# 2. Verifique se todos passaram
# Se algum falhar, corrija antes de publicar!

# 3. Veja o relatório
npm run test:report

# 4. Build de produção
npm run build

# 5. Teste o build
npm start

# 6. Rode os testes no build de produção
npm test

# 7. Se tudo passou ✅ → PUBLIQUE! 🚀
```

---

## 💡 DICAS PRO

### Rodar testes específicos:
```bash
# Só navegação:
npx playwright test 01-basic

# Só autenticação:
npx playwright test 02-auth

# Teste específico:
npx playwright test -g "Deve carregar a página"
```

### Debug de teste:
```bash
# Abre o Inspector (pause e step-by-step):
npx playwright test --debug

# Ou adicione no código:
await page.pause();  // Para aqui
```

### CI/CD (GitHub Actions):
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
```

---

## 📚 RECURSOS

- [Playwright Docs](https://playwright.dev)
- [Seletores CSS](https://playwright.dev/docs/selectors)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## ✅ RESUMO

Você agora tem:

1. ✅ **33 testes automatizados** cobrindo todo o site
2. ✅ **Scripts prontos** no package.json
3. ✅ **Relatórios visuais** com screenshots/vídeos
4. ✅ **CI/CD ready** para deploy automático
5. ✅ **Documentação completa** (este arquivo!)

### Antes de publicar, SEMPRE rode:
```bash
npm test
```

Se todos os testes passarem ✅ → Seu site está pronto para produção! 🚀

---

**Dúvidas?** Leia este arquivo ou rode `npm run test:ui` para ver tudo visualmente!

---

# 🔍 Diagnóstico: HowLongToBeat API

## ❌ Problema Identificado

A biblioteca `howlongtobeat@1.8.0` está retornando **erro 404** em todas as buscas.

## 🔎 Causa Raiz

O site HowLongToBeat mudou sua API. Baseado na investigação:

1. **Endpoint antigo** (não funciona mais):
   ```
   https://howlongtobeat.com/api/search
   ```

2. **Novo formato** (mencionado na issue #63):
   ```
   https://howlongtobeat.com/api/search/{hash_dinamica}
   ```
   Onde `{hash_dinamica}` é uma chave MD5 que muda periodicamente.

3. **Problema adicional**: Mesmo a chave hardcoded mencionada na issue (`4b4cbe570602c88660f7df8ea0cb6b6e`) não funciona mais, indicando que:
   - A chave muda com frequência
   - Ou o formato da API mudou novamente

## 🧪 Testes Realizados

### Teste 1: Biblioteca Original
```bash
cd api && node test-hltb.js
```
**Resultado**: ❌ Erro 404 em todas as requisições

### Teste 2: Endpoint Direto
```bash
cd api && node test-direct-api.js
```
**Resultado**: ❌ Site base está OK (200), mas endpoint /api/search retorna 404

### Teste 3: Procurar Endpoints Alternativos
```bash
cd api && node test-find-endpoint.js
```
**Resultado**: ❌ Nenhum dos endpoints testados funciona

### Teste 4: Usar Chave Hardcoded da Issue
```bash
cd api && node test-new-api.js
```
**Resultado**: ❌ Chave hardcoded também retorna 404

### Teste 5: Inspecionar Scripts do Site
```bash
cd api && node test-inspect-scripts.js
```
**Resultado**: ❌ Não foi possível encontrar a chave nos scripts Next.js

## 📊 Status da Biblioteca

- **Repositório**: https://github.com/ckatzorke/howlongtobeat
- **Última versão**: 1.8.0 (2 anos atrás)
- **Issue relevante**: #63 - "The search url changed" (Ago/2024)
- **Status**: Biblioteca parece não estar mais mantida ativamente

## 🛠️ Próximos Passos Possíveis

### Opção 1: Extrair a Chave Dinamicamente ⭐ (Recomendado)
Criar uma função que:
1. Acessa a página principal do HowLongToBeat
2. Executa JavaScript no contexto da página (simulando navegador)
3. Captura a chave dinâmica usada pelo site
4. Usa essa chave nas requisições subsequentes
5. Implementa cache da chave com renovação periódica

**Vantagens**: Mantém a biblioteca atual
**Limitações**: Requer biblioteca para executar JavaScript (Puppeteer ou Playwright)

### Opção 2: Usar Biblioteca Alternativa
Procurar por forks atualizados ou bibliotecas alternativas:
- `howlongtobeat-api` por nauzethc
- Outras alternativas no NPM

### Opção 3: Implementar Web Scraping Direto
Fazer scraping direto das páginas HTML de busca do HowLongToBeat, sem usar a API.

**Limitações**: Mais frágil a mudanças no HTML do site

### Opção 4: Aguardar Atualização
Aguardar que o mantenedor da biblioteca `howlongtobeat` publique uma correção.

**Limitações**: Não há garantia de quando (ou se) isso acontecerá

## 💡 Recomendação

**Implementar Opção 1** usando Playwright (que já está instalado no projeto) para:
1. Abrir o site em modo headless
2. Capturar a chave de API dinâmica
3. Fazer as requisições com a chave capturada
4. Cachear a chave por 24h (ou até que comece a retornar erro)

Isso mantém o uso da mesma biblioteca, mas adiciona uma camada para obter a chave dinamicamente.

## 📁 Arquivos de Teste Criados

Todos os arquivos de teste estão em `/api/`:
- `test-hltb.js` - Teste básico da biblioteca
- `test-direct-api.js` - Teste do endpoint direto
- `test-find-endpoint.js` - Busca por endpoints alternativos
- `test-new-api.js` - Teste com chave hardcoded
- `test-inspect-scripts.js` - Análise dos scripts do site

Você pode executar qualquer um deles para reproduzir os resultados.


---

## ✅ SOLUÇÃO IMPLEMENTADA - PROBLEMA RESOLVIDO!

**Status**: 🎉 **100% FUNCIONAL!**

A API do HowLongToBeat foi corrigida com sucesso! Troquei a biblioteca `howlongtobeat@1.8.0` (desatualizada) pela **`howlongtobeat-js@1.0.2`** (publicada em Fevereiro de 2025).

### 🔧 O que foi feito:

1. ✅ Identificado que a biblioteca antiga estava quebrada (erro 404)
2. ✅ Pesquisado bibliotecas alternativas no NPM
3. ✅ Encontrado `howlongtobeat-js` atualizada e funcionando
4. ✅ Instalado: `npm install howlongtobeat-js`
5. ✅ Atualizado `/api/server.js` para usar a nova biblioteca
6. ✅ Testado e validado que tudo funciona perfeitamente

### 📦 Nova Biblioteca:

```javascript
// Importar
import pkg from 'howlongtobeat-js';
const { HowLongToBeat } = pkg;

// Usar
const hltbService = new HowLongToBeat();
const results = await hltbService.search('Elden Ring');
```

### 🧪 Testes Finais:

Execute em `/api/`:

```bash
# Testar a biblioteca diretamente
node test-new-lib.js

# Testar o servidor completo (RECOMENDADO)
node test-final.js
```

### ✅ Resultados Validados:

- **Elden Ring**: 60h (main), 101h (main+extra), 135h (100%)
- **The Witcher 3**: 52h (main), 104h (main+extra), 175h (100%)  
- **God of War**: 21h (main), 33h (main+extra), 51h (100%)

### 🚀 Como iniciar o servidor:

```bash
cd api
node server.js
```

Agora o endpoint `http://localhost:3001/api/hltb?title=NOME_DO_JOGO` está funcionando!

---

## 📝 Resumo dos Arquivos de Teste

### ⭐ Arquivos Importantes (Solução Final):
- **`test-new-lib.js`** - Testa a biblioteca nova diretamente ✅
- **`test-final.js`** - Testa o servidor Express completo ✅

### 🔍 Arquivos de Diagnóstico (podem ser ignorados):
- `test-hltb.js` - Biblioteca antiga (quebrada)
- `test-direct-api.js` - Teste do endpoint direto
- `test-find-endpoint.js` - Busca endpoints alternativos
- `test-new-api.js` - Tentativa com chave hardcoded
- `test-inspect-scripts.js` - Análise de scripts
- `test-scraper.js` - Tentativa de web scraping
- `test-simple.js` - Teste básico da lib antiga

---
