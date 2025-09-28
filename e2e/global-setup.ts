import { chromium } from '@playwright/test';

async function globalSetup() {
  // Pode ser usado para setup inicial se necessário
  console.log('🎭 Starting Playwright E2E tests for LifeCalling');

  // Verifica se a aplicação está rodando (opcional)
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { timeout: 10000 });
    await browser.close();
    console.log('✅ Application is running and accessible');
  } catch (error) {
    console.log('⚠️  Application may not be running. Make sure to start it with: pnpm dev:web');
  }
}

export default globalSetup;