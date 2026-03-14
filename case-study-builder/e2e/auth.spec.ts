import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Case Study Builder/i);

    // Login page uses Google OAuth - check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleButton).toBeVisible({ timeout: 10000 });
  });

  // TODO: Update for production auth flow
  // The dev-login page has been removed. The following tests tested
  // the dev-login credentials flow (email, password, role selection)
  // which no longer exists. Login now uses Google OAuth at /login.
  //
  // test('login with valid credentials', async ({ page }) => { ... });
  // test('login with invalid credentials', async ({ page }) => { ... });

  test('logout', async ({ page }) => {
    // TODO: Update for production auth flow
    // This test requires an authenticated session via Google OAuth.
    // Skipping until auth setup (e.g., storageState) is configured for E2E tests.
    test.skip(true, 'Requires Google OAuth authentication setup for E2E tests');
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/\/login|\/signin|\/auth/, { timeout: 10000 });
  });
});
