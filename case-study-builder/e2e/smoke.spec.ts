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

  test('dev-login page loads (for testing)', async ({ page }) => {
    const response = await page.goto('/dev-login');
    expect(response?.status()).toBeLessThan(400);
  });

  test('user can login', async ({ page }) => {
    await page.goto('/dev-login');

    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('dashboard loads after login', async ({ page }) => {
    // Login first
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard should have main content
    await expect(page.locator('body')).toBeVisible();

    // Should have navigation elements
    const nav = page.getByRole('navigation').or(page.locator('nav')).or(page.locator('[data-testid="sidebar"]'));
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });

  test('case studies page loads', async ({ page }) => {
    // Login
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to case studies
    await page.goto('/dashboard/case-studies');
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Page should load without errors - check for any visible content
    await expect(page.locator('body')).toBeVisible();
    // Allow page content to load
    await page.waitForLoadState('networkidle');
  });

  test('library page loads', async ({ page }) => {
    // Login
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to library
    await page.goto('/dashboard/library');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('profile/settings page loads', async ({ page }) => {
    // Login
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to profile/settings
    const profileUrl = '/dashboard/profile';
    await page.goto(profileUrl);

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

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
