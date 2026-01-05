import { test, expect } from '@playwright/test';

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/dev-login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('tidihatim@gmail.com');
  await page.getByLabel('Password').fill('Godofwar@3');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
}

test.describe('Master List Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin dashboard shows Master Lists link', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/dashboard\/admin/);

    // Verify Master Lists button exists in Quick Actions
    await expect(page.getByRole('link', { name: /Master Lists/i })).toBeVisible({ timeout: 10000 });
  });

  test('master list page loads for admin', async ({ page }) => {
    // Navigate directly to master list page
    await page.goto('/dashboard/admin/master-list');
    await expect(page).toHaveURL(/\/dashboard\/admin\/master-list/);

    // Verify page heading
    await expect(page.getByRole('heading', { name: /Master List Management/i })).toBeVisible({ timeout: 10000 });

    // Verify description text
    await expect(page.getByText(/Manage dropdown options/i)).toBeVisible();

    // Verify Back to Admin button
    await expect(page.getByRole('link', { name: /Back to Admin/i })).toBeVisible();
  });

  test('master list shows seeded categories', async ({ page }) => {
    await page.goto('/dashboard/admin/master-list');
    await expect(page.getByRole('heading', { name: /Master List Management/i })).toBeVisible({ timeout: 10000 });

    // Verify List Categories section exists
    await expect(page.getByText('List Categories')).toBeVisible();

    // Check for seeded categories (from seed-master-lists.ts)
    await expect(page.getByRole('button', { name: /Industry/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /WearType/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /DurationUnit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ServiceUnit/i })).toBeVisible();
  });

  test('clicking category shows its items', async ({ page }) => {
    await page.goto('/dashboard/admin/master-list');
    await expect(page.getByRole('heading', { name: /Master List Management/i })).toBeVisible({ timeout: 10000 });

    // Click on Industry category
    await page.getByRole('button', { name: /Industry/i }).click();

    // Verify items panel shows Industry Items
    await expect(page.getByText('Industry Items')).toBeVisible({ timeout: 5000 });

    // Check for seeded industry values
    await expect(page.getByText('Mining & Quarrying')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cement')).toBeVisible();
    await expect(page.getByText('Steel & Metal Processing')).toBeVisible();
  });

  test('add item dialog opens', async ({ page }) => {
    await page.goto('/dashboard/admin/master-list');
    await expect(page.getByRole('heading', { name: /Master List Management/i })).toBeVisible({ timeout: 10000 });

    // Select a category first
    await page.getByRole('button', { name: /Industry/i }).click();
    await expect(page.getByText('Industry Items')).toBeVisible({ timeout: 5000 });

    // Click Add Item button
    await page.getByRole('button', { name: /Add Item/i }).click();

    // Verify dialog opens with form fields
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Add New Item' })).toBeVisible();

    // Check for form inputs by placeholder text
    await expect(page.getByPlaceholder(/Mining & Quarrying/i)).toBeVisible();
  });
});
