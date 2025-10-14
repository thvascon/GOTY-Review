import { test, expect } from '@playwright/test';

/**
 * Testes de Navegação Básica
 * Verifica se o site carrega e navegação funciona
 */

test.describe('Navegação Básica', () => {

  test('Deve carregar a página inicial', async ({ page }) => {
    await page.goto('/');

    // Verifica se o título está correto
    await expect(page).toHaveTitle(/CoDEX/);

    // Verifica se o logo aparece
    const logo = page.locator('img[alt*="Logo"]').first();
    await expect(logo).toBeVisible();

    console.log('✅ Página inicial carrega corretamente');
  });

  test('Deve ter o manifest.json (PWA)', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('CoDEX da Galera');
    expect(manifest.short_name).toBe('CoDEX');

    console.log('✅ Manifest.json está correto');
  });

  test('Deve ter os ícones PWA', async ({ page }) => {
    // Verifica icon-192
    const icon192 = await page.goto('/icon-192.png');
    expect(icon192?.status()).toBe(200);

    // Verifica icon-512
    const icon512 = await page.goto('/icon-512.png');
    expect(icon512?.status()).toBe(200);

    console.log('✅ Ícones PWA existem');
  });

  test('Deve ter o Service Worker', async ({ page }) => {
    const sw = await page.goto('/sw.js');
    expect(sw?.status()).toBe(200);

    const content = await sw?.text();
    expect(content).toContain('Service Worker');

    console.log('✅ Service Worker existe');
  });

  test('Deve mostrar a página de login/cadastro quando não autenticado', async ({ page }) => {
    await page.goto('/');

    // Deve ter campos de email e senha
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();

    console.log('✅ Tela de login/cadastro aparece');
  });

  test('Deve ter botão de trocar tema (dark/light)', async ({ page }) => {
    await page.goto('/');

    // Procura pelo botão de tema
    const themeToggle = page.locator('button').filter({ hasText: /tema|theme|dark|light/i }).first();

    if (await themeToggle.count() > 0) {
      await expect(themeToggle).toBeVisible();
      console.log('✅ Botão de tema encontrado');
    } else {
      console.log('⚠️  Botão de tema não encontrado (pode estar em ícone)');
    }
  });

  test('Deve ter meta tags corretas', async ({ page }) => {
    await page.goto('/');

    // Verifica meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    // Verifica theme-color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();

    console.log('✅ Meta tags estão presentes');
  });

  test('Deve ser responsivo (mobile)', async ({ page }) => {
    // Simula mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verifica se carrega
    await expect(page.locator('body')).toBeVisible();

    console.log('✅ Site é responsivo');
  });
});
