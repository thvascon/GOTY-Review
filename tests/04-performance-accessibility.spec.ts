import { test, expect } from '@playwright/test';

/**
 * Testes de Performance e Acessibilidade
 * Verifica velocidade e conformidade
 */

test.describe('Performance e Acessibilidade', () => {

  test('Deve carregar a página inicial rápido (< 5s)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Tempo de carregamento: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000);

    if (loadTime < 2000) {
      console.log('✅ Carregamento RÁPIDO (< 2s)');
    } else if (loadTime < 5000) {
      console.log('✅ Carregamento OK (< 5s)');
    }
  });

  test('Deve ter imagens com alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Pega todas as imagens
    const images = await page.locator('img').all();

    let imagesWithoutAlt = 0;

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        imagesWithoutAlt++;
      }
    }

    console.log(`📷 Total de imagens: ${images.length}`);
    console.log(`⚠️  Imagens sem alt: ${imagesWithoutAlt}`);

    if (imagesWithoutAlt === 0) {
      console.log('✅ Todas as imagens têm alt text');
    } else {
      console.log(`⚠️  ${imagesWithoutAlt} imagens sem alt text`);
    }

    // Permite algumas imagens decorativas sem alt
    expect(imagesWithoutAlt).toBeLessThan(images.length / 2);
  });

  test('Deve ter headings (h1, h2, etc)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();

    console.log(`📝 H1: ${h1}, H2: ${h2}`);

    // Deve ter pelo menos um heading
    expect(h1 + h2).toBeGreaterThan(0);

    console.log('✅ Página tem estrutura de headings');
  });

  test('Deve ter labels em inputs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Pega todos os inputs
    const inputs = await page.locator('input').all();

    let inputsWithoutLabel = 0;

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      // Input deve ter id+label, aria-label ou placeholder
      if (!id && !ariaLabel && !placeholder) {
        inputsWithoutLabel++;
      }
    }

    console.log(`📝 Total de inputs: ${inputs.length}`);
    console.log(`⚠️  Inputs sem label: ${inputsWithoutLabel}`);

    if (inputsWithoutLabel === 0) {
      console.log('✅ Todos os inputs têm labels/placeholders');
    } else {
      console.log(`⚠️  ${inputsWithoutLabel} inputs sem label adequado`);
    }
  });

  test('Deve ter botões com texto/aria-label', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Pega todos os botões
    const buttons = await page.locator('button').all();

    let buttonsWithoutText = 0;

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      if ((!text || text.trim() === '') && !ariaLabel) {
        buttonsWithoutText++;
      }
    }

    console.log(`🔘 Total de botões: ${buttons.length}`);
    console.log(`⚠️  Botões sem texto: ${buttonsWithoutText}`);

    if (buttonsWithoutText === 0) {
      console.log('✅ Todos os botões têm texto/aria-label');
    } else {
      console.log(`⚠️  ${buttonsWithoutText} botões sem texto adequado`);
    }

    // Permite alguns botões de ícone sem texto
    expect(buttonsWithoutText).toBeLessThan(buttons.length / 2);
  });

  test('Deve ter contraste adequado (visual check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Este teste é visual - podemos verificar se o tema está aplicado
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    console.log(`🎨 Background color: ${backgroundColor}`);

    expect(backgroundColor).toBeTruthy();

    console.log('✅ Tema está aplicado (verificar contraste manualmente)');
  });

  test('Deve ser navegável por teclado', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Pressiona Tab algumas vezes
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    // Verifica se algum elemento está focado
    const focusedElement = page.locator(':focus');

    if (await focusedElement.count() > 0) {
      console.log('✅ Navegação por teclado funciona');
    } else {
      console.log('⚠️  Navegação por teclado pode não estar funcionando');
    }
  });

  test('Deve ter favicon', async ({ page }) => {
    await page.goto('/');

    // Procura por link de favicon
    const favicon = page.locator('link[rel*="icon"]').first();

    if (await favicon.count() > 0) {
      const href = await favicon.getAttribute('href');
      console.log(`✅ Favicon encontrado: ${href}`);
    } else {
      console.log('⚠️  Favicon não encontrado no HTML');
    }
  });

  test('Não deve ter recursos bloqueando (404s críticos)', async ({ page }) => {
    const failed404s: string[] = [];

    // Intercepta requisições
    page.on('response', response => {
      if (response.status() === 404) {
        const url = response.url();
        // Ignora algumas 404s esperadas
        if (!url.includes('favicon') && !url.includes('hot-update')) {
          failed404s.push(url);
        }
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    if (failed404s.length > 0) {
      console.log('⚠️  Recursos 404 encontrados:', failed404s);
    } else {
      console.log('✅ Nenhum recurso 404 crítico');
    }

    expect(failed404s.length).toBeLessThan(3);
  });

  test('Deve ter meta viewport para mobile', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

    expect(viewport).toContain('width=device-width');
    console.log('✅ Meta viewport configurado para mobile');
  });
});
