import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Validation', () => {
  test('complete authentication flow without loops', async ({ page, context }) => {
    // Start fresh - clear any existing cookies
    await context.clearCookies();

    const consoleErrors: string[] = [];
    const apiCalls: string[] = [];

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor API calls
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiCalls.push(`${response.request().method()} ${response.url()} -> ${response.status()}`);
      }
    });

    // Step 1: Access protected route without authentication
    await page.goto('/esteira');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login.*next=%2Festeira/);

    // Step 2: Perform login
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Step 3: Should redirect to originally requested page
    await expect(page).toHaveURL(/\/esteira/);

    // Step 4: Verify no console errors related to authentication
    const authErrors = consoleErrors.filter(error =>
      error.includes('401') ||
      error.includes('unauthorized') ||
      error.includes('cookie') ||
      error.includes('token')
    );

    if (authErrors.length > 0) {
      console.log('🚨 Authentication-related errors found:', authErrors);
    }
    expect(authErrors.length, 'Should not have authentication errors').toBe(0);

    // Step 5: Verify cookies were set properly
    const cookies = await context.cookies();
    const requiredCookies = ['access', 'refresh', 'role'];

    for (const cookieName of requiredCookies) {
      const cookie = cookies.find(c => c.name === cookieName);
      expect(cookie, `${cookieName} cookie should be present`).toBeDefined();
    }

    // Step 6: Test navigation to other protected routes
    const protectedRoutes = ['/dashboard', '/casos', '/usuarios'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1000);

      // Should not be redirected to login
      await expect(page).not.toHaveURL(/\/login/);

      // Should be on the expected route
      await expect(page).toHaveURL(new RegExp(route));
    }

    // Step 7: Verify API calls pattern
    console.log('📡 API calls made:', apiCalls);

    // Should have successful login call
    const loginCalls = apiCalls.filter(call => call.includes('POST') && call.includes('/auth/login') && call.includes('200'));
    expect(loginCalls.length, 'Should have successful login call').toBeGreaterThanOrEqual(1);

    // Should not have excessive failed calls
    const failedCalls = apiCalls.filter(call => call.includes('401') || call.includes('403'));
    expect(failedCalls.length, 'Should not have many failed API calls').toBeLessThan(3);
  });

  test('middleware logs show correct cookie detection', async ({ page }) => {
    const middlewareLogs: string[] = [];

    // Capture console logs from middleware
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Middleware]')) {
        middlewareLogs.push(text);
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Navigate to trigger middleware
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Check middleware logs
    console.log('🔍 Middleware logs:', middlewareLogs);

    // Should have logs showing valid tokens
    const validTokenLogs = middlewareLogs.filter(log =>
      log.includes('Valid tokens found') || log.includes('hasValid: true')
    );

    expect(validTokenLogs.length, 'Should have logs showing valid tokens detected').toBeGreaterThan(0);

    // Should not have "No valid tokens" logs after login
    const noTokenLogs = middlewareLogs.filter(log =>
      log.includes('No valid tokens') && !log.includes('POST /login')
    );

    expect(noTokenLogs.length, 'Should not have "no valid tokens" logs after successful login').toBe(0);
  });

  test('refresh token functionality', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Get initial cookies
    const initialCookies = await context.cookies();
    const initialAccessCookie = initialCookies.find(c => c.name === 'access');
    const initialRefreshCookie = initialCookies.find(c => c.name === 'refresh');

    expect(initialAccessCookie, 'Should have initial access cookie').toBeDefined();
    expect(initialRefreshCookie, 'Should have initial refresh cookie').toBeDefined();

    // Make an API call that might trigger refresh
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      return {
        status: response.status,
        ok: response.ok
      };
    });

    expect(apiResponse.status, 'API call should be successful').toBe(200);

    // Verify we can still navigate protected routes
    await page.goto('/casos');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('logout clears cookies and redirects to login', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Verify cookies are set
    let cookies = await context.cookies();
    expect(cookies.find(c => c.name === 'access'), 'Should have access cookie before logout').toBeDefined();

    // Perform logout via API
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Verify cookies are cleared
    cookies = await context.cookies();
    expect(cookies.find(c => c.name === 'access'), 'Access cookie should be cleared after logout').toBeUndefined();
    expect(cookies.find(c => c.name === 'refresh'), 'Refresh cookie should be cleared after logout').toBeUndefined();
    expect(cookies.find(c => c.name === 'role'), 'Role cookie should be cleared after logout').toBeUndefined();
  });
});