import { test, expect } from '@playwright/test';

test.describe('Login and WebSocket fixes', () => {
  test('should login successfully and not have redirect loop', async ({ page }) => {
    // Vai para a página de login
    await page.goto('/login');

    // Preenche as credenciais demo
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');

    // Clica no botão de login
    await page.click('button[type="submit"]');

    // Aguarda redirecionamento para a esteira (não deve haver loop)
    await expect(page).toHaveURL(/\/esteira/);

    // Verifica se não voltou para login (confirma que não há loop)
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should establish WebSocket connection without errors', async ({ page }) => {
    // Monitora erros de console, especialmente WebSocket
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Faz login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Aguarda carregar a página principal
    await expect(page).toHaveURL(/\/esteira/);

    // Aguarda um pouco para WebSocket conectar
    await page.waitForTimeout(3000);

    // Verifica se não há erros de WebSocket nos logs
    const webSocketErrors = consoleErrors.filter(error =>
      error.includes('WebSocket') || error.includes('websocket')
    );

    expect(webSocketErrors).toHaveLength(0);
  });

  test('should handle refresh token correctly', async ({ page }) => {
    // Faz login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Simula um período de inatividade navegando para outras páginas
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('/casos');
    await page.waitForTimeout(1000);

    // Verifica se ainda está autenticado (não foi redirecionado para login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Tenta acessar página protegida sem estar logado
    await page.goto('/dashboard');

    // Deve ser redirecionado para login
    await expect(page).toHaveURL(/\/login/);

    // Verifica se o parâmetro 'next' foi setado corretamente
    const url = new URL(page.url());
    expect(url.searchParams.get('next')).toBe('/dashboard');
  });
});