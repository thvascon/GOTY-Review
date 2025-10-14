import { test, expect } from '@playwright/test';

/**
 * Teste Rápido - Verifica se os testes estão funcionando
 */

test.describe('Teste Rápido', () => {

  test('Playwright está funcionando', async () => {
    console.log('✅ Playwright instalado e funcionando!');
    expect(true).toBe(true);
  });

  test('Consegue acessar o site', async ({ page }) => {
    // Aumenta o timeout
    test.setTimeout(60000);

    console.log('Tentando acessar http://localhost:3000...');

    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('✅ Site acessível!');

      // Verifica se tem algo na página
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();

      console.log('✅ Página tem conteúdo!');
    } catch (error) {
      console.log('❌ Erro ao acessar:', error);
      throw error;
    }
  });

});
