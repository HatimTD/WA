import { test, expect, Page } from '@playwright/test';

test.setTimeout(90000);

// Helper function to login
async function login(page: Page) {
  await page.goto('/dev-login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  // Click on ADMIN pill button (new UI uses pill buttons instead of dropdown)
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('button', { name: /Login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
}

test.describe('NetSuite UI Verification', () => {
  test('verify NetSuite search UI elements', async ({ page }) => {
    await login(page);

    // Go to new case study page
    await page.goto('/dashboard/new', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Select APPLICATION type and go to next step
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // 1. Open the customer search modal by clicking the search button
    const customerSearchButton = page.locator('[role="button"]').filter({ hasText: /Click to search customers/ });
    await customerSearchButton.click();
    await page.waitForTimeout(500);

    // 2. Verify the modal dialog is open and has correct description
    const dialogDescription = await page.textContent('[role="dialog"] p');
    console.log('Dialog description:', dialogDescription);
    expect(dialogDescription).toContain('company name or customer ID');
    expect(dialogDescription).not.toContain('enter a new customer');

    // 3. Search for non-existent customer in the modal
    const searchInput = page.locator('[role="dialog"] input[placeholder*="Type at least"]');
    await searchInput.fill('ZZZZNONEXISTENT999');

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // 4. Check for "Customer not found" message in the modal
    const notFoundMsg = await page.locator('[role="dialog"]').locator('text=Customer not found').isVisible();
    console.log('Customer not found message visible:', notFoundMsg);
    expect(notFoundMsg).toBeTruthy();

    // 5. Check "0 customer(s) found" is NOT visible (we removed it)
    const zeroFoundMsg = await page.locator('text=0 customer(s) found').isVisible();
    console.log('Zero customers found text visible (should be false):', zeroFoundMsg);
    expect(zeroFoundMsg).toBeFalsy();

    console.log('=== ALL VERIFICATIONS PASSED ===');
  });
});
