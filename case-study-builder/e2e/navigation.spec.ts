import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('admin@weldingalloys.com');
    await page.getByLabel('Password').fill('TestPassword123');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /ADMIN/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('dashboard loads after login', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard heading is visible
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to library', async ({ page }) => {
    // Navigate to library
    await page.goto('/dashboard/library');

    // Verify library page loaded
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to my cases', async ({ page }) => {
    // Navigate to my-cases
    await page.goto('/dashboard/my-cases');

    // Verify my cases page loaded
    await expect(page.getByRole('heading', { name: /My Case Studies/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to search', async ({ page }) => {
    // Navigate to search
    await page.goto('/dashboard/search');

    // Verify search page loaded
    await expect(page.getByRole('heading', { name: /Search Case Studies/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to new case study', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');

    // Verify new case study page loaded
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to analytics', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/dashboard/analytics');

    // Wait for page to load (might show analytics content or access denied)
    await page.waitForTimeout(1000);
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigate to leaderboard', async ({ page }) => {
    // Navigate to leaderboard
    await page.goto('/dashboard/leaderboard');

    // Wait for page to load
    await page.waitForTimeout(1000);
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigate to settings', async ({ page }) => {
    // First verify we're logged in
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });

    // Navigate to settings
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForTimeout(1000);
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigation persists user session', async ({ page }) => {
    // First verify we're logged in
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });

    // Navigate to library
    await page.goto('/dashboard/library');
    await expect(page).toHaveURL(/\/dashboard\/library/);
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify user is still logged in (should see welcome message)
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 15000 });
  });

  test('sidebar navigation links', async ({ page }) => {
    // First verify we're logged in
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });

    // The sidebar should contain links to various pages
    // Check if common navigation elements exist
    await expect(page.locator('nav').or(page.locator('aside')).first()).toBeVisible();
  });
});
