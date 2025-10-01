import { test, expect, Page } from '@playwright/test';

// Função auxiliar para fazer login como calculista
async function loginAsCalculista(page: Page) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'calculista@lifecalling.com');
  await page.fill('input[name="password"]', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

// Função auxiliar para criar um caso de teste
async function createTestCase(page: Page): Promise<string> {
  // Navegar para esteira e criar um caso
  await page.goto('http://localhost:3000/esteira');

  // Clicar no botão para adicionar novo caso (assumindo que existe)
  await page.click('[data-testid="add-case-button"]');

  // Preencher dados do cliente
  await page.fill('input[name="client.name"]', 'João Silva Teste');
  await page.fill('input[name="client.cpf"]', '12345678901');
  await page.fill('input[name="client.matricula"]', 'MAT123456');
  await page.fill('input[name="client.orgao"]', 'Governo Federal');

  // Salvar caso
  await page.click('button[type="submit"]');

  // Pegar o ID do caso criado da URL ou texto da página
  await page.waitForSelector('[data-testid="case-id"]');
  const caseId = await page.textContent('[data-testid="case-id"]');

  return caseId?.replace('#', '') || '1';
}

test.describe('Calculista Multi-Bank Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCalculista(page);
  });

  test('should complete full simulation workflow with single bank', async ({ page }) => {
    // Navegar para página do calculista
    await page.goto('http://localhost:3000/calculista/1');

    // Verificar se a página carregou
    await expect(page.locator('h1')).toContainText('Simulação Multi-Bancos');

    // Preencher dados do banco 1
    await page.selectOption('select[data-testid="bank-0-select"]', 'SANTANDER');
    await page.fill('input[data-testid="bank-0-parcela"]', '1000.00');
    await page.fill('input[data-testid="bank-0-saldo-devedor"]', '30000.00');
    await page.fill('input[data-testid="bank-0-valor-liberado"]', '22022.91');

    // Preencher dados globais
    await page.fill('input[data-testid="prazo"]', '96');
    await page.fill('input[data-testid="coeficiente"]', '0,0192223');
    await page.fill('input[data-testid="seguro"]', '1000.00');
    await page.fill('input[data-testid="percentual-consultoria"]', '12.00');

    // Calcular simulação
    await page.click('button[data-testid="calculate-button"]');

    // Aguardar o resultado aparecer
    await page.waitForSelector('[data-testid="simulation-result"]');

    // Verificar valores calculados
    await expect(page.locator('[data-testid="valor-parcela-total"]')).toContainText('R$ 1.000,00');
    await expect(page.locator('[data-testid="saldo-total"]')).toContainText('R$ 30.000,00');
    await expect(page.locator('[data-testid="liberado-total"]')).toContainText('R$ 22.022,91');
    await expect(page.locator('[data-testid="total-financiado"]')).toContainText('R$ 52.022,91');
    await expect(page.locator('[data-testid="valor-liquido"]')).toContainText('R$ 21.022,91');
    await expect(page.locator('[data-testid="custo-consultoria"]')).toContainText('R$ 6.242,75');
    await expect(page.locator('[data-testid="liberado-cliente"]')).toContainText('R$ 14.780,16');

    // Verificar se aparece a validação do cenário de teste
    await expect(page.locator('[data-testid="reference-scenario-validation"]')).toContainText('Conforme planilha de referência');

    // Aprovar simulação
    await page.click('button[data-testid="approve-button"]');

    // Verificar redirecionamento
    await page.waitForURL('**/calculista');

    // Verificar toast de sucesso
    await expect(page.locator('.toast')).toContainText('Simulação aprovada');
  });

  test('should handle multi-bank simulation (2 banks)', async ({ page }) => {
    await page.goto('http://localhost:3000/calculista/2');

    // Adicionar segundo banco
    await page.click('button[data-testid="add-bank-button"]');

    // Preencher dados do banco 1
    await page.selectOption('select[data-testid="bank-0-select"]', 'SANTANDER');
    await page.fill('input[data-testid="bank-0-parcela"]', '800.00');
    await page.fill('input[data-testid="bank-0-saldo-devedor"]', '20000.00');
    await page.fill('input[data-testid="bank-0-valor-liberado"]', '15000.00');

    // Preencher dados do banco 2
    await page.selectOption('select[data-testid="bank-1-select"]', 'BRADESCO');
    await page.fill('input[data-testid="bank-1-parcela"]', '600.00');
    await page.fill('input[data-testid="bank-1-saldo-devedor"]', '15000.00');
    await page.fill('input[data-testid="bank-1-valor-liberado"]', '12000.00');

    // Preencher dados globais
    await page.fill('input[data-testid="prazo"]', '84');
    await page.fill('input[data-testid="seguro"]', '500.00');
    await page.fill('input[data-testid="percentual-consultoria"]', '10.00');

    // Calcular simulação
    await page.click('button[data-testid="calculate-button"]');

    // Verificar que o resultado apareça
    await page.waitForSelector('[data-testid="simulation-result"]');

    // Verificar valores calculados para multi-bancos
    await expect(page.locator('[data-testid="valor-parcela-total"]')).toContainText('R$ 1.400,00');
    await expect(page.locator('[data-testid="saldo-total"]')).toContainText('R$ 35.000,00');
    await expect(page.locator('[data-testid="liberado-total"]')).toContainText('R$ 27.000,00');

    // Verificar que os bancos estão listados
    await expect(page.locator('[data-testid="banks-summary"]')).toContainText('SANTANDER');
    await expect(page.locator('[data-testid="banks-summary"]')).toContainText('BRADESCO');
  });

  test('should handle simulation rejection', async ({ page }) => {
    await page.goto('http://localhost:3000/calculista/3');

    // Preencher dados básicos
    await page.fill('input[data-testid="bank-0-parcela"]', '500.00');
    await page.fill('input[data-testid="bank-0-saldo-devedor"]', '10000.00');
    await page.fill('input[data-testid="bank-0-valor-liberado"]', '8000.00');
    await page.fill('input[data-testid="prazo"]', '60');
    await page.fill('input[data-testid="seguro"]', '300.00');
    await page.fill('input[data-testid="percentual-consultoria"]', '8.00');

    // Calcular simulação
    await page.click('button[data-testid="calculate-button"]');
    await page.waitForSelector('[data-testid="simulation-result"]');

    // Rejeitar simulação
    await page.click('button[data-testid="reject-button"]');

    // Verificar redirecionamento
    await page.waitForURL('**/calculista');

    // Verificar toast de sucesso
    await expect(page.locator('.toast')).toContainText('Simulação rejeitada');
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('http://localhost:3000/calculista/4');

    // Tentar calcular sem preencher dados obrigatórios
    await page.click('button[data-testid="calculate-button"]');

    // Verificar que erros de validação aparecem
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Parcela do banco 1 deve ser maior que zero');
    await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Saldo devedor do banco 1 deve ser maior que zero');
  });

  test('should handle maximum of 4 banks', async ({ page }) => {
    await page.goto('http://localhost:3000/calculista/5');

    // Adicionar 3 bancos (já existe 1)
    await page.click('button[data-testid="add-bank-button"]');
    await page.click('button[data-testid="add-bank-button"]');
    await page.click('button[data-testid="add-bank-button"]');

    // Verificar que agora temos 4 bancos
    await expect(page.locator('[data-testid="banks-count"]')).toContainText('4/4 bancos');

    // Verificar que o botão adicionar está desabilitado
    await expect(page.locator('button[data-testid="add-bank-button"]')).toBeDisabled();

    // Remover um banco
    await page.click('button[data-testid="remove-bank-3"]');

    // Verificar que o botão adicionar volta a funcionar
    await expect(page.locator('button[data-testid="add-bank-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="banks-count"]')).toContainText('3/4 bancos');
  });

  test('should prevent access for non-calculista users', async ({ page }) => {
    // Logout e login como atendente
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'atendente@lifecalling.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // Tentar acessar página do calculista
    await page.goto('http://localhost:3000/calculista/1');

    // Verificar redirecionamento para esteira
    await page.waitForURL('**/esteira');

    // Verificar toast de erro
    await expect(page.locator('.toast')).toContainText('Acesso negado');
  });
});