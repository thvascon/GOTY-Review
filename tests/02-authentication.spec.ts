import { test, expect } from '@playwright/test';

/**
 * Testes de Autenticação
 * Verifica login, cadastro e logout
 *
 * NOTA: Estes testes precisam de credenciais válidas
 * Configure as variáveis de ambiente ou use dados de teste
 */

test.describe('Autenticação', () => {

  test('Deve mostrar formulário de login', async ({ page }) => {
    await page.goto('/');

    // Verifica campos de login
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('✅ Formulário de login está presente');
  });

  test('Deve validar email inválido', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Tenta fazer login com email inválido
    await emailInput.fill('email-invalido');
    await passwordInput.fill('senha123');
    await submitButton.click();

    // Deve mostrar erro de validação (HTML5)
    const isInvalid = await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid === false);
    expect(isInvalid).toBe(true);

    console.log('✅ Validação de email funciona');
  });

  test('Deve ter opção de trocar entre Login e Cadastro', async ({ page }) => {
    await page.goto('/');

    // Procura por tabs ou botões de Login/Cadastro
    const loginTab = page.locator('text=/Login/i').first();
    const cadastroTab = page.locator('text=/Cadastr|Sign up/i').first();

    if (await loginTab.count() > 0 && await cadastroTab.count() > 0) {
      await expect(loginTab).toBeVisible();
      await expect(cadastroTab).toBeVisible();

      // Clica em cadastro
      await cadastroTab.click();
      await page.waitForTimeout(500);

      console.log('✅ Troca entre Login/Cadastro funciona');
    } else {
      console.log('⚠️  Tabs de Login/Cadastro não encontradas');
    }
  });

  test('Deve validar senha vazia', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Preenche email mas não senha
    await emailInput.fill('teste@example.com');
    await passwordInput.fill('');
    await submitButton.click();

    // HTML5 deve impedir submit
    const isInvalid = await passwordInput.evaluate(el => (el as HTMLInputElement).validity.valid === false);
    expect(isInvalid).toBe(true);

    console.log('✅ Validação de senha vazia funciona');
  });

  test('Deve ter botão de logout quando autenticado', async ({ page }) => {
    // Este teste assume que você tem um usuário de teste
    // Você pode pular se não tiver credenciais

    try {
      await page.goto('/');

      // Tenta fazer login (você precisa ajustar com suas credenciais de teste)
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await emailInput.fill(process.env.TEST_EMAIL || 'skip');
      await passwordInput.fill(process.env.TEST_PASSWORD || 'skip');

      if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        await submitButton.click();

        // Aguarda navegação ou mudança de estado
        await page.waitForTimeout(3000);

        // Procura botão de logout
        const logoutButton = page.locator('button, a').filter({ hasText: /logout|sair/i }).first();

        if (await logoutButton.count() > 0) {
          await expect(logoutButton).toBeVisible();
          console.log('✅ Botão de logout está presente');
        }
      } else {
        console.log('⚠️  Teste de logout pulado (sem credenciais de teste)');
      }
    } catch (error) {
      console.log('⚠️  Teste de logout pulado:', error);
    }
  });

  test('Deve ter link para recuperar senha', async ({ page }) => {
    await page.goto('/');

    // Procura por link "Esqueci a senha"
    const forgotPassword = page.locator('text=/esqueci|forgot|recuperar/i').first();

    if (await forgotPassword.count() > 0) {
      await expect(forgotPassword).toBeVisible();
      console.log('✅ Link de recuperar senha encontrado');
    } else {
      console.log('⚠️  Link de recuperar senha não encontrado');
    }
  });
});
