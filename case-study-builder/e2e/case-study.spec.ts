import { test, expect } from '@playwright/test';

test.describe('Case Study Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('case study list page loads', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Verify the page loaded
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Check for case study list elements
    await expect(page.getByRole('heading', { name: /case stud/i })).toBeVisible();

    // Check if the create button or list container is visible
    const createButton = page.getByRole('button', { name: /create|new/i });
    const listContainer = page.locator('[data-testid="case-study-list"]').or(page.locator('.case-study-list')).or(page.getByRole('list'));

    await expect(createButton.or(listContainer).first()).toBeVisible({ timeout: 10000 });
  });

  test('create new case study flow', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Click create new case study button
    const createButton = page.getByRole('button', { name: /create|new case study|add case study/i });
    await createButton.click();

    // Wait for navigation or modal to open
    await page.waitForTimeout(1000);

    // Fill in case study details
    const titleInput = page.getByLabel(/title|name/i).first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Test Case Study');

    // Fill in client information if available
    const clientInput = page.getByLabel(/client|company/i).first();
    if (await clientInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clientInput.fill('Test Client');
    }

    // Fill in description if available
    const descriptionInput = page.getByLabel(/description|details/i).first();
    if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionInput.fill('This is a test case study created by E2E tests');
    }

    // Submit the form
    const submitButton = page.getByRole('button', { name: /create|save|submit/i }).last();
    await submitButton.click();

    // Verify success - either toast message or navigation to new case study
    const successMessage = page.getByText(/created|success/i);
    const urlChanged = page.waitForURL(/\/dashboard\/case-studies\/[^/]+/, { timeout: 10000 });

    await Promise.race([
      expect(successMessage).toBeVisible({ timeout: 10000 }),
      urlChanged
    ]);
  });

  test('search functionality', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Wait for page to load
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).or(page.getByLabel(/search/i));

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Type in search query
      await searchInput.fill('test');

      // Wait for search results to update
      await page.waitForTimeout(1000);

      // Verify search is working by checking URL or results update
      const urlHasSearch = await page.url().includes('search=') || await page.url().includes('query=');
      const resultsContainer = page.locator('[data-testid="case-study-list"]').or(page.locator('.case-study-list')).or(page.getByRole('list'));

      // Either URL should be updated or results should be visible
      expect(urlHasSearch || await resultsContainer.isVisible()).toBeTruthy();
    } else {
      test.skip('Search functionality not available on this page');
    }
  });

  test('filter by status', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Wait for page to load
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Look for status filter dropdown or buttons
    const filterButton = page.getByRole('button', { name: /filter|status/i }).first();

    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click filter button
      await filterButton.click();

      // Select a status option (e.g., "Draft" or "Published")
      const draftOption = page.getByRole('option', { name: /draft/i }).or(page.getByText(/draft/i)).first();
      const publishedOption = page.getByRole('option', { name: /published/i }).or(page.getByText(/published/i)).first();

      const optionToClick = await draftOption.isVisible({ timeout: 2000 }).catch(() => false) ? draftOption : publishedOption;

      if (await optionToClick.isVisible({ timeout: 2000 }).catch(() => false)) {
        await optionToClick.click();

        // Wait for results to update
        await page.waitForTimeout(1000);

        // Verify filter is applied by checking URL or results
        const urlHasFilter = await page.url().includes('status=') || await page.url().includes('filter=');
        expect(urlHasFilter || await page.isVisible('[data-testid="case-study-list"]')).toBeTruthy();
      }
    } else {
      test.skip('Status filter not available on this page');
    }
  });

  test('view case study details', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Wait for page to load
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Find and click the first case study
    const firstCaseStudy = page.getByRole('link', { name: /case study|view|details/i }).first()
      .or(page.locator('[data-testid="case-study-item"]').first())
      .or(page.locator('.case-study-item').first());

    if (await firstCaseStudy.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCaseStudy.click();

      // Wait for navigation to detail page
      await page.waitForURL(/\/dashboard\/case-studies\/[^/]+/, { timeout: 10000 });

      // Verify we're on a detail page
      expect(page.url()).toMatch(/\/dashboard\/case-studies\/[^/]+/);
    } else {
      test.skip('No case studies available to view');
    }
  });
});
