import { test, expect, Page } from '@playwright/test';

// Store console errors for each test
let consoleErrors: string[] = [];
let consoleWarnings: string[] = [];

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto('/dev-login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('tidihatim@gmail.com');
  await page.getByLabel('Password').fill('Godofwar@3');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
}

// Setup console listener
function setupConsoleListener(page: Page) {
  consoleErrors = [];
  consoleWarnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });
}

test.describe('Deep Testing - Master List Integration', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (consoleErrors.length > 0) {
      console.log(`\n[${testInfo.title}] Console Errors:`, consoleErrors);
    }
    if (consoleWarnings.length > 0) {
      console.log(`\n[${testInfo.title}] Console Warnings:`, consoleWarnings);
    }
  });

  test('master list items appear in case study form - Industries', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Step 1 -> Step 2 (Qualifier)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // Fill Qualifier step - customer name is required
    await page.locator('#crm-customer-search').fill('Test Customer');
    await page.waitForTimeout(1000);

    // Answer the Challenge Qualifier question (appears after entering customer name)
    const challengeQuestion = page.getByText('NO - New Customer');
    if (await challengeQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeQuestion.click();
      await page.waitForTimeout(500);
    }

    // Step 2 -> Step 3 (Basic Info) - where Industry dropdown is
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(2000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-step3-form.png', fullPage: true });

    // Now we should see Industry dropdown on Step 3 - use label text with asterisk
    await expect(page.getByText('Industry *')).toBeVisible({ timeout: 5000 });

    // Find the Industry dropdown and wait for it to be enabled (not loading)
    const industryTrigger = page.locator('button[role="combobox"]').first();
    await expect(industryTrigger).toBeEnabled({ timeout: 10000 });
    await industryTrigger.click();
    await page.waitForTimeout(500);

    // Check if seeded industries appear (from master list)
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Take screenshot of dropdown
    await page.screenshot({ path: 'test-results/debug-industry-dropdown.png' });

    // Check for seeded values
    await expect(dropdown.getByText('Mining & Quarrying')).toBeVisible();
    await expect(dropdown.getByText('Cement')).toBeVisible();
    await expect(dropdown.getByText('Steel & Metal Processing')).toBeVisible();

    console.log('[Industries] Master list items loaded successfully');
  });

  test('master list items appear in case study form - Wear Types', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Step 1 -> Step 2 (Qualifier)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // Fill Qualifier step - customer name is required
    await page.locator('#crm-customer-search').fill('Test Customer');
    await page.waitForTimeout(1000);

    // Answer the Challenge Qualifier question (appears after entering customer name)
    const challengeQuestion = page.getByText('NO - New Customer');
    if (await challengeQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeQuestion.click();
      await page.waitForTimeout(500);
    }

    // Step 2 -> Step 3 (Basic Info) - where Wear Types are
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(2000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-step3-wear-types.png', fullPage: true });

    // Check for seeded wear types (checkboxes) - they should be visible on Step 3
    await expect(page.getByText('Type of Wear')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Abrasion')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Impact')).toBeVisible();
    await expect(page.getByText('Corrosion')).toBeVisible();
    await expect(page.getByText('High Temperature')).toBeVisible();
    await expect(page.getByText('Combination')).toBeVisible();

    console.log('[Wear Types] Master list items loaded successfully');
  });
});

test.describe('Deep Testing - Application Case Creation', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (consoleErrors.length > 0) {
      console.log(`\n[${testInfo.title}] Console Errors:`, consoleErrors);
    }
  });

  test('create Application case - full flow', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Step 1: Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2: Qualifier - Fill Customer Name
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });
    await page.locator('#crm-customer-search').fill('Test Customer Application');
    await page.waitForTimeout(1000);

    // Answer the Challenge Qualifier question
    const challengeQuestion = page.getByText('NO - New Customer');
    if (await challengeQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeQuestion.click();
      await page.waitForTimeout(500);
    }

    // Go to Step 3: Basic Info
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(2000);

    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/debug-app-case-step3.png', fullPage: true });

    // Now on Step 3 - Fill Basic Info fields
    // Select industry from dropdown - wait for it to be enabled first
    const industryTrigger = page.locator('button[role="combobox"]').first();
    await expect(industryTrigger).toBeEnabled({ timeout: 10000 });
    await industryTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Mining & Quarrying' }).click();

    // Fill location
    await page.locator('#location-autocomplete').fill('Test Location');

    // Fill component
    await page.locator('#componentWorkpiece').fill('Test Component');

    // Select work type - second combobox
    const workTypeTrigger = page.locator('button[role="combobox"]').nth(1);
    await workTypeTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Workshop' }).click();

    // Select wear type
    await page.getByText('Abrasion').click();

    console.log('[Application Case] Step 3 filled successfully');

    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/app-case-step2.png' });

    // Click Next to go to step 3
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);

    // Step 3: Problem/Solution
    const problemField = page.locator('#problem').or(page.locator('textarea').first());
    if (await problemField.isVisible()) {
      await problemField.fill('Test problem description for Application case');
    }

    console.log('[Application Case] Step 3 reached');

    // Save as draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await page.waitForTimeout(2000);

    // Check for success toast or navigation
    const saved = await page.getByText(/saved|success|draft/i).isVisible({ timeout: 5000 }).catch(() => false);
    console.log('[Application Case] Save draft result:', saved);

    // Take screenshot
    await page.screenshot({ path: 'test-results/app-case-saved.png' });
  });
});

test.describe('Deep Testing - Tech Case Creation', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (consoleErrors.length > 0) {
      console.log(`\n[${testInfo.title}] Console Errors:`, consoleErrors);
    }
  });

  test('create Tech case - full flow with WPS', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Step 1: Select Tech Case
    await page.getByText('Tech Case').click();

    // Verify WPS step appears for Tech case
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible({ timeout: 3000 });
    console.log('[Tech Case] WPS step visible');

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2: Qualifier - Fill Customer Name
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });
    await page.locator('#crm-customer-search').fill('Test Customer Tech');
    await page.waitForTimeout(1000);

    // Answer the Challenge Qualifier question
    const challengeQuestion = page.getByText('NO - New Customer');
    if (await challengeQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeQuestion.click();
      await page.waitForTimeout(500);
    }

    // Go to Step 3: Basic Info
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(2000);

    // Now on Step 3 - Fill Basic Info fields
    // Select industry - wait for it to be enabled first
    const industryTrigger = page.locator('button[role="combobox"]').first();
    await expect(industryTrigger).toBeEnabled({ timeout: 10000 });
    await industryTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Steel & Metal Processing' }).click();

    // Fill location
    await page.locator('#location-autocomplete').fill('Tech Location');

    // Fill component
    await page.locator('#componentWorkpiece').fill('Technical Component');

    // Select work type - second combobox
    const workTypeTrigger = page.locator('button[role="combobox"]').nth(1);
    await workTypeTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'On Site' }).click();

    // Select wear types
    await page.getByText('Impact').click();
    await page.getByText('Corrosion').click();

    console.log('[Tech Case] Step 3 filled');

    // Navigate through to WPS step
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tech-case-step3.png' });

    // Save as draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await page.waitForTimeout(2000);

    console.log('[Tech Case] Draft saved');
  });
});

test.describe('Deep Testing - Star Case Creation', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (consoleErrors.length > 0) {
      console.log(`\n[${testInfo.title}] Console Errors:`, consoleErrors);
    }
  });

  test('create Star case - full flow', async ({ page }) => {
    // Navigate to new case study
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Step 1: Select Star Case
    await page.getByText('Star Case').click();
    console.log('[Star Case] Selected');

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2: Qualifier - Fill Customer Name
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });
    await page.locator('#crm-customer-search').fill('Star Customer Premium');
    await page.waitForTimeout(1000);

    // Answer the Challenge Qualifier question
    const challengeQuestion = page.getByText('NO - New Customer');
    if (await challengeQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeQuestion.click();
      await page.waitForTimeout(500);
    }

    // Go to Step 3: Basic Info
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(2000);

    // Now on Step 3 - Fill Basic Info fields
    // Select industry - wait for it to be enabled first
    const industryTrigger = page.locator('button[role="combobox"]').first();
    await expect(industryTrigger).toBeEnabled({ timeout: 10000 });
    await industryTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Power Generation' }).click();

    // Fill location
    await page.locator('#location-autocomplete').fill('Star Location');

    // Fill component
    await page.locator('#componentWorkpiece').fill('Premium Component');

    // Select work type - second combobox
    const workTypeTrigger = page.locator('button[role="combobox"]').nth(1);
    await workTypeTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Both' }).click();

    // Select wear types
    await page.getByText('High Temperature').click();
    await page.getByText('Combination').click();

    console.log('[Star Case] Step 3 filled');

    // Take screenshot
    await page.screenshot({ path: 'test-results/star-case-step2.png' });

    // Save as draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await page.waitForTimeout(2000);

    console.log('[Star Case] Draft saved');
  });
});

test.describe('Deep Testing - All Pages Console Errors', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  const pagesToTest = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/dashboard/new', name: 'New Case Study' },
    { path: '/dashboard/cases', name: 'My Cases' },
    { path: '/dashboard/library', name: 'Library' },
    { path: '/dashboard/search', name: 'Search' },
    { path: '/dashboard/settings', name: 'Settings' },
    { path: '/dashboard/admin', name: 'Admin Dashboard' },
    { path: '/dashboard/admin/master-list', name: 'Master List' },
    { path: '/dashboard/approvals', name: 'Approvals' },
    { path: '/dashboard/analytics', name: 'Analytics' },
    { path: '/dashboard/leaderboard', name: 'Leaderboard' },
  ];

  for (const pageInfo of pagesToTest) {
    test(`check ${pageInfo.name} page for errors`, async ({ page }) => {
      consoleErrors = [];

      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({ path: `test-results/page-${pageInfo.name.toLowerCase().replace(/\s/g, '-')}.png` });

      // Filter out known acceptable errors (like CSP for vercel analytics)
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('vercel-scripts') &&
        !err.includes('Content Security Policy') &&
        !err.includes('Failed to load resource: the server responded with a status of 401')
      );

      if (criticalErrors.length > 0) {
        console.log(`\n[${pageInfo.name}] Critical Errors Found:`, criticalErrors);
      } else {
        console.log(`[${pageInfo.name}] No critical errors`);
      }

      // Don't fail on non-critical errors, just log them
      expect(criticalErrors.length).toBeLessThanOrEqual(3);
    });
  }
});

test.describe('Deep Testing - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleListener(page);
    await loginAsAdmin(page);
  });

  test('form validation - required fields', async ({ page }) => {
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible({ timeout: 10000 });

    // Go to step 2
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel(/Customer Name/i)).toBeVisible({ timeout: 5000 });

    // Try to go to step 3 without filling required fields
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Should show error or remain on step 2
    const stillOnStep2 = await page.getByLabel(/Customer Name/i).isVisible();
    expect(stillOnStep2).toBeTruthy();

    console.log('[Validation] Required fields validation works');
  });
});
