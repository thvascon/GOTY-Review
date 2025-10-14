import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do CoDEX
 * Leia mais: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Tempo máximo que um teste pode rodar */
  timeout: 60 * 1000,

  /* Executa testes em paralelo */
  fullyParallel: true,

  /* Falha se você deixou test.only no código */
  forbidOnly: !!process.env.CI,

  /* Tenta novamente em caso de falha */
  retries: process.env.CI ? 2 : 0,

  /* Número de workers paralelos */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter - como os resultados são mostrados */
  reporter: [
    ['html'],
    ['list']
  ],

  /* Configurações compartilhadas entre os testes */
  use: {
    /* URL base para usar em page.goto('/') */
    baseURL: 'http://localhost:3000',

    /* Screenshots apenas quando falhar */
    screenshot: 'only-on-failure',

    /* Vídeo apenas quando falhar */
    video: 'retain-on-failure',

    /* Trace apenas quando falhar (debug) */
    trace: 'on-first-retry',
  },

  /* Configura projetos para diferentes browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Descomente para testar em outros browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Testes em mobile */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Inicia o servidor de dev antes dos testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutos para iniciar
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
