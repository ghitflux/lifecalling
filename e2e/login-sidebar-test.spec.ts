import { test, expect } from '@playwright/test';

test.describe('Login and Sidebar Tests', () => {
  // Configuração base para todos os testes
  test.beforeEach(async ({ page }) => {
    // Limpa cookies antes de cada teste
    await page.context().clearCookies();
  });

  test('deve fazer login com sucesso e mostrar sidebar para admin', async ({ page }) => {
    // Acessa a página de login
    await page.goto('http://localhost:3001/login');

    // Aguarda a página carregar
    await page.waitForLoadState('networkidle');

    // Verifica se está na página de login
    await expect(page).toHaveURL(/.*\/login/);

    // Preenche formulário de login
    await page.fill('input[name="email"], input[type="email"]', 'admin@demo.local');
    await page.fill('input[name="password"], input[type="password"]', '123456');

    // Clica no botão de login
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');

    // Aguarda redirecionamento para dashboard ou esteira
    await page.waitForURL(/.*\/(dashboard|esteira)/, { timeout: 10000 });

    // Verifica se o login foi bem-sucedido (não está mais na página de login)
    await expect(page).not.toHaveURL(/.*\/login/);

    // Acessa especificamente a página da esteira para verificar a sidebar
    await page.goto('http://localhost:3001/esteira');
    await page.waitForLoadState('networkidle');

    // Verifica se a sidebar está presente
    await expect(page.locator('aside, nav, [data-testid="sidebar"]')).toBeVisible({ timeout: 5000 });

    // Verifica se elementos típicos da sidebar estão visíveis
    const sidebarElements = [
      'text=Supervisão',
      'text=Atendimento',
      'text=Calculista',
      'text=Fechamento',
      'text=Financeiro',
      'text=Usuários',
      'text=Configurações',
      'text=Sair'
    ];

    // Verifica se pelo menos alguns elementos da sidebar estão presentes
    let visibleElements = 0;
    for (const selector of sidebarElements) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        visibleElements++;
      }
    }

    // Deve ter pelo menos 3 elementos da sidebar visíveis
    expect(visibleElements).toBeGreaterThan(2);

    // Verifica se o texto do usuário logado aparece
    await expect(page.locator('text=admin, text=Admin')).toBeVisible({ timeout: 3000 });

    console.log('✅ Login realizado com sucesso e sidebar está visível!');
  });

  test('deve mostrar sidebar em diferentes páginas após login', async ({ page }) => {
    // Faz login primeiro
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@demo.local');
    await page.fill('input[name="password"], input[type="password"]', '123456');
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');

    // Aguarda login
    await page.waitForURL(/.*\/(dashboard|esteira)/, { timeout: 10000 });

    // Testa páginas diferentes
    const pagesToTest = [
      '/esteira',
      '/dashboard',
      '/usuarios',
      '/config'
    ];

    for (const pageUrl of pagesToTest) {
      console.log(`Testando página: ${pageUrl}`);

      await page.goto(`http://localhost:3001${pageUrl}`);
      await page.waitForLoadState('networkidle');

      // Verifica se a sidebar está presente em cada página
      const sidebar = page.locator('aside, nav, [data-testid="sidebar"]');

      // Se a página carregar (não retornar 403/404), deve ter sidebar
      const pageResponse = await page.goto(`http://localhost:3001${pageUrl}`);
      if (pageResponse && pageResponse.status() < 400) {
        await expect(sidebar).toBeVisible({ timeout: 3000 });
        console.log(`✅ Sidebar visível em ${pageUrl}`);
      } else {
        console.log(`⚠️ Página ${pageUrl} retornou status ${pageResponse?.status()}`);
      }
    }
  });

  test('deve testar funcionalidade de logout', async ({ page }) => {
    // Faz login
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@demo.local');
    await page.fill('input[name="password"], input[type="password"]', '123456');
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');

    await page.waitForURL(/.*\/(dashboard|esteira)/, { timeout: 10000 });

    // Acessa esteira para garantir que sidebar está carregada
    await page.goto('http://localhost:3001/esteira');
    await page.waitForLoadState('networkidle');

    // Clica no botão de logout
    await page.click('button:has-text("Sair"), text=Sair');

    // Verifica se foi redirecionado para login
    await page.waitForURL(/.*\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*\/login/);

    console.log('✅ Logout funcionando corretamente!');
  });

  test('deve testar acesso direto a páginas protegidas sem login', async ({ page }) => {
    // Tenta acessar página protegida sem login
    await page.goto('http://localhost:3001/esteira');

    // Deve ser redirecionado para login
    await page.waitForURL(/.*\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*\/login/);

    console.log('✅ Redirecionamento para login funcionando!');
  });
});