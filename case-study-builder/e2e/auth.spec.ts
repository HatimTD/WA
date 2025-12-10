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

    // Fill in the login form with default credentials
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');

    // Select CONTRIBUTOR role
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();

    // Submit the form
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for successful navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify we're on the dashboard by checking for dashboard elements
    await expect(page.getByText(/Welcome/i)).toBeVisible({ timeout: 10000 });
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
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);

    // Find and click the user menu/avatar
    await page.getByRole('button', { name: /account|user|profile/i }).click();

    // Click logout button
    await page.getByRole('menuitem', { name: /logout|sign out/i }).click();

    // Verify redirected to login page
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});
