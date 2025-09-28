import { test, expect } from '@playwright/test';

test.describe('Login Cookies Validation', () => {
  test('should set httponly cookies after successful login', async ({ page, context }) => {
    // Monitor console logs for API configuration
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    // Go to login page
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for potential redirect
    await page.waitForTimeout(2000);

    // Get all cookies from context
    const cookies = await context.cookies();

    // Log cookies for debugging
    console.log('🍪 Cookies after login:', cookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...',
      httpOnly: c.httpOnly,
      domain: c.domain,
      secure: c.secure,
      sameSite: c.sameSite
    })));

    // Check for required cookies
    const accessCookie = cookies.find(c => c.name === 'access');
    const refreshCookie = cookies.find(c => c.name === 'refresh');
    const roleCookie = cookies.find(c => c.name === 'role');

    // Assertions
    expect(accessCookie, 'Access cookie should be set').toBeDefined();
    expect(refreshCookie, 'Refresh cookie should be set').toBeDefined();
    expect(roleCookie, 'Role cookie should be set').toBeDefined();

    // Verify cookie properties
    if (accessCookie) {
      expect(accessCookie.httpOnly, 'Access cookie should be HttpOnly').toBe(true);
      expect(accessCookie.domain, 'Access cookie domain should be localhost').toBe('localhost');
      expect(accessCookie.secure, 'Access cookie should not be secure for localhost').toBe(false);
    }

    if (refreshCookie) {
      expect(refreshCookie.httpOnly, 'Refresh cookie should be HttpOnly').toBe(true);
      expect(refreshCookie.domain, 'Refresh cookie domain should be localhost').toBe('localhost');
      expect(refreshCookie.secure, 'Refresh cookie should not be secure for localhost').toBe(false);
    }

    if (roleCookie) {
      expect(roleCookie.httpOnly, 'Role cookie should not be HttpOnly').toBe(false);
      expect(roleCookie.value, 'Role should be admin').toBe('admin');
    }
  });

  test('should not have redirect loop after successful login', async ({ page }) => {
    const navigationUrls: string[] = [];

    // Track all navigations
    page.on('response', (response) => {
      navigationUrls.push(response.url());
    });

    // Go to login page
    await page.goto('/login');

    // Fill credentials and submit
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Should redirect to /esteira
    await expect(page).toHaveURL(/\/esteira/);

    // Wait additional time to check for unwanted redirects
    await page.waitForTimeout(3000);

    // Verify we're still on esteira and not back to login
    await expect(page).not.toHaveURL(/\/login/);

    // Count login-related requests after the initial login
    const loginRedirects = navigationUrls.filter(url =>
      url.includes('/login') && !url.includes('admin@demo.local')
    );

    // Should have minimal login redirects (only the initial ones)
    expect(loginRedirects.length, 'Should not have excessive login redirects').toBeLessThan(3);
  });

  test('should persist cookies across page navigation', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Get cookies after login
    const initialCookies = await context.cookies();
    const initialAccessCookie = initialCookies.find(c => c.name === 'access');

    expect(initialAccessCookie, 'Should have access cookie after login').toBeDefined();

    // Navigate to different pages
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('/casos');
    await page.waitForTimeout(1000);

    // Check cookies are still present
    const finalCookies = await context.cookies();
    const finalAccessCookie = finalCookies.find(c => c.name === 'access');

    expect(finalAccessCookie, 'Should still have access cookie after navigation').toBeDefined();
    expect(finalAccessCookie?.value, 'Access cookie should be the same').toBe(initialAccessCookie?.value);

    // Should not be redirected back to login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should call debug endpoint and show correct cookie data', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/esteira/);

    // Call debug endpoint to verify cookies are being sent to backend
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/auth/debug/cookies', {
        credentials: 'include'
      });
      return res.json();
    });

    // Verify debug response shows cookies
    expect(response.has_access, 'Backend should receive access cookie').toBe(true);
    expect(response.has_refresh, 'Backend should receive refresh cookie').toBe(true);
    expect(response.has_role, 'Backend should receive role cookie').toBe(true);
    expect(response.access_length, 'Access token should have reasonable length').toBeGreaterThan(50);
    expect(response.refresh_length, 'Refresh token should have reasonable length').toBeGreaterThan(50);
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/dashboard');

    // Should be redirected to login with next parameter
    await expect(page).toHaveURL(/\/login.*next=%2Fdashboard/);

    // Login
    await page.fill('input[type="email"]', 'admin@demo.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Should be redirected to the originally requested page
    await expect(page).toHaveURL(/\/dashboard/);
  });
});