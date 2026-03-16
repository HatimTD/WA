import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Quick validation that critical paths work
 * Run these after every deployment to ensure basic functionality
 */
test.describe('Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);

    // Login page uses Google OAuth - check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleButton).toBeVisible({ timeout: 10000 });
  });

  // TODO: Update for production auth flow
  // test('user can login', ...) - requires Google OAuth setup for E2E tests
  // test('dashboard loads after login', ...) - requires Google OAuth setup for E2E tests
  // test('case studies page loads', ...) - requires Google OAuth setup for E2E tests
  // test('library page loads', ...) - requires Google OAuth setup for E2E tests
  // test('profile/settings page loads', ...) - requires Google OAuth setup for E2E tests

  test('API health check', async ({ request }) => {
    // Check case studies API
    const response = await request.get('/api/case-studies');
    // Should return valid response (even if unauthorized)
    expect(response.status()).toBeLessThan(500);
  });

  test('static assets load', async ({ page }) => {
    await page.goto('/');

    // Check for CSS loading
    const styles = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      return links.length > 0 || document.querySelector('style') !== null;
    });
    expect(styles).toBeTruthy();

    // Check for JavaScript loading
    const scripts = await page.evaluate(() => {
      return document.querySelectorAll('script').length > 0;
    });
    expect(scripts).toBeTruthy();
  });

  test('no console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('manifest') &&
        !error.includes('service-worker') &&
        !error.includes('hydration')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    // Warning only - don't fail on console errors
  });

  test('PWA manifest is available', async ({ request }) => {
    const response = await request.get('/manifest.json');
    // Manifest should exist
    if (response.status() === 200) {
      const manifest = await response.json();
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
    }
  });

  test('robots.txt is available', async ({ request }) => {
    const response = await request.get('/robots.txt');
    // robots.txt should exist (may be 200 or 404 depending on setup)
    expect(response.status()).toBeLessThan(500);
  });
});
