import { test, expect } from '@playwright/test';

test.describe('WebSocket Stability Tests', () => {
  test('WebSocket should reconnect after network interruption', async ({ page }) => {
    // Monitor WebSocket messages
    const wsMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('WebSocket')) {
        wsMessages.push(msg.text());
      }
    });

    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/esteira/);

    // Wait for initial WebSocket connection
    await page.waitForTimeout(2000);

    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(3000);

    // Check if WebSocket reconnected (should see reconnection attempts in logs)
    const hasReconnectionAttempts = wsMessages.some(msg =>
      msg.includes('reconnect') || msg.includes('connected')
    );

    expect(hasReconnectionAttempts).toBeTruthy();
  });

  test('WebSocket heartbeat should prevent disconnection during inactivity', async ({ page }) => {
    let wsErrorCount = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('WebSocket')) {
        wsErrorCount++;
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/esteira/);

    // Wait for extended period to test heartbeat (simulating inactivity)
    await page.waitForTimeout(45000); // 45 seconds should trigger heartbeat

    // Should not have WebSocket errors after heartbeat period
    expect(wsErrorCount).toBe(0);
  });

  test('WebSocket should authenticate correctly', async ({ page }) => {
    const wsMessages: string[] = [];
    page.on('console', (msg) => {
      wsMessages.push(msg.text());
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/esteira/);

    // Wait for WebSocket connection
    await page.waitForTimeout(3000);

    // Check for successful WebSocket connection message
    const hasConnectionSuccess = wsMessages.some(msg =>
      msg.includes('WebSocket connected') || msg.includes('✅')
    );

    expect(hasConnectionSuccess).toBeTruthy();

    // Should not have authentication errors
    const hasAuthErrors = wsMessages.some(msg =>
      msg.includes('unauthorized') || msg.includes('invalid token')
    );

    expect(hasAuthErrors).toBeFalsy();
  });
});