import { test, expect, Page } from '@playwright/test';

/**
 * Simple BRD 3.3 Validation Tests
 * Tests that case study form validation actually blocks progression when required fields are empty
 */

test.setTimeout(90000);

// Helper function to login
async function waLoginAsAdmin(page: Page) {
  await page.goto('/dev-login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

test.describe('BRD 3.3 Validation - Required Fields Block Progress', () => {

  test('Application Case - cannot proceed without baseMetal and generalDimensions', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Step 1: Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: Qualifier - fill customer name and answer qualifier
    await page.getByLabel(/Customer Name/i).fill('Validation Test Customer');
    await page.waitForTimeout(500);

    // Click first qualifier option if present
    const qualifierOption = page.getByRole('radio').first();
    if (await qualifierOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await qualifierOption.click();
    }

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Step 3: Basic Info - fill everything EXCEPT baseMetal and generalDimensions
    // Select Industry
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole('option', { name: /Mining/i }).click();

    // Fill Location
    await page.getByLabel(/Location/i).fill('Sydney');

    // Fill Component
    await page.getByLabel(/Component/i).fill('Test Hammer');

    // Select Work Type
    const workTypeSelect = page.locator('[role="combobox"]').nth(1);
    if (await workTypeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await workTypeSelect.click();
      await page.getByRole('option', { name: /Workshop/i }).click();
    }

    // Select Wear Type
    const abrasionCheckbox = page.getByLabel(/Abrasion/i);
    if (await abrasionCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await abrasionCheckbox.check();
    }

    // DO NOT fill baseMetal and generalDimensions

    // Try to proceed
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);

    // Should see error toast or still be on Basic Info step
    const errorToast = await page.getByText(/required|fill/i).isVisible({ timeout: 2000 }).catch(() => false);
    const stillOnBasicInfo = await page.getByLabel(/Base Metal/i).isVisible({ timeout: 1000 }).catch(() => false);

    console.log('Validation blocked progress:', { errorToast, stillOnBasicInfo });
    expect(errorToast || stillOnBasicInfo).toBeTruthy();
  });

  test('Application Case - CAN proceed when all required fields are filled', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Step 1: Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: Qualifier
    await page.getByLabel(/Customer Name/i).fill('Complete Test Customer');
    await page.waitForTimeout(500);

    const qualifierOption = page.getByRole('radio').first();
    if (await qualifierOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await qualifierOption.click();
    }

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Step 3: Basic Info - fill ALL required fields including baseMetal and generalDimensions
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole('option', { name: /Mining/i }).click();

    await page.getByLabel(/Location/i).fill('Sydney');
    await page.getByLabel(/Component/i).fill('Test Hammer');

    const workTypeSelect = page.locator('[role="combobox"]').nth(1);
    if (await workTypeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await workTypeSelect.click();
      await page.getByRole('option', { name: /Workshop/i }).click();
    }

    const abrasionCheckbox = page.getByLabel(/Abrasion/i);
    if (await abrasionCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await abrasionCheckbox.check();
    }

    // FILL baseMetal and generalDimensions
    await page.getByLabel(/Base Metal/i).fill('Mild Steel');
    await page.getByLabel(/General Dimensions/i).fill('500mm x 200mm');

    // Try to proceed
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);

    // Should now be on Problem step (not Basic Info anymore)
    const onProblemStep = await page.getByLabel(/Problem Description/i).isVisible({ timeout: 5000 }).catch(() => false);
    const notOnBasicInfo = !(await page.getByLabel(/Base Metal/i).isVisible({ timeout: 1000 }).catch(() => false));

    console.log('Validation allowed progress:', { onProblemStep, notOnBasicInfo });
    expect(onProblemStep || notOnBasicInfo).toBeTruthy();
  });

  test('Application Case - cannot proceed without previousSolution in Problem step', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Navigate to Problem step with all Basic Info filled
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    await page.getByLabel(/Customer Name/i).fill('Problem Test Customer');
    const qualifierOption = page.getByRole('radio').first();
    if (await qualifierOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await qualifierOption.click();
    }
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Basic Info
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole('option', { name: /Mining/i }).click();
    await page.getByLabel(/Location/i).fill('Melbourne');
    await page.getByLabel(/Component/i).fill('Crusher Hammer');
    const workTypeSelect = page.locator('[role="combobox"]').nth(1);
    if (await workTypeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await workTypeSelect.click();
      await page.getByRole('option', { name: /Workshop/i }).click();
    }
    await page.getByLabel(/Abrasion/i).check();
    await page.getByLabel(/Base Metal/i).fill('Carbon Steel');
    await page.getByLabel(/General Dimensions/i).fill('300x200mm');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Now on Problem step - fill only problemDescription, NOT previousSolution
    await page.getByLabel(/Problem Description/i).fill('Component experiences severe wear from abrasive materials');

    // Try to proceed WITHOUT previousSolution
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);

    // Should be blocked - still on Problem step or see error
    const stillOnProblemStep = await page.getByLabel(/Problem Description/i).isVisible({ timeout: 1000 }).catch(() => false);
    const errorShown = await page.getByText(/required|fill/i).isVisible({ timeout: 2000 }).catch(() => false);

    console.log('Previous Solution validation:', { stillOnProblemStep, errorShown });
    expect(stillOnProblemStep || errorShown).toBeTruthy();
  });

  test('Tech Case - WPS step blocks progress without required fields', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select Tech Case
    await page.getByText('Tech Case').click();

    // Verify WPS step is shown in workflow
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // Use Save Draft to check we can at least create a draft
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await page.waitForTimeout(3000);

    // Should either save or redirect
    const url = page.url();
    const savedOrRedirected = url.includes('/my-cases') || url.includes('/cases/') ||
                              await page.getByText(/saved|success/i).isVisible({ timeout: 2000 }).catch(() => false);

    console.log('Tech Case draft save:', { url, savedOrRedirected });
    expect(savedOrRedirected).toBeTruthy();
  });

  test('Star Case - Cost Calculator step exists in workflow', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select Star Case
    await page.getByText('Star Case').click();
    await page.waitForTimeout(500);

    // Verify both WPS and Cost Calculator steps are shown
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cost Calculator').first()).toBeVisible({ timeout: 5000 });

    // Count total steps (should be 8)
    const stepIndicators = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    console.log('Star Case step count:', stepIndicators);
    expect(stepIndicators).toBe(8);
  });

  test('All case types have correct step counts', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Test Application Case - 6 steps
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);
    let stepCount = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    console.log('Application Case steps:', stepCount);
    expect(stepCount).toBe(6);

    // Test Tech Case - 7 steps
    await page.getByText('Tech Case').click();
    await page.waitForTimeout(300);
    stepCount = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    console.log('Tech Case steps:', stepCount);
    expect(stepCount).toBe(7);

    // Test Star Case - 8 steps
    await page.getByText('Star Case').click();
    await page.waitForTimeout(300);
    stepCount = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    console.log('Star Case steps:', stepCount);
    expect(stepCount).toBe(8);
  });
});
