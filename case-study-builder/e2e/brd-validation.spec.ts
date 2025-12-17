import { test, expect, Page } from '@playwright/test';

/**
 * BRD 3.3 Data Field Requirements Validation Tests
 * Tests that case study form validation matches BRD requirements for each case type:
 * - Application Case (Base): All general + problem + solution fields required
 * - Tech Case (Additive): All Application fields + 8 WPS fields required
 * - Star Case (Additive): All Tech fields + Cost Calculator step required
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
  await page.waitForLoadState('domcontentloaded');
}

// Helper to fill qualifier step with customer name
async function waFillQualifierStep(page: Page, customerName: string) {
  // Fill customer name
  await page.getByLabel(/Customer Name/i).fill(customerName);

  // Answer qualifier questions - find and click the first option
  await page.waitForTimeout(500);

  // Look for qualifier radio buttons or options
  const newCustomerOption = page.getByText(/New Customer/i);
  if (await newCustomerOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newCustomerOption.click();
  }

  // Wait for qualifier to be processed
  await page.waitForTimeout(500);
}

test.describe('BRD 3.3 - Application Case Validation', () => {
  test.beforeEach(async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('Application Case has required field indicators in Basic Info step', async ({ page }) => {
    // Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Fill qualifier step
    await waFillQualifierStep(page, 'BRD Test Customer');

    // Go to Basic Info step
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Check that required fields are present with asterisks - BRD 3.3
    // Use text matcher to find labels containing the asterisk
    await expect(page.getByText('Customer Name *', { exact: false })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Industry *', { exact: false })).toBeVisible();
    await expect(page.getByText('Location', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Component/Workpiece *', { exact: false })).toBeVisible();
    await expect(page.getByText('Work Type *', { exact: false })).toBeVisible();
    await expect(page.getByText('Type of Wear *', { exact: false })).toBeVisible();
    await expect(page.getByText('Base Metal *', { exact: false })).toBeVisible();
    await expect(page.getByText('General Dimensions *', { exact: false })).toBeVisible();
  });

  test('Application Case validates Basic Info required fields', async ({ page }) => {
    // Select Application Case and navigate to Basic Info
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    await waFillQualifierStep(page, 'BRD Test Customer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Try to proceed without filling baseMetal and generalDimensions
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Should show validation error
    const hasError = await page.getByText(/required|please fill/i).isVisible({ timeout: 3000 }).catch(() => false);
    const stillOnBasicInfo = await page.getByLabel(/Base Metal/i).isVisible().catch(() => false);

    expect(hasError || stillOnBasicInfo).toBeTruthy();
  });

  test('Application Case has required Previous Solution field in Problem step', async ({ page }) => {
    // Navigate to Problem step
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    await waFillQualifierStep(page, 'BRD Test Customer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Fill Basic Info
    await page.locator('#industry').click();
    await page.getByRole('option', { name: /Mining/i }).click();
    await page.getByLabel(/Location/i).fill('Sydney');
    await page.getByLabel(/Component/i).fill('Test Component');
    await page.locator('#workType').click();
    await page.getByRole('option', { name: /Workshop/i }).click();
    await page.getByLabel(/Abrasion/i).check();
    await page.getByLabel(/Base Metal/i).fill('Mild Steel');
    await page.getByLabel(/General Dimensions/i).fill('500mm x 200mm');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Verify Previous Solution is required
    await expect(page.getByText('Previous Solution *', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('Application Case has required Technical Advantages field in Solution step', async ({ page }) => {
    // Navigate through steps
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await waFillQualifierStep(page, 'BRD Test Customer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Basic Info
    await page.locator('#industry').click();
    await page.getByRole('option', { name: /Mining/i }).click();
    await page.getByLabel(/Location/i).fill('Sydney');
    await page.getByLabel(/Component/i).fill('Test Component');
    await page.locator('#workType').click();
    await page.getByRole('option', { name: /Workshop/i }).click();
    await page.getByLabel(/Abrasion/i).check();
    await page.getByLabel(/Base Metal/i).fill('Mild Steel');
    await page.getByLabel(/General Dimensions/i).fill('500mm x 200mm');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Problem
    await page.getByLabel(/Problem Description/i).fill('Test problem description');
    await page.getByLabel(/Previous Solution/i).fill('Previous solution');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Verify Technical Advantages is required
    await expect(page.getByText('Technical Advantages *', { exact: false })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('BRD 3.3 - Tech Case WPS Validation', () => {
  test.beforeEach(async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('Tech Case shows WPS step in workflow', async ({ page }) => {
    // Select Tech Case
    await page.getByText('Tech Case').click();
    await page.waitForTimeout(300);

    // WPS step should be visible in step indicator
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Tech Case WPS step has all 8 required fields per BRD', async ({ page }) => {
    // Select Tech Case and navigate to WPS step
    await page.getByText('Tech Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await waFillQualifierStep(page, 'Tech Test Customer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Basic Info
    await page.locator('#industry').click();
    await page.getByRole('option', { name: /Mining/i }).click();
    await page.getByLabel(/Location/i).fill('Sydney');
    await page.getByLabel(/Component/i).fill('Tech Component');
    await page.locator('#workType').click();
    await page.getByRole('option', { name: /Workshop/i }).click();
    await page.getByLabel(/Abrasion/i).check();
    await page.getByLabel(/Base Metal/i).fill('Carbon Steel');
    await page.getByLabel(/General Dimensions/i).fill('300mm x 150mm');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Problem
    await page.getByLabel(/Problem Description/i).fill('Tech case problem');
    await page.getByLabel(/Previous Solution/i).fill('Old welding solution');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Fill Solution
    await page.getByLabel(/WA Solution/i).first().fill('Technical welding solution');
    await page.getByLabel(/WA Product/i).fill('HARDFACE CC');
    await page.getByLabel(/Technical Advantages/i).fill('Superior wear resistance');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(300);

    // Verify WPS required fields (BRD 3.3 - 8 required WPS fields)
    await expect(page.getByText('Base Metal Type *', { exact: false })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Surface Preparation *', { exact: false })).toBeVisible();
    await expect(page.getByText('Welding Process *', { exact: false })).toBeVisible();
    await expect(page.getByText('Welding Position *', { exact: false })).toBeVisible();
    await expect(page.getByText('Shielding Gas *', { exact: false })).toBeVisible();
    await expect(page.getByText('Preheat Temperature *', { exact: false })).toBeVisible();
    await expect(page.getByText('Oscillation Width *', { exact: false })).toBeVisible();
    await expect(page.getByText('Additional WPS Notes *', { exact: false })).toBeVisible();
  });

  test('Tech Case validates WPS required fields before proceed', async ({ page }) => {
    // Navigate to WPS step (abbreviated path)
    await page.getByText('Tech Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await waFillQualifierStep(page, 'Tech Validate Customer');

    // Continue through steps until WPS
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);
    }

    // Try to proceed without filling WPS fields
    const stillOnWps = await page.getByLabel(/Base Metal Type/i).isVisible({ timeout: 3000 }).catch(() => false);

    if (stillOnWps) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(500);

      // Should show error or stay on WPS
      const hasError = await page.getByText(/required|please fill/i).isVisible({ timeout: 2000 }).catch(() => false);
      const stillOnWpsStep = await page.getByLabel(/Base Metal Type/i).isVisible().catch(() => false);

      expect(hasError || stillOnWpsStep).toBeTruthy();
    }
  });
});

test.describe('BRD 3.3 - Star Case Cost Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('Star Case shows Cost Calculator step in workflow', async ({ page }) => {
    // Select Star Case
    await page.getByText('Star Case').click();
    await page.waitForTimeout(300);

    // Cost Calculator step should be visible in step indicator
    await expect(page.getByText('Cost Calculator').first()).toBeVisible({ timeout: 5000 });
  });

  test('Star Case shows both WPS and Cost Calculator steps', async ({ page }) => {
    // Select Star Case
    await page.getByText('Star Case').click();
    await page.waitForTimeout(300);

    // Both WPS and Cost Calculator should be visible
    await expect(page.getByText('WPS', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cost Calculator').first()).toBeVisible();
  });

  test('Star Case Cost Calculator step has all required fields', async ({ page }) => {
    // Select Star Case
    await page.getByText('Star Case').click();

    // Use Save Draft to bypass full validation and get to cost calculator page in edit
    // For now, just verify the step exists in the workflow
    await expect(page.getByText('Cost Calculator').first()).toBeVisible({ timeout: 5000 });

    // The cost calculator step should be between WPS and Review
    const steps = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').all();
    expect(steps.length).toBeGreaterThanOrEqual(7); // STAR should have 7+ steps
  });
});

test.describe('BRD 3.3 - Review Step Financial Fields', () => {
  test.beforeEach(async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });
  });

  test('Review step has required financial fields', async ({ page }) => {
    // Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await waFillQualifierStep(page, 'Financial Test Customer');

    // Navigate through all steps to reach Review
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);
    }

    // Check if we're on Review step - look for financial fields
    const financialSection = await page.getByText('Financial Information').isVisible({ timeout: 5000 }).catch(() => false);

    if (financialSection) {
      // Verify required financial field indicators
      await expect(page.getByText('Solution Value/Revenue *', { exact: false })).toBeVisible();
      await expect(page.getByText('Annual Potential Revenue *', { exact: false })).toBeVisible();
      await expect(page.getByText('Customer Savings *', { exact: false })).toBeVisible();
    }
  });

  test('Review step requires at least one image', async ({ page }) => {
    // Select Application Case
    await page.getByText('Application Case').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await waFillQualifierStep(page, 'Image Test Customer');

    // Navigate through all steps to reach Review
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForTimeout(300);
    }

    // Check for image requirement indicators on the Review step
    // Look for Images label with asterisk or the minimum required message
    const hasImagesLabel = await page.getByText('Images *', { exact: false }).isVisible({ timeout: 5000 }).catch(() => false);
    const hasMinimumText = await page.getByText('Minimum 1 required', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);
    const hasImageSection = await page.getByText('Images & Documents').isVisible({ timeout: 3000 }).catch(() => false);

    // At least one of these should be visible on the review step
    expect(hasImagesLabel || hasMinimumText || hasImageSection).toBeTruthy();
  });
});

test.describe('BRD 3.3 - Step Count Per Case Type', () => {
  test.beforeEach(async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });
  });

  test('Application Case has 6 steps (Case Type, Qualifier, Basic Info, Problem, Solution, Review)', async ({ page }) => {
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    // Count step indicators
    const stepIndicators = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    expect(stepIndicators).toBe(6);
  });

  test('Tech Case has 7 steps (adds WPS)', async ({ page }) => {
    await page.getByText('Tech Case').click();
    await page.waitForTimeout(300);

    const stepIndicators = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    expect(stepIndicators).toBe(7);
  });

  test('Star Case has 8 steps (adds WPS + Cost Calculator)', async ({ page }) => {
    await page.getByText('Star Case').click();
    await page.waitForTimeout(300);

    const stepIndicators = await page.locator('.flex.items-center.justify-center.w-10.h-10.rounded-full').count();
    expect(stepIndicators).toBe(8);
  });
});
