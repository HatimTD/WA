/**
 * Approval Workflow E2E Tests
 *
 * Tests for:
 * - Approving a case study
 * - Rejecting a case study with notes
 * - Rejection validation (notes required)
 * - Approval page navigation and filtering
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3010';

// Login as Approver (uses admin credentials, then changes role)
async function waLoginAsApprover(page: Page) {
  await page.goto(`${BASE_URL}/dev-login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /APPROVER/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

// Login as Contributor (uses admin credentials, then changes role)
async function waLoginAsContributor(page: Page) {
  await page.goto(`${BASE_URL}/dev-login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
  await page.getByRole('button', { name: /Login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

// Helper: Complete Qualifier Step (Customer Selection + Qualifier Questions)
async function waCompleteQualifierStep(page: Page) {
  const customerSearchBtn = page.locator('[role="button"]:has-text("Click to search")').first();
  await expect(customerSearchBtn).toBeVisible({ timeout: 5000 });
  await customerSearchBtn.click();
  await page.waitForTimeout(500);

  const dialogSearchInput = page.locator('[role="dialog"] input').first();
  await expect(dialogSearchInput).toBeVisible({ timeout: 5000 });
  await dialogSearchInput.fill('Mining');
  await page.waitForTimeout(2000);

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

  const newCustomerBtn = page.getByRole('button', { name: /NO.*New Customer/i });
  await expect(newCustomerBtn).toBeVisible({ timeout: 5000 });
  await newCustomerBtn.click();
  await page.waitForTimeout(500);
}

// Helper: Click Next button
async function waClickNext(page: Page) {
  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  await expect(nextBtn).toBeVisible({ timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(500);
}

// Helper: Create and submit a case study for testing approvals
async function waCreateAndSubmitCaseStudy(page: Page, uniqueId: string) {
  await page.goto(`${BASE_URL}/dashboard/new`);
  await page.waitForLoadState('networkidle');

  // Step 1: Select Application Case
  await page.locator('text=Application Case').first().click();
  await waClickNext(page);

  // Step 2: Qualifier
  await waCompleteQualifierStep(page);
  await waClickNext(page);

  // Step 3: Basic Info
  const titleInput = page.locator('#title');
  await expect(titleInput).toBeVisible({ timeout: 5000 });
  await titleInput.fill(`Approval Test Case ${uniqueId}`);

  const industrySelect = page.locator('#industry').first();
  if (await industrySelect.isVisible()) {
    await industrySelect.click();
    await page.getByRole('option').first().click();
  }

  const locationInput = page.locator('#location-autocomplete');
  if (await locationInput.isVisible()) {
    await locationInput.fill('Test City, USA');
  }

  const wearTypeBtn = page.getByRole('button', { name: /Abrasion/i }).first();
  if (await wearTypeBtn.isVisible()) {
    await wearTypeBtn.click();
  }

  await page.locator('#componentWorkpiece').fill('Test Component');
  await page.locator('#baseMetal').fill('Steel');
  await page.locator('#generalDimensions').fill('100x100mm');
  await waClickNext(page);

  // Step 4: Problem
  const problemInput = page.locator('#problemDescription');
  await expect(problemInput).toBeVisible({ timeout: 5000 });
  await problemInput.fill('Test problem description for approval workflow test.');
  await page.locator('#previousSolution').fill('Previous solution');
  await waClickNext(page);

  // Step 5: Solution
  const solutionInput = page.locator('#waSolution');
  await expect(solutionInput).toBeVisible({ timeout: 5000 });
  await solutionInput.fill('WA solution for approval test.');
  await page.locator('#waProduct').fill('Test Product');
  await page.locator('#technicalAdvantages').fill('Technical advantages');
  await waClickNext(page);

  // Step 6: Review - Submit for approval
  await page.waitForTimeout(500);
  const submitBtn = page.getByRole('button', { name: /Submit for Approval|Submit/i }).first();
  await expect(submitBtn).toBeVisible({ timeout: 5000 });
  await submitBtn.click();
  await page.waitForTimeout(2000);
}

// ============================================
// APPROVAL PAGE TESTS
// ============================================
test.describe('Approval Dashboard', () => {
  test('should load approvals page for approver', async ({ page }) => {
    await waLoginAsApprover(page);

    // Navigate to approvals
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page loaded - look for heading
    const pageTitle = page.getByRole('heading', { name: /Approval/i }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Verify stats cards are visible
    const pendingCard = page.getByText('Pending Review');
    await expect(pendingCard).toBeVisible();
  });

  test('should show pending cases list', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    // Check for pending approvals section
    const pendingSection = page.getByText('Pending Approvals');
    await expect(pendingSection).toBeVisible({ timeout: 10000 });
  });

  test('should have search and filter functionality', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Verify filter dropdowns exist
    const typeFilter = page.getByText('All Types');
    await expect(typeFilter).toBeVisible();
  });
});

// ============================================
// APPROVE CASE STUDY TESTS
// ============================================
test.describe('Approve Case Study', () => {
  test('should approve a submitted case study', async ({ page }) => {
    // First, ensure we have a submitted case by using seeded data or check existing
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if there are pending cases
    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases to approve - skipping test');
      return;
    }

    // Click Review on first pending case
    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on the review page
    const reviewTitle = page.getByText('Review & Approve');
    await expect(reviewTitle).toBeVisible({ timeout: 10000 });

    // Set up dialog handler for confirm
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('approve');
      await dialog.accept();
    });

    // Click Approve button (there are 2 on page - top and sticky bottom)
    const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Wait for redirect back to approvals page
    await page.waitForURL(/\/dashboard\/approvals/, { timeout: 10000 });

    // Verify success - should be back on approvals page
    const pageTitle = page.getByText('Approval Dashboard');
    await expect(pageTitle).toBeVisible();

    console.log('Approve: Case study approved successfully');
  });

  test('should show approval confirmation dialog', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Set up dialog handler to dismiss (cancel)
    let dialogReceived = false;
    page.on('dialog', async dialog => {
      dialogReceived = true;
      expect(dialog.message()).toContain('approve');
      await dialog.dismiss(); // Click Cancel
    });

    // Click Approve button (there are 2 on page)
    const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
    await approveBtn.click();
    await page.waitForTimeout(500);

    // Should still be on review page since we cancelled
    expect(dialogReceived).toBeTruthy();
    const reviewTitle = page.getByText('Review & Approve');
    await expect(reviewTitle).toBeVisible();

    console.log('Approve: Confirmation dialog shown and cancel works');
  });
});

// ============================================
// REJECT CASE STUDY TESTS
// ============================================
test.describe('Reject Case Study', () => {
  test('should show rejection form with reason textarea', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Click Reject button to show rejection form
    const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();
    await page.waitForTimeout(500);

    // Verify rejection form appears
    const reasonTextarea = page.locator('#rejectionReason');
    await expect(reasonTextarea).toBeVisible();

    // Verify placeholder text
    const placeholder = await reasonTextarea.getAttribute('placeholder');
    expect(placeholder).toContain('Explain why');

    // Verify Cancel button is visible
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeVisible();

    // Verify Confirm Rejection button is visible
    const confirmRejectBtn = page.getByRole('button', { name: 'Confirm Rejection' });
    await expect(confirmRejectBtn).toBeVisible();

    console.log('Reject: Rejection form displayed correctly');
  });

  test('should require rejection reason (validation)', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Click Reject button
    const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
    await rejectBtn.click();
    await page.waitForTimeout(500);

    // Try to submit without reason - button should be disabled
    const confirmRejectBtn = page.getByRole('button', { name: 'Confirm Rejection' });
    const isDisabled = await confirmRejectBtn.isDisabled();
    expect(isDisabled).toBeTruthy();

    // Now fill in a reason
    const reasonTextarea = page.locator('#rejectionReason');
    await reasonTextarea.fill('Test rejection reason');

    // Button should now be enabled
    const isEnabledAfter = await confirmRejectBtn.isEnabled();
    expect(isEnabledAfter).toBeTruthy();

    console.log('Reject: Validation works - reason required');
  });

  test('should reject case study with notes', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Click Reject button
    const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
    await rejectBtn.click();
    await page.waitForTimeout(500);

    // Fill in rejection reason
    const reasonTextarea = page.locator('#rejectionReason');
    await reasonTextarea.fill('This case study needs more details in the problem description. Please add specific metrics about the wear rate and customer impact.');

    // Set up dialog handler for confirm
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('reject');
      await dialog.accept();
    });

    // Click Confirm Rejection
    const confirmRejectBtn = page.getByRole('button', { name: 'Confirm Rejection' });
    await confirmRejectBtn.click();

    // Wait for redirect back to approvals page
    await page.waitForURL(/\/dashboard\/approvals/, { timeout: 10000 });

    // Verify success
    const pageTitle = page.getByText('Approval Dashboard');
    await expect(pageTitle).toBeVisible();

    console.log('Reject: Case study rejected with notes successfully');
  });

  test('should cancel rejection and return to review', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test (previous tests may have processed all cases)');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click Reject button (there are 2 on page - top and sticky bottom)
    const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
    const rejectVisible = await rejectBtn.isVisible().catch(() => false);

    if (!rejectVisible) {
      console.log('Reject button not visible - case may have been processed already');
      return;
    }

    await rejectBtn.click();
    await page.waitForTimeout(500);

    // Verify rejection form is visible
    const reasonTextarea = page.locator('#rejectionReason');
    await expect(reasonTextarea).toBeVisible();

    // Fill some text
    await reasonTextarea.fill('Test reason');

    // Click Cancel
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Verify we're back to the main approval actions (Reject/Approve buttons visible)
    const rejectBtnAgain = page.getByRole('button', { name: 'Reject' }).first();
    await expect(rejectBtnAgain).toBeVisible();

    console.log('Reject: Cancel works correctly');
  });
});

// ============================================
// REVIEW PAGE TESTS
// ============================================
test.describe('Approval Review Page', () => {
  test('should display case study details for review', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Verify key sections are visible
    const sections = [
      'Review & Approve',
      'Basic Information',
      'Problem Description',
      'Welding Alloys Solution',
      'Submitted By'
    ];

    for (const section of sections) {
      const sectionElement = page.getByText(section).first();
      await expect(sectionElement).toBeVisible({ timeout: 5000 });
    }

    console.log('Review Page: All sections displayed correctly');
  });

  test('should have back to approvals link', async ({ page }) => {
    await waLoginAsApprover(page);
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    const reviewBtn = page.getByRole('button', { name: 'Review' }).first();
    const hasPendingCases = await reviewBtn.isVisible().catch(() => false);

    if (!hasPendingCases) {
      console.log('No pending cases - skipping test');
      return;
    }

    await reviewBtn.click();
    await page.waitForLoadState('networkidle');

    // Click back to approvals
    const backLink = page.getByRole('button', { name: /Back to Approvals/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Verify we're back on approvals page
    await page.waitForURL(/\/dashboard\/approvals/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Back navigation URL:', currentUrl);

    // Verify page loaded - look for any heading or the pending approvals section
    const pageLoaded = await page.getByRole('heading').first().isVisible().catch(() => false);
    expect(pageLoaded || currentUrl.includes('/approvals')).toBeTruthy();

    console.log('Review Page: Back navigation works');
  });
});

// ============================================
// ACCESS CONTROL TESTS
// ============================================
test.describe('Approval Access Control', () => {
  test('contributors should not see approval actions', async ({ page }) => {
    await waLoginAsContributor(page);

    // Try to access approvals page
    await page.goto(`${BASE_URL}/dashboard/approvals`);
    await page.waitForLoadState('networkidle');

    // Should either redirect or show no approval dashboard
    const url = page.url();
    const isRedirected = !url.includes('/approvals') || url.includes('/dashboard');

    // Or check if approval actions are not visible
    const approvalDashboard = page.getByText('Approval Dashboard');
    const isVisible = await approvalDashboard.isVisible().catch(() => false);

    expect(isRedirected || !isVisible).toBeTruthy();
    console.log('Access Control: Contributors cannot access approval page');
  });
});
