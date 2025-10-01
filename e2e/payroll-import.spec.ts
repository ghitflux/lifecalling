import { test, expect } from '@playwright/test';

test.describe('Sistema de Importação de Folha de Pagamento', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@demo.local');
    await page.fill('input[name="password"]', '123456');
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Deve mostrar página de importação com instruções corretas', async ({ page }) => {
    // Navegar para importação
    await page.click('a[href="/importacao"]');
    await expect(page).toHaveURL(/.*importacao/);

    // Verificar título e elementos principais
    await expect(page.getByText('Importação de Dados')).toBeVisible();
    await expect(page.getByText('Formato aceito: Arquivo de texto (.txt) - Layout iNETConsig')).toBeVisible();
    await expect(page.getByText('Instruções para Importação iNETConsig')).toBeVisible();

    // Verificar instruções específicas
    await expect(page.getByText('Arquivo deve estar no formato TXT padrão iNETConsig')).toBeVisible();
    await expect(page.getByText('Chave primária: CPF + Matrícula')).toBeVisible();
  });

  test('Deve mostrar página de clientes vazia inicialmente', async ({ page }) => {
    // Navegar para clientes
    await page.click('a[href="/clientes"]');
    await expect(page).toHaveURL(/.*clientes/);

    // Verificar título
    await expect(page.getByText('Clientes')).toBeVisible();
    await expect(page.getByText('Clientes importados do sistema de folha de pagamento')).toBeVisible();

    // Verificar campo de busca
    await expect(page.getByPlaceholder('Buscar por nome, CPF ou matrícula...')).toBeVisible();
  });

  test('Deve validar upload de arquivo incorreto', async ({ page }) => {
    // Navegar para importação
    await page.click('a[href="/importacao"]');

    // Tentar fazer upload de arquivo não-TXT
    const fileInput = page.locator('input[type="file"]');

    // Criar um arquivo falso com extensão incorreta
    const buffer = Buffer.from('conteúdo de teste');
    await fileInput.setInputFiles({
      name: 'teste.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Verificar que o botão de envio está habilitado mesmo com arquivo selecionado
    const enviarButton = page.getByText('Enviar');
    await expect(enviarButton).toBeVisible();

    // Clicar em enviar deve gerar erro
    await enviarButton.click();

    // Aguardar erro de formato
    await expect(page.getByText(/Arquivo deve ser \.txt/)).toBeVisible();
  });

  test('Deve mostrar navegação entre páginas relacionadas', async ({ page }) => {
    // Verificar se sidebar contém links corretos
    await expect(page.locator('a[href="/clientes"]')).toBeVisible();
    await expect(page.locator('a[href="/importacao"]')).toBeVisible();

    // Navegar para clientes
    await page.click('a[href="/clientes"]');
    await expect(page).toHaveURL(/.*clientes/);

    // Verificar se há link para importação quando não há clientes
    const importarButton = page.getByText('Importar Dados');
    if (await importarButton.isVisible()) {
      await importarButton.click();
      await expect(page).toHaveURL(/.*importacao/);
    }
  });

  test('Deve funcionar busca de clientes mesmo sem dados', async ({ page }) => {
    // Navegar para clientes
    await page.click('a[href="/clientes"]');

    // Testar busca
    await page.fill('input[placeholder="Buscar por nome, CPF ou matrícula..."]', 'teste');

    // Deve mostrar contador zerado
    await expect(page.getByText(/0 de \d+ clientes/)).toBeVisible();

    // Limpar busca
    await page.fill('input[placeholder="Buscar por nome, CPF ou matrícula..."]', '');
  });

  test('Deve mostrar histórico de importações vazio', async ({ page }) => {
    // Navegar para importação
    await page.click('a[href="/importacao"]');

    // Verificar seção de histórico
    await expect(page.getByText('Histórico de Importações')).toBeVisible();

    // Deve mostrar estado vazio
    await expect(page.getByText('Nenhuma importação encontrada')).toBeVisible();
    await expect(page.getByText('Envie um arquivo para começar')).toBeVisible();
  });
});

test.describe('API Endpoints', () => {
  test('Deve responder corretamente aos endpoints principais', async ({ request }) => {
    // Fazer login para obter cookies
    const loginResponse = await request.post('http://localhost:8000/auth/login', {
      form: {
        email: 'admin@demo.local',
        password: '123456'
      }
    });
    expect(loginResponse.ok()).toBeTruthy();

    // Testar endpoint de clientes
    const clientsResponse = await request.get('http://localhost:8000/clients');
    expect(clientsResponse.ok()).toBeTruthy();
    const clientsData = await clientsResponse.json();
    expect(Array.isArray(clientsData)).toBeTruthy();

    // Testar endpoint de lotes de importação
    const batchesResponse = await request.get('http://localhost:8000/imports/payroll/batches');
    expect(batchesResponse.ok()).toBeTruthy();
    const batchesData = await batchesResponse.json();
    expect(batchesData).toHaveProperty('items');
    expect(Array.isArray(batchesData.items)).toBeTruthy();
  });
});