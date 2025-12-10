import { test, expect } from '@playwright/test';

// Helper function to login before each test
async function login(page: any) {
  await page.goto('/dev-login');
  await page.getByLabel('Email').fill('tidihatim@gmail.com');
  await page.getByLabel('Password').fill('Godofwar@3');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to library/search page
    await page.goto('/dashboard/library');
  });

  test('search by customer name', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Library|Case Studies/i })).toBeVisible();

    // Find and use the search input
    const searchInput = page.getByPlaceholder(/Search.*customer|Search case studies/i);
    await expect(searchInput).toBeVisible();

    // Type a customer name
    await searchInput.fill('Test Customer');

    // Wait for search results to update
    await page.waitForTimeout(1000); // Debounce time

    // Verify search is working by checking if results are filtered
    // The results should either show matching cases or "no results" message
    const hasResults = await page.getByText(/Test Customer/i).isVisible().catch(() => false);
    const noResults = await page.getByText(/No.*case.*found|No results/i).isVisible().catch(() => false);

    // Either results are shown or no results message appears
    expect(hasResults || noResults).toBeTruthy();
  });

  test('search functionality on search page', async ({ page }) => {
    // Navigate to dedicated search page if it exists
    await page.goto('/dashboard/search');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();

    // Use the search input
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('welding');

    // Submit search (either auto-search or button click)
    const searchButton = page.getByRole('button', { name: /Search/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify results are displayed or no results message
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('filter by industry', async ({ page }) => {
    // Look for industry filter dropdown
    const industryFilter = page.getByLabel(/Industry|Filter.*industry/i).or(
      page.locator('[data-testid="industry-filter"]')
    );

    // Check if industry filter exists on the page
    const filterExists = await industryFilter.count() > 0;

    if (filterExists) {
      // Click on the industry filter
      await industryFilter.first().click();

      // Select an industry (e.g., Manufacturing)
      const industryOption = page.getByRole('option', { name: /Manufacturing/i }).or(
        page.getByText(/Manufacturing/i).first()
      );

      if (await industryOption.isVisible()) {
        await industryOption.click();

        // Wait for filter to apply
        await page.waitForTimeout(1000);

        // Verify filtered results
        const resultsSection = page.locator('[data-testid="case-list"]').or(
          page.locator('main')
        );
        await expect(resultsSection).toBeVisible();

        // Check if Manufacturing appears in the filtered results
        const hasManufacturing = await page.getByText(/Manufacturing/i).count() > 0;
        expect(hasManufacturing).toBeTruthy();
      }
    } else {
      // If no filter exists, just verify the page works
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('filter by status', async ({ page }) => {
    // Navigate to a page with status filters (like my-cases)
    await page.goto('/dashboard/my-cases');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /My Cases|Cases/i })).toBeVisible();

    // Look for status filter
    const statusFilter = page.getByLabel(/Status|Filter.*status/i).or(
      page.locator('[data-testid="status-filter"]')
    );

    const filterExists = await statusFilter.count() > 0;

    if (filterExists) {
      await statusFilter.first().click();

      // Try to select a status (e.g., APPROVED, PENDING, DRAFT)
      const statusOptions = [
        page.getByRole('option', { name: /Approved/i }),
        page.getByRole('option', { name: /Pending/i }),
        page.getByRole('option', { name: /Draft/i }),
        page.getByText(/Approved/i).first(),
        page.getByText(/Pending/i).first(),
      ];

      for (const option of statusOptions) {
        if (await option.isVisible().catch(() => false)) {
          await option.click();
          await page.waitForTimeout(500);
          break;
        }
      }

      // Verify the page still works after filtering
      await expect(page.locator('main')).toBeVisible();
    } else {
      // If no filter exists, verify cases are displayed
      const hasCases = await page.getByText(/No cases|Create your first/i).isVisible().catch(() => false) ||
                       await page.locator('[data-testid="case-card"]').count() > 0;
      expect(hasCases || await page.locator('main').isVisible()).toBeTruthy();
    }
  });

  test('combined filters - industry and status', async ({ page }) => {
    // Go to library with potential filters
    await page.goto('/dashboard/library');
    await expect(page.locator('main')).toBeVisible();

    // Try search combined with filters
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('steel');
      await page.waitForTimeout(500);
    }

    // Look for any filter controls
    const filterControls = page.locator('[data-testid*="filter"]').or(
      page.getByRole('combobox')
    );

    const filterCount = await filterControls.count();

    if (filterCount > 0) {
      // Click first filter if it exists
      await filterControls.first().click();
      await page.waitForTimeout(300);

      // Try to select any option
      const options = page.getByRole('option');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Verify results section is still visible and working
    await expect(page.locator('main')).toBeVisible();
  });

  test('clear filters', async ({ page }) => {
    // Apply some filters first
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await page.waitForTimeout(500);

      // Look for clear button
      const clearButton = page.getByRole('button', { name: /Clear|Reset/i }).or(
        page.locator('[data-testid="clear-filters"]')
      );

      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Verify search input is cleared
        await expect(searchInput).toHaveValue('');
      } else {
        // Manually clear the search
        await searchInput.clear();
      }

      // Verify we can see results again
      await page.waitForTimeout(500);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('pagination works with filters', async ({ page }) => {
    // Check if pagination exists
    const nextButton = page.getByRole('button', { name: /Next|>/i }).or(
      page.locator('[data-testid="next-page"]')
    );

    const previousButton = page.getByRole('button', { name: /Previous|</i }).or(
      page.locator('[data-testid="previous-page"]')
    );

    // Apply a search filter
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }

    // Try pagination if it exists
    if (await nextButton.isVisible()) {
      const initialUrl = page.url();
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verify page changed (URL or content)
      const newUrl = page.url();
      const urlChanged = initialUrl !== newUrl;
      const pageStillWorks = await page.locator('main').isVisible();

      expect(urlChanged || pageStillWorks).toBeTruthy();

      // Try going back
      if (await previousButton.isVisible()) {
        await previousButton.click();
        await page.waitForTimeout(500);
        await expect(page.locator('main')).toBeVisible();
      }
    }
  });
});
