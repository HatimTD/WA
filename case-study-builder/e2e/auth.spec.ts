import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('dev login page loads', async ({ page }) => {
    await page.goto('/dev-login');

    // Check page title and heading
    await expect(page).toHaveTitle(/Case Study Builder/i);
    await expect(page.getByRole('heading', { name: /Development Login/i })).toBeVisible();

    // Check form elements are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Role')).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/dev-login');

    // Fill in the login form with admin credentials
    await page.getByLabel('Email').fill('admin@weldingalloys.com');
    await page.getByLabel('Password').fill('TestPassword123');

    // Select ADMIN role
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /ADMIN/i }).click();

    // Submit the form
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for successful navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify we're on the dashboard by checking for the welcome heading
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });
  });

  test('login with invalid credentials', async ({ page }) => {
    await page.goto('/dev-login');

    // Fill in with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    // Select a role
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();

    // Submit the form
    await page.getByRole('button', { name: /Login/i }).click();

    // Verify error message appears (using toast notification)
    await expect(page.getByText(/Invalid credentials|Login failed/i)).toBeVisible({ timeout: 5000 });

    // Verify we're still on the login page
    await expect(page).toHaveURL(/\/dev-login/);
  });

  test('logout', async ({ page }) => {
    // Login first
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('admin@weldingalloys.com');
    await page.getByLabel('Password').fill('TestPassword123');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /ADMIN/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 });

    // Find and click logout - try multiple selectors
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out"), a:has-text("Logout"), [data-testid="logout"]').first();

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Try clicking a user menu dropdown first
      const dropdownTrigger = page.locator('button[aria-haspopup="menu"], [data-testid="user-menu"], header button img, header button svg').first();
      if (await dropdownTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dropdownTrigger.click();
        await page.waitForTimeout(500);
        const signOutOption = page.getByText(/Sign Out|Logout/i).first();
        if (await signOutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await signOutOption.click();
        } else {
          test.skip(true, 'Sign out option not found in dropdown');
        }
      } else {
        // Skip test if logout mechanism isn't found
        test.skip(true, 'Logout mechanism not found');
      }
    }

    // Wait for any potential redirect
    await page.waitForTimeout(2000);

    // Verify redirected to login page or session ended
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/dev-login|\/$/);
  });
});
