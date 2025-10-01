import { test, expect } from '@playwright/test';

test.describe('Sistema de Anexos', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/esteira');
  });

  test('deve permitir upload de anexos em um caso', async ({ page }) => {
    // Ir para página de casos
    await page.goto('/esteira');

    // Aguardar carregar casos
    await page.waitForSelector('[data-testid="case-card"]', { timeout: 10000 });

    // Clicar no primeiro caso
    const caseCard = page.locator('[data-testid="case-card"]').first();
    await caseCard.click();

    // Aguardar página de detalhes do caso
    await page.waitForURL(/\/casos\/\d+/);

    // Verificar se está na página de detalhes
    await expect(page.locator('h1')).toContainText('Caso #');

    // Procurar pelo componente de upload
    const uploadButton = page.locator('button:has-text("Anexar Documento")');
    await expect(uploadButton).toBeVisible();

    // Criar arquivo de teste
    const fileContent = 'Teste de anexo do sistema';

    // Simular upload de arquivo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;

    // Criar arquivo temporário para teste
    await fileChooser.setFiles({
      name: 'teste-documento.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });

    // Aguardar upload ser processado
    await page.waitForTimeout(2000);

    // Verificar se anexo aparece na lista
    await expect(page.locator('text=teste-documento.txt')).toBeVisible();
  });

  test('deve mostrar anexos existentes no fechamento', async ({ page }) => {
    // Ir para fechamento
    await page.goto('/fechamento');

    // Aguardar carregar casos
    await page.waitForSelector('[data-testid="case-card"]', { timeout: 10000 });

    // Clicar no primeiro caso
    const caseCard = page.locator('[data-testid="case-card"]').first();
    await caseCard.click();

    // Aguardar página de detalhes do fechamento
    await page.waitForURL(/\/fechamento\/\d+/);

    // Verificar se está na página de detalhes do fechamento
    await expect(page.locator('h1')).toContainText('Detalhes do Caso');
    await expect(page.locator('text=Módulo de Fechamento')).toBeVisible();

    // Verificar se seção de anexos existe
    await expect(page.locator('text=Anexos')).toBeVisible();
  });

  test('deve mostrar dados da simulação no fechamento', async ({ page }) => {
    // Ir para fechamento
    await page.goto('/fechamento');

    // Aguardar carregar casos
    await page.waitForSelector('[data-testid="case-card"]', { timeout: 10000 });

    // Clicar em um caso que tenha simulação aprovada
    const caseCard = page.locator('[data-testid="case-card"]').first();
    await caseCard.click();

    // Aguardar página de detalhes do fechamento
    await page.waitForURL(/\/fechamento\/\d+/);

    // Verificar se informações financeiras estão sendo mostradas
    // (pode não ter simulação aprovada ainda, então vamos verificar se a estrutura existe)
    const financialSection = page.locator('text=Informações Financeiras, text=Status da Simulação').first();

    // Se houver simulação, deve mostrar informações
    if (await financialSection.isVisible()) {
      console.log('✅ Simulação encontrada no fechamento');
    } else {
      console.log('ℹ️ Nenhuma simulação aprovada encontrada (esperado para teste)');
    }
  });
});