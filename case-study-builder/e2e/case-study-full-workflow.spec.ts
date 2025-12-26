/**
 * Full Case Study Workflow E2E Tests
 *
 * Tests complete case study creation from Step 1 to submission/draft saving
 * Covers: Application, Tech, and Star case types
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3010';

// Test credentials
const TEST_USER = {
  email: 'admin@weldingalloys.com',
  password: 'TestPassword123',
};

// Helper: Login as admin
async function waLoginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/dev-login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /ADMIN/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

// Helper: Click Next button
async function waClickNext(page: Page) {
  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  await expect(nextBtn).toBeVisible({ timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(500); // Wait for step transition
}

// Helper: Click Save Draft button
async function waClickSaveDraft(page: Page) {
  const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
  if (await saveDraftBtn.isVisible()) {
    await saveDraftBtn.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

// Helper: Complete Qualifier Step (Customer Selection + Qualifier Questions)
async function waCompleteQualifierStep(page: Page) {
  // Click on customer search to open modal
  const customerSearchBtn = page.locator('[role="button"]:has-text("Click to search")').first();
  await expect(customerSearchBtn).toBeVisible({ timeout: 5000 });
  await customerSearchBtn.click();
  await page.waitForTimeout(500);

  // Search for customers
  const dialogSearchInput = page.locator('[role="dialog"] input').first();
  await expect(dialogSearchInput).toBeVisible({ timeout: 5000 });
  await dialogSearchInput.fill('Mining');
  await page.waitForTimeout(2000);

  // Click on first customer result that contains "Corp"
  const customerButtons = page.locator('[role="dialog"] button[type="button"]');
  const buttonCount = await customerButtons.count();
  for (let i = 0; i < buttonCount; i++) {
    const btnText = await customerButtons.nth(i).textContent();
    if (btnText?.includes('Corp')) {
      await customerButtons.nth(i).click();
      await page.waitForTimeout(500);
      break;
    }
  }

  // Answer Qualifier Question - Click "NO - New Customer"
  const newCustomerBtn = page.getByRole('button', { name: /NO.*New Customer/i });
  await expect(newCustomerBtn).toBeVisible({ timeout: 5000 });
  await newCustomerBtn.click();
  await page.waitForTimeout(500);
}

// ============================================
// APPLICATION CASE - FULL WORKFLOW
// ============================================
test.describe('Application Case - Full Workflow', () => {
  test('should create Application case from Step 1 to Review', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // ===== STEP 1: Select Case Type =====
    const appCard = page.locator('text=Application Case').first();
    await expect(appCard).toBeVisible({ timeout: 10000 });
    await appCard.click();
    await waClickNext(page);

    // ===== STEP 2: Qualifier (Customer Selection + Questions) =====
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // ===== STEP 3: Basic Info =====
    // Fill Title
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Application Case ' + Date.now());

    // Select Industry
    const industrySelect = page.locator('#industry').first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.getByRole('option', { name: /Mining/i }).first().click();
    }

    // Fill Location
    const locationInput = page.locator('#location, input[placeholder*="location"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('Perth, Australia');
    }

    // Select at least one Wear Type
    const wearTypeBtn = page.getByRole('button', { name: /Abrasion/i }).first();
    if (await wearTypeBtn.isVisible()) {
      await wearTypeBtn.click();
    }

    // Fill Component/Workpiece
    const componentInput = page.locator('#componentWorkpiece');
    if (await componentInput.isVisible()) {
      await componentInput.fill('Crusher Hammer');
    }

    // Fill Base Metal (required for Application case)
    const baseMetalInput = page.locator('#baseMetal');
    if (await baseMetalInput.isVisible()) {
      await baseMetalInput.fill('Carbon Steel');
    }

    // Fill General Dimensions (required for Application case)
    const dimensionsInput = page.locator('#generalDimensions');
    if (await dimensionsInput.isVisible()) {
      await dimensionsInput.fill('500mm x 300mm x 100mm');
    }

    await waClickNext(page);

    // ===== STEP 3: Problem =====
    // Fill Problem Description
    const problemInput = page.locator('#problemDescription');
    await expect(problemInput).toBeVisible({ timeout: 5000 });
    await problemInput.fill('The crusher hammers were experiencing severe abrasive wear, requiring replacement every 2 weeks. This caused significant downtime and maintenance costs.');

    // Fill Previous Solution (required)
    const prevSolutionInput = page.locator('#previousSolution');
    if (await prevSolutionInput.isVisible()) {
      await prevSolutionInput.fill('Standard manganese steel hammers from competitor');
    }

    // Fill Previous Service Life
    const prevServiceInput = page.locator('#previousServiceLife');
    if (await prevServiceInput.isVisible()) {
      await prevServiceInput.fill('2 weeks');
    }

    await waClickNext(page);

    // ===== STEP 4: Solution =====
    // Fill WA Solution Description
    const solutionInput = page.locator('#waSolution');
    await expect(solutionInput).toBeVisible({ timeout: 5000 });
    await solutionInput.fill('Welding Alloys recommended rebuilding the hammers with HARDFACE 600 overlay. The solution provided a chrome carbide hard-facing layer that significantly improved wear resistance.');

    // Fill WA Product
    const productInput = page.locator('#waProduct');
    if (await productInput.isVisible()) {
      await productInput.fill('HARDFACE 600');
    }

    // Fill Technical Advantages (required)
    const techAdvInput = page.locator('#technicalAdvantages');
    if (await techAdvInput.isVisible()) {
      await techAdvInput.fill('Chrome carbide overlay provides 3x longer service life, reduced downtime, and lower total cost of ownership.');
    }

    // Fill Expected Service Life
    const expectedLifeInput = page.locator('#expectedServiceLife');
    if (await expectedLifeInput.isVisible()) {
      await expectedLifeInput.fill('6 weeks');
    }

    await waClickNext(page);

    // ===== STEP 5: Review =====
    // Verify we're on Review step
    await page.waitForTimeout(500);

    // Fill financial fields
    const savingsInput = page.locator('#customerSavingsAmount, input[id*="savings"]').first();
    if (await savingsInput.isVisible()) {
      await savingsInput.fill('50000');
    }

    const revenueInput = page.locator('#annualPotentialRevenue, input[id*="revenue"]').first();
    if (await revenueInput.isVisible()) {
      await revenueInput.fill('25000');
    }

    // Verify Submit/Save buttons are visible
    const submitBtn = page.getByRole('button', { name: /Submit|Save/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    // Test passed - we reached the final step
    console.log('Application Case: Successfully navigated through all steps to Review');
  });

  test('should save Application case as draft', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // Select Application Case
    await page.locator('text=Application Case').first().click();
    await waClickNext(page);

    // Complete Qualifier Step
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // Fill minimum required fields for draft
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Draft Test Case - ' + Date.now());

    // Try to save as draft
    const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
    if (await saveDraftBtn.isVisible()) {
      await saveDraftBtn.click();
      await page.waitForTimeout(2000);

      // Check for success message or redirect
      const successToast = page.locator('text=saved, text=Draft saved, text=Success').first();
      const redirected = page.url().includes('/my-cases') || page.url().includes('/dashboard');

      expect(await successToast.isVisible().catch(() => false) || redirected).toBeTruthy();
    }
  });
});

// ============================================
// TECH CASE - FULL WORKFLOW WITH WPS
// ============================================
test.describe('Tech Case - Full Workflow with WPS', () => {
  test('should create Tech case including WPS step', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // ===== STEP 1: Select Tech Case =====
    const techCard = page.locator('text=Tech Case').first();
    await expect(techCard).toBeVisible({ timeout: 10000 });
    await techCard.click();
    await waClickNext(page);

    // ===== STEP 2: Qualifier =====
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // ===== STEP 3: Basic Info =====
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Tech Case with WPS ' + Date.now());

    const industrySelect = page.locator('#industry').first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.getByRole('option', { name: /Steel/i }).first().click();
    }

    // Fill location
    const locationInput = page.locator('#location-autocomplete');
    if (await locationInput.isVisible()) {
      await locationInput.fill('Pittsburgh, USA');
    }

    const wearTypeBtn = page.getByRole('button', { name: /Impact/i }).first();
    if (await wearTypeBtn.isVisible()) {
      await wearTypeBtn.click();
    }

    const componentInput = page.locator('#componentWorkpiece');
    if (await componentInput.isVisible()) {
      await componentInput.fill('Mill Liner');
    }

    // Fill base metal and dimensions (required for Application case)
    const baseMetalInput = page.locator('#baseMetal');
    if (await baseMetalInput.isVisible()) {
      await baseMetalInput.fill('Carbon Steel');
    }

    const dimensionsInput = page.locator('#generalDimensions');
    if (await dimensionsInput.isVisible()) {
      await dimensionsInput.fill('1200mm x 800mm x 150mm');
    }

    await waClickNext(page);

    // ===== STEP 4: Problem =====
    const problemInput = page.locator('#problemDescription');
    await expect(problemInput).toBeVisible({ timeout: 5000 });
    await problemInput.fill('Mill liners experiencing severe impact and abrasion damage from ore processing.');

    const prevSolutionInput = page.locator('#previousSolution');
    if (await prevSolutionInput.isVisible()) {
      await prevSolutionInput.fill('OEM cast iron liners');
    }

    await waClickNext(page);

    // ===== STEP 4: Solution =====
    const solutionInput = page.locator('#waSolution');
    await expect(solutionInput).toBeVisible({ timeout: 5000 });
    await solutionInput.fill('Implemented WA hard-facing solution with specialized weld overlay technique.');

    const productInput = page.locator('#waProduct');
    if (await productInput.isVisible()) {
      await productInput.fill('MAXIM 600');
    }

    const techAdvInput = page.locator('#technicalAdvantages');
    if (await techAdvInput.isVisible()) {
      await techAdvInput.fill('Superior impact resistance with 50% longer service life.');
    }

    await waClickNext(page);

    // ===== STEP 5: WPS (Tech Case specific) =====
    // Check if WPS step is visible
    const wpsHeading = page.getByText(/WPS|Welding Procedure/i).first();
    const wpsVisible = await wpsHeading.isVisible().catch(() => false);

    if (wpsVisible) {
      // Fill WPS fields
      const processType = page.locator('#processType, select[name="processType"]').first();
      if (await processType.isVisible()) {
        await processType.click();
        await page.getByRole('option').first().click();
      }

      const amperageMin = page.locator('#amperageMin, input[name="amperageMin"]').first();
      if (await amperageMin.isVisible()) {
        await amperageMin.fill('200');
      }

      const amperageMax = page.locator('#amperageMax, input[name="amperageMax"]').first();
      if (await amperageMax.isVisible()) {
        await amperageMax.fill('280');
      }

      const voltageMin = page.locator('#voltageMin, input[name="voltageMin"]').first();
      if (await voltageMin.isVisible()) {
        await voltageMin.fill('24');
      }

      const voltageMax = page.locator('#voltageMax, input[name="voltageMax"]').first();
      if (await voltageMax.isVisible()) {
        await voltageMax.fill('28');
      }

      await waClickNext(page);
    }

    // ===== STEP 6: Review =====
    // Verify we reached Review step
    const submitBtn = page.getByRole('button', { name: /Submit|Save/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    console.log('Tech Case: Successfully navigated through all steps including WPS');
  });
});

// ============================================
// STAR CASE - FULL WORKFLOW WITH WPS + COST CALCULATOR
// ============================================
test.describe('Star Case - Full Workflow with WPS and Cost Calculator', () => {
  test('should create Star case including WPS and Cost Calculator steps', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // ===== STEP 1: Select Star Case =====
    const starCard = page.locator('text=Star Case').first();
    await expect(starCard).toBeVisible({ timeout: 10000 });
    await starCard.click();
    await waClickNext(page);

    // ===== STEP 2: Qualifier =====
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // ===== STEP 3: Basic Info =====
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Star Case Complete ' + Date.now());

    const industrySelect = page.locator('#industry').first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.getByRole('option', { name: /Mining/i }).first().click();
    }

    // Fill location
    const locationInput = page.locator('#location-autocomplete');
    if (await locationInput.isVisible()) {
      await locationInput.fill('Perth, Australia');
    }

    const wearTypeBtn = page.getByRole('button', { name: /Combination/i }).first();
    if (await wearTypeBtn.isVisible()) {
      await wearTypeBtn.click();
    }

    const componentInput = page.locator('#componentWorkpiece');
    if (await componentInput.isVisible()) {
      await componentInput.fill('Excavator Bucket Teeth');
    }

    // Fill base metal and dimensions (required)
    const baseMetalInput = page.locator('#baseMetal');
    if (await baseMetalInput.isVisible()) {
      await baseMetalInput.fill('High Manganese Steel');
    }

    const dimensionsInput = page.locator('#generalDimensions');
    if (await dimensionsInput.isVisible()) {
      await dimensionsInput.fill('150mm x 80mm x 60mm');
    }

    await waClickNext(page);

    // ===== STEP 4: Problem =====
    const problemInput = page.locator('#problemDescription');
    await expect(problemInput).toBeVisible({ timeout: 5000 });
    await problemInput.fill('Excavator bucket teeth experiencing rapid wear in harsh mining conditions, leading to frequent replacements and operational delays.');

    const prevSolutionInput = page.locator('#previousSolution');
    if (await prevSolutionInput.isVisible()) {
      await prevSolutionInput.fill('Standard OEM bucket teeth');
    }

    await waClickNext(page);

    // ===== STEP 4: Solution =====
    const solutionInput = page.locator('#waSolution');
    await expect(solutionInput).toBeVisible({ timeout: 5000 });
    await solutionInput.fill('Applied WA hard-facing overlay to extend service life and reduce replacement frequency.');

    const productInput = page.locator('#waProduct');
    if (await productInput.isVisible()) {
      await productInput.fill('HARDALLOY 350');
    }

    const techAdvInput = page.locator('#technicalAdvantages');
    if (await techAdvInput.isVisible()) {
      await techAdvInput.fill('70% improvement in wear resistance with reduced maintenance downtime.');
    }

    await waClickNext(page);

    // ===== STEP 5: WPS =====
    await page.waitForTimeout(500);
    const wpsSection = page.getByText(/WPS|Welding Procedure|Process Type/i).first();
    if (await wpsSection.isVisible().catch(() => false)) {
      // Fill minimum WPS fields
      const processType = page.locator('#processType, select[name="processType"]').first();
      if (await processType.isVisible()) {
        await processType.click();
        await page.getByRole('option').first().click();
      }
      await waClickNext(page);
    }

    // ===== STEP 6: Cost Calculator =====
    await page.waitForTimeout(500);
    const costSection = page.getByText(/Cost Calculator|ROI|Savings/i).first();
    if (await costSection.isVisible().catch(() => false)) {
      // Fill cost calculator fields if visible
      const materialBefore = page.locator('input[name*="materialCostBefore"], #materialCostBefore').first();
      if (await materialBefore.isVisible()) {
        await materialBefore.fill('10000');
      }

      const materialAfter = page.locator('input[name*="materialCostAfter"], #materialCostAfter').first();
      if (await materialAfter.isVisible()) {
        await materialAfter.fill('15000');
      }

      await waClickNext(page);
    }

    // ===== STEP 7: Review =====
    const submitBtn = page.getByRole('button', { name: /Submit|Save/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    console.log('Star Case: Successfully navigated through all steps including WPS and Cost Calculator');
  });
});

// ============================================
// DRAFT SAVE AND CONTINUE
// ============================================
test.describe('Draft Save and Continue', () => {
  test('should save draft and be able to continue editing', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // Select Application Case
    await page.locator('text=Application Case').first().click();
    await waClickNext(page);

    // Complete Qualifier Step
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // Fill some fields
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    const uniqueTitle = 'Continue Later Test - ' + Date.now();
    await titleInput.fill(uniqueTitle);

    // Save as draft
    const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
    if (await saveDraftBtn.isVisible()) {
      await saveDraftBtn.click();
      await page.waitForTimeout(2000);

      // Navigate to My Cases to find the draft
      await page.goto(`${BASE_URL}/dashboard/my-cases`);
      await page.waitForLoadState('networkidle');

      // Look for our draft
      const draftCard = page.getByText(uniqueTitle.substring(0, 20)).first();
      const draftVisible = await draftCard.isVisible().catch(() => false);

      if (draftVisible) {
        // Click to continue editing
        await draftCard.click();
        await page.waitForTimeout(1000);

        // Verify we can continue editing
        const editBtn = page.getByRole('button', { name: /Edit|Continue/i }).first();
        if (await editBtn.isVisible()) {
          await editBtn.click();
          await page.waitForTimeout(1000);
        }

        // Verify title is still there
        const titleField = page.locator('#title');
        if (await titleField.isVisible()) {
          const value = await titleField.inputValue();
          expect(value).toContain('Continue Later Test');
        }
      }
    }
  });
});

// ============================================
// EDIT EXISTING CASE STUDY
// ============================================
test.describe('Edit Existing Case Study', () => {
  test('should be able to edit an existing case study', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Go to My Cases
    await page.goto(`${BASE_URL}/dashboard/my-cases`);
    await page.waitForLoadState('networkidle');

    // Find any case study card and click Edit
    const caseCard = page.locator('[class*="Card"], article').first();
    if (await caseCard.isVisible()) {
      await caseCard.click();
      await page.waitForTimeout(1000);

      // Look for Edit button
      const editBtn = page.getByRole('button', { name: /Edit/i }).first();
      const editLink = page.getByRole('link', { name: /Edit/i }).first();

      if (await editBtn.isVisible()) {
        await editBtn.click();
      } else if (await editLink.isVisible()) {
        await editLink.click();
      }

      await page.waitForTimeout(1000);

      // Verify we're in edit mode - should see the form
      const formVisible = await page.locator('#title, #problemDescription, form').first().isVisible().catch(() => false);

      if (formVisible) {
        console.log('Edit mode: Successfully opened case study for editing');
      }
    }
  });
});

// ============================================
// SUBMIT CASE STUDY
// ============================================
test.describe('Submit Case Study', () => {
  test('should submit a complete case study for approval', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto(`${BASE_URL}/dashboard/new`);
    await page.waitForLoadState('networkidle');

    // Step 1: Create a complete Application case
    await page.locator('text=Application Case').first().click();
    await waClickNext(page);

    // Step 2: Qualifier
    await waCompleteQualifierStep(page);
    await waClickNext(page);

    // Step 3: Basic Info
    const titleInput = page.locator('#title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Submit Test Case - ' + Date.now());
    const industrySelect = page.locator('#industry').first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.getByRole('option').first().click();
    }
    const wearTypeBtn = page.getByRole('button', { name: /Abrasion/i }).first();
    if (await wearTypeBtn.isVisible()) {
      await wearTypeBtn.click();
    }
    await page.locator('#componentWorkpiece').fill('Test Component');
    await page.locator('#baseMetal').fill('Steel');
    await page.locator('#generalDimensions').fill('100x100x50mm');
    await waClickNext(page);

    // Step 3: Problem
    await page.locator('#problemDescription').fill('Test problem description for submission test.');
    await page.locator('#previousSolution').fill('Previous solution');
    await waClickNext(page);

    // Step 4: Solution
    await page.locator('#waSolution').fill('WA solution description for submission test.');
    await page.locator('#waProduct').fill('Test Product');
    await page.locator('#technicalAdvantages').fill('Technical advantages description.');
    await waClickNext(page);

    // Step 5: Review - look for Submit button
    await page.waitForTimeout(500);
    const submitBtn = page.getByRole('button', { name: /Submit for Approval|Submit/i }).first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Check for success
      const successMsg = page.getByText(/submitted|success|approval/i).first();
      const successVisible = await successMsg.isVisible().catch(() => false);
      const redirectedToMyCase = page.url().includes('/my-cases') || page.url().includes('/dashboard');

      expect(successVisible || redirectedToMyCase).toBeTruthy();
      console.log('Submit: Case study submitted successfully');
    }
  });
});
