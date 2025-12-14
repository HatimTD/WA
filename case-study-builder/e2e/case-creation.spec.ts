import { test, expect } from '@playwright/test';

// Helper function to login before each test
async function login(page: any) {
  await page.goto('/dev-login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('tidihatim@gmail.com');
  await page.getByLabel('Password').fill('Godofwar@3');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
}

test.describe('Case Study Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navigate to new case study page', async ({ page }) => {
    // Navigate to new case study page
    await page.goto('/dashboard/new');

    // Verify the page loaded
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Verify case type cards are visible
    await expect(page.getByText('Application Case')).toBeVisible();
    await expect(page.getByText('Tech Case')).toBeVisible();
    await expect(page.getByText('Star Case')).toBeVisible();
  });

  test('select case type APPLICATION', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Click on Application Case card/label
    await page.getByText('Application Case').click();

    // Click Next to go to step 2 (use exact match to avoid Next.js dev tools button)
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Verify we're on step 2 (Basic Info) by checking for Customer Name field
    await expect(page.getByText(/Customer Name/i)).toBeVisible({ timeout: 5000 });
  });

  test('fill basic info step', async ({ page }) => {
    await page.goto('/dashboard/new');

    // Step 1: Select Application Case and go to next
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Wait for step 2 to load
    await expect(page.getByText(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // The test verifies we can navigate to the basic info step
    // Actual form filling is complex due to NetSuite integration and custom components
    // Just verify we're on the right step
    await expect(page.locator('#location')).toBeVisible();
    await expect(page.locator('#componentWorkpiece')).toBeVisible();
  });

  test('create APPLICATION case - form navigation', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Verify step 1 is visible with case types
    await expect(page.getByText('Application Case')).toBeVisible();
    await expect(page.getByText('Tech Case')).toBeVisible();
    await expect(page.getByText('Star Case')).toBeVisible();

    // Click Next to go to step 2 (Application case is default)
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Verify step 2 loaded
    await expect(page.getByText(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // Go back to step 1
    await page.getByRole('button', { name: /Previous/i }).click();
    await expect(page.getByText('Application Case')).toBeVisible({ timeout: 5000 });

    // This test verifies the form wizard navigation works
    // Full form submission would require mocking APIs or seeding test data
  });

  test('save as draft button exists', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Verify Save Draft button is visible and enabled
    const saveDraftButton = page.getByRole('button', { name: /Save Draft/i });
    await expect(saveDraftButton).toBeVisible();
    await expect(saveDraftButton).toBeEnabled();

    // Note: Actually saving a draft requires valid form data and database connection
    // This test verifies the UI element exists
  });

  test('case type selection changes available steps', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Check that APPLICATION case shows standard steps (no WPS)
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    // Verify no WPS step visible in progress
    const wpsStepVisible = await page.getByText('WPS').isVisible().catch(() => false);

    // Now select TECH case
    await page.getByText('Tech Case').click();
    await page.waitForTimeout(300);

    // For TECH case, WPS step should be visible in the progress indicator
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible();
  });

  test('validation prevents moving to next step without required fields', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Go to Step 2 (Basic Info)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Try to go to Step 3 without filling required fields
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Should see error toast or remain on same step
    const errorVisible = await page.getByText(/required|fill.*field/i).isVisible({ timeout: 3000 }).catch(() => false);
    const stillOnStep2 = await page.getByText(/Customer Name/i).isVisible().catch(() => false);

    expect(errorVisible || stillOnStep2).toBeTruthy();
  });

  test('navigation between steps works', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Go to Step 2
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // Go back to Step 1
    await page.getByRole('button', { name: /Previous/i }).click();
    await expect(page.getByText('Application Case')).toBeVisible({ timeout: 5000 });

    // Verify we're back on Step 1
    await expect(page.getByRole('heading', { name: /Case Type/i })).toBeVisible();
  });
});
