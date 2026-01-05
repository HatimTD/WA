import { test, expect, Page } from '@playwright/test';

test.setTimeout(90000);

// Helper function to login
async function login(page: Page) {
  await page.goto('/dev-login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
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

    // 1. Check the helper text says correct thing (by name or UID, NOT "enter new customer")
    const helperText = await page.textContent('p:has-text("Search for existing customers")');
    console.log('Helper text:', helperText);
    expect(helperText).toContain('by name or UID');
    expect(helperText).not.toContain('enter a new customer');

    // 2. Search for non-existent customer
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('ZZZZNONEXISTENT999');

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // 3. Check for "Customer does not exist" message
    const notFoundMsg = await page.locator('text=Customer does not exist').isVisible();
    console.log('Customer not found message visible:', notFoundMsg);
    expect(notFoundMsg).toBeTruthy();

    // 4. Check "0 customer(s) found" is NOT visible (we removed it)
    const zeroFoundMsg = await page.locator('text=0 customer(s) found').isVisible();
    console.log('Zero customers found text visible (should be false):', zeroFoundMsg);
    expect(zeroFoundMsg).toBeFalsy();

    console.log('=== ALL VERIFICATIONS PASSED ===');
  });
});
