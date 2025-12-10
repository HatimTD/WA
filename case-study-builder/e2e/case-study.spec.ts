import { test, expect } from '@playwright/test';

test.describe('Case Study Management', () => {
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

  test('library page loads', async ({ page }) => {
    // Navigate to library (the actual route for case studies)
    await page.goto('/dashboard/library');

    // Verify the page loaded - heading is "Case Study Library"
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });

    // Check for filters section
    await expect(page.getByText(/Filters/i)).toBeVisible();
  });

  test('my cases page loads', async ({ page }) => {
    // Navigate to my-cases
    await page.goto('/dashboard/my-cases');

    // Verify the page loaded - heading is "My Case Studies"
    await expect(page.getByRole('heading', { name: /My Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Check for stats cards
    await expect(page.getByText(/Total/i)).toBeVisible();
  });

  test('navigate to new case study from my cases', async ({ page }) => {
    // Navigate to my-cases
    await page.goto('/dashboard/my-cases');
    await expect(page.getByRole('heading', { name: /My Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Click create new case study button (use last() to get the main button, not sidebar)
    const createButton = page.getByRole('link', { name: /New Case Study/i }).last();
    await createButton.click();

    // Wait for navigation to new case study page
    await expect(page).toHaveURL(/\/dashboard\/new/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });
  });

  test('search page loads', async ({ page }) => {
    // Navigate to search
    await page.goto('/dashboard/search');

    // Verify the page loaded - heading is "Search Case Studies"
    await expect(page.getByRole('heading', { name: /Search Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Check for search input
    await expect(page.getByPlaceholder(/Search by title/i)).toBeVisible();
  });

  test('filter tabs work on my cases', async ({ page }) => {
    await page.goto('/dashboard/my-cases');
    await expect(page.getByRole('heading', { name: /My Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Click on different filter tabs
    const draftsTab = page.getByRole('tab', { name: /Drafts/i });
    if (await draftsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftsTab.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/Draft Cases/i)).toBeVisible();
    }
  });
});
