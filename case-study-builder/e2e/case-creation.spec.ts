import { test, expect } from '@playwright/test';

// Helper function to login before each test
async function login(page: any) {
  await page.goto('/dev-login');
  await page.getByLabel('Email').fill('tidihatim@gmail.com');
  await page.getByLabel('Password').fill('Godofwar@3');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Case Study Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('create APPLICATION case (all steps)', async ({ page }) => {
    // Navigate to new case study page
    await page.goto('/dashboard/new');
    await expect(page.getByRole('heading', { name: /Create New Case Study/i })).toBeVisible();

    // Step 1: Select Case Type - APPLICATION
    await page.getByRole('button', { name: /APPLICATION/i }).click();
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 2: Basic Information
    await page.getByLabel(/Customer Name/i).fill('Test Customer Inc.');
    await page.getByLabel(/Industry/i).fill('Manufacturing');
    await page.getByLabel(/Location/i).fill('Detroit');
    await page.getByLabel(/Country/i).fill('USA');
    await page.getByLabel(/Component.*Workpiece/i).fill('Industrial Valve');

    // Select work type
    await page.getByLabel(/Work Type/i).click();
    await page.getByRole('option', { name: /WORKSHOP/i }).click();

    await page.getByLabel(/Base Metal/i).fill('Carbon Steel');
    await page.getByLabel(/General Dimensions/i).fill('12" x 8" x 6"');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 3: Problem Description
    await page.getByLabel(/Problem Description/i).fill('Excessive wear on valve seats causing frequent replacements');
    await page.getByLabel(/Previous Solution/i).fill('Standard hardfacing with generic alloy');
    await page.getByLabel(/Previous Service Life/i).fill('6 months');
    await page.getByLabel(/Competitor Name/i).fill('Generic Welding Co.');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 4: WA Solution
    await page.getByLabel(/WA Solution/i).fill('Applied WA premium hardfacing alloy with optimized parameters');
    await page.getByLabel(/WA Product/i).fill('WA ProHard 600');
    await page.getByLabel(/Technical Advantages/i).fill('Higher wear resistance and better metallurgical bonding');
    await page.getByLabel(/Expected Service Life/i).fill('24+ months');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 5: Financial & Media
    await page.getByLabel(/Solution Value.*Revenue/i).fill('15000');
    await page.getByLabel(/Annual Potential Revenue/i).fill('50000');
    await page.getByLabel(/Customer Savings/i).fill('20000');

    // Submit the case study
    await page.getByRole('button', { name: /Submit|Create Case Study/i }).click();

    // Verify success message
    await expect(page.getByText(/successfully created|submitted/i)).toBeVisible({ timeout: 10000 });

    // Verify redirect to dashboard or case detail page
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('create TECH case (with WPS)', async ({ page }) => {
    // Navigate to new case study page
    await page.goto('/dashboard/new');

    // Step 1: Select Case Type - TECH
    await page.getByRole('button', { name: /TECH/i }).click();
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 2: Basic Information
    await page.getByLabel(/Customer Name/i).fill('Tech Industries Ltd.');
    await page.getByLabel(/Industry/i).fill('Oil & Gas');
    await page.getByLabel(/Location/i).fill('Houston');
    await page.getByLabel(/Country/i).fill('USA');
    await page.getByLabel(/Component.*Workpiece/i).fill('Pipeline Repair');

    await page.getByLabel(/Work Type/i).click();
    await page.getByRole('option', { name: /ON_SITE/i }).click();

    await page.getByLabel(/Base Metal/i).fill('API 5L X65');
    await page.getByLabel(/General Dimensions/i).fill('24" diameter pipe');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 3: Problem Description
    await page.getByLabel(/Problem Description/i).fill('Corrosion damage requiring structural repair');
    await page.getByLabel(/Previous Solution/i).fill('Traditional welding repair');
    await page.getByLabel(/Previous Service Life/i).fill('3 years');
    await page.getByLabel(/Competitor Name/i).fill('Standard Welding Inc.');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 4: WA Solution
    await page.getByLabel(/WA Solution/i).fill('Advanced welding procedure with specialized filler metal');
    await page.getByLabel(/WA Product/i).fill('WA SuperAlloy 7018');
    await page.getByLabel(/Technical Advantages/i).fill('Superior mechanical properties and corrosion resistance');
    await page.getByLabel(/Expected Service Life/i).fill('10+ years');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 5: Financial & Media
    await page.getByLabel(/Solution Value.*Revenue/i).fill('25000');
    await page.getByLabel(/Annual Potential Revenue/i).fill('75000');
    await page.getByLabel(/Customer Savings/i).fill('50000');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step WPS: Welding Procedure Specification (TECH specific)
    // Base Metal Information
    await page.getByLabel(/Base Metal Type/i).fill('Carbon Steel');
    await page.getByLabel(/Base Metal Grade/i).fill('API 5L X65');
    await page.getByLabel(/Base Metal Thickness/i).fill('12.7 mm');

    // WA Product Details
    await page.getByLabel(/WA Product Name/i).fill('WA SuperAlloy 7018');
    await page.getByLabel(/Product Diameter/i).fill('3.2 mm');

    // Welding Parameters
    await page.getByLabel(/Welding Process/i).fill('SMAW');
    await page.getByLabel(/Current Type/i).fill('DC+');
    await page.getByLabel(/Intensity|Current/i).fill('120-140A');
    await page.getByLabel(/Voltage/i).fill('24-26V');

    // Submit the case study
    await page.getByRole('button', { name: /Submit|Create Case Study/i }).click();

    // Verify success
    await expect(page.getByText(/successfully created|submitted/i)).toBeVisible({ timeout: 10000 });
  });

  test('create STAR case (with Cost Calculator)', async ({ page }) => {
    // Navigate to new case study page
    await page.goto('/dashboard/new');

    // Step 1: Select Case Type - STAR
    await page.getByRole('button', { name: /STAR/i }).click();
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 2: Basic Information
    await page.getByLabel(/Customer Name/i).fill('Star Mining Corp.');
    await page.getByLabel(/Industry/i).fill('Mining');
    await page.getByLabel(/Location/i).fill('Perth');
    await page.getByLabel(/Country/i).fill('Australia');
    await page.getByLabel(/Component.*Workpiece/i).fill('Excavator Bucket');

    await page.getByLabel(/Work Type/i).click();
    await page.getByRole('option', { name: /BOTH/i }).click();

    await page.getByLabel(/Base Metal/i).fill('High Strength Steel');
    await page.getByLabel(/General Dimensions/i).fill('2m x 1.5m');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 3: Problem Description
    await page.getByLabel(/Problem Description/i).fill('Extreme abrasive wear reducing bucket life');
    await page.getByLabel(/Previous Solution/i).fill('Standard wear plate replacement');
    await page.getByLabel(/Previous Service Life/i).fill('4 months');
    await page.getByLabel(/Competitor Name/i).fill('Mining Parts Ltd.');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 4: WA Solution
    await page.getByLabel(/WA Solution/i).fill('Premium overlay hardfacing with optimized microstructure');
    await page.getByLabel(/WA Product/i).fill('WA ChromeCarbide 700');
    await page.getByLabel(/Technical Advantages/i).fill('Exceptional abrasion resistance and impact toughness');
    await page.getByLabel(/Expected Service Life/i).fill('18+ months');
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Step 5: Financial & Media (with cost calculator for STAR)
    await page.getByLabel(/Solution Value.*Revenue/i).fill('75000');
    await page.getByLabel(/Annual Potential Revenue/i).fill('300000');
    await page.getByLabel(/Customer Savings/i).fill('150000');

    // Submit
    await page.getByRole('button', { name: /Submit|Create Case Study/i }).click();

    // Verify success
    await expect(page.getByText(/successfully created|submitted/i)).toBeVisible({ timeout: 10000 });
  });

  test('test draft saving', async ({ page }) => {
    // Navigate to new case study page
    await page.goto('/dashboard/new');

    // Start filling out a case
    await page.getByRole('button', { name: /APPLICATION/i }).click();
    await page.getByRole('button', { name: /Next|Continue/i }).click();

    // Fill partial information
    await page.getByLabel(/Customer Name/i).fill('Draft Test Customer');
    await page.getByLabel(/Industry/i).fill('Test Industry');
    await page.getByLabel(/Location/i).fill('Test City');

    // Save as draft
    await page.getByRole('button', { name: /Save.*Draft/i }).click();

    // Verify draft saved message
    await expect(page.getByText(/draft saved|saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Navigate to saved drafts or my cases
    await page.goto('/dashboard/saved');

    // Verify the draft appears in the list
    await expect(page.getByText(/Draft Test Customer/i)).toBeVisible({ timeout: 5000 });
  });
});
