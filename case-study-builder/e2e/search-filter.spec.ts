import { test, expect } from '@playwright/test';

// Helper function to login before each test
async function login(page: any) {
  await page.goto('/dev-login');
  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('library page search works', async ({ page }) => {
    // Navigate to library page
    await page.goto('/dashboard/library');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });

    // Look for the Quick Search section
    await expect(page.getByText(/Quick Search/i)).toBeVisible();
  });

  test('search page works', async ({ page }) => {
    // Navigate to dedicated search page
    await page.goto('/dashboard/search');

    // Wait for page to load - "Search Case Studies"
    await expect(page.getByRole('heading', { name: /Search Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Use the search input
    const searchInput = page.getByPlaceholder(/Search by title/i);
    await searchInput.fill('welding');

    // Click search button
    const searchButton = page.getByRole('button', { name: /^Search$/i });
    await searchButton.click();

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify results section appears
    await expect(page.getByText(/Search Results/i)).toBeVisible({ timeout: 10000 });
  });

  test('filter by type on search page', async ({ page }) => {
    await page.goto('/dashboard/search');
    await expect(page.getByRole('heading', { name: /Search Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Look for Type filter dropdown
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.click();

    // Select APPLICATION type
    await page.getByRole('option', { name: /Application/i }).click();

    // Click search
    await page.getByRole('button', { name: /^Search$/i }).click();

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify search results section visible
    await expect(page.getByText(/Search Results/i)).toBeVisible({ timeout: 5000 });
  });

  test('my cases page status tabs', async ({ page }) => {
    // Navigate to my-cases page which has status filters
    await page.goto('/dashboard/my-cases');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /My Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Look for status tabs
    const allTab = page.getByRole('tab', { name: /All/i });
    const draftsTab = page.getByRole('tab', { name: /Drafts/i });
    const submittedTab = page.getByRole('tab', { name: /Submitted/i });

    // Verify tabs exist
    await expect(allTab).toBeVisible();

    // Click on Drafts tab if visible
    if (await draftsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await draftsTab.click();
      await page.waitForTimeout(500);
      // Verify tab content changes - use heading to be specific
      await expect(page.getByRole('heading', { name: /Draft Cases/i })).toBeVisible();
    }

    // Click on Submitted tab if visible
    if (await submittedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submittedTab.click();
      await page.waitForTimeout(500);
      // Use specific heading selector
      await expect(page.getByRole('heading', { name: 'Submitted Cases', exact: true })).toBeVisible();
    }
  });

  test('clear filters on search page', async ({ page }) => {
    await page.goto('/dashboard/search');
    await expect(page.getByRole('heading', { name: /Search Case Studies/i })).toBeVisible({ timeout: 10000 });

    // Fill search input
    const searchInput = page.getByPlaceholder(/Search by title/i);
    await searchInput.fill('test search');

    // Click Clear button
    const clearButton = page.getByRole('button', { name: /Clear/i });
    await clearButton.click();

    // Verify search input is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('library filters sidebar', async ({ page }) => {
    await page.goto('/dashboard/library');
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });

    // Look for filters section heading in sidebar (not the Advanced Filters button)
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();

    // Verify basic filter sections exist
    await expect(page.getByText('Case Type')).toBeVisible();
    await expect(page.getByText('Industry')).toBeVisible();

    // Verify Advanced Filters toggle button exists (BRD Section 5)
    await expect(page.getByRole('button', { name: /Advanced Filters/i })).toBeVisible();
  });
});
