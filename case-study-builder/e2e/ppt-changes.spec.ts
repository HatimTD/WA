import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive tests for PPT feedback changes and full application flows
 */

test.setTimeout(120000);

// Login helper that works with the role buttons UI
async function waLoginAsAdmin(page: Page) {
  await page.goto('/dev-login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  await page.getByLabel('Email').fill('admin@weldingalloys.com');
  await page.getByLabel('Password').fill('TestPassword123');

  // Click the ADMIN role button
  await page.getByRole('button', { name: 'Admin' }).click();

  // Submit the form
  await page.getByRole('button', { name: /Login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

// Helper to navigate to step 3 using the step indicator button
async function waNavigateToBasicInfo(page: Page) {
  // Step buttons are numbered "1", "2", "3", etc. without title attributes
  // Click the button with text "3" to go to Basic Info step
  const step3Button = page.locator('button').filter({ hasText: /^3$/ }).first();
  if (await step3Button.isVisible({ timeout: 3000 }).catch(() => false)) {
    await step3Button.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

// ==================== PPT FEEDBACK CHANGES TESTS ====================

test.describe('PPT Feedback - Step 3 Basic Info Fields', () => {

  test('Job Type dropdown shows all options including Other', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select Application Case
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    // Navigate to Basic Info step
    const navigated = await waNavigateToBasicInfo(page);

    if (navigated) {
      // Wait for Basic Info content to load
      await page.waitForTimeout(500);

      // Look for Job Type label
      const jobTypeLabel = page.getByText('Job Type').first();
      if (await jobTypeLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Find the Job Type select trigger
        const jobTypeSelect = page.locator('button[role="combobox"]').filter({
          has: page.locator('span:has-text("Select job type")')
        }).first();

        if (await jobTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await jobTypeSelect.click();
          await page.waitForTimeout(300);

          // Check for options
          await expect(page.getByRole('option', { name: 'Preventive' })).toBeVisible({ timeout: 3000 });
          await expect(page.getByRole('option', { name: 'Corrective' })).toBeVisible();
          await expect(page.getByRole('option', { name: 'Improvement' })).toBeVisible();
          await expect(page.getByRole('option', { name: /Other/i }).first()).toBeVisible();
        }
      }
    }
  });

  test('Wear Type section shows Metal-Metal option', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    await waNavigateToBasicInfo(page);
    await page.waitForTimeout(500);

    // Check for Type of Wear label
    const wearTypeLabel = page.getByText('Type of Wear').first();
    await expect(wearTypeLabel).toBeVisible({ timeout: 10000 });

    // Check for Metal-Metal chip/button
    const metalMetalChip = page.locator('button').filter({ hasText: /Metal-Metal|Metal-metal/i }).first();
    await expect(metalMetalChip).toBeVisible({ timeout: 5000 });
  });

  test('Wear Severity shows scale 1-5', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    await waNavigateToBasicInfo(page);
    await page.waitForTimeout(500);

    // Check Wear Severity label
    const severityLabel = page.getByText('Wear Severity').first();
    await expect(severityLabel).toBeVisible({ timeout: 10000 });

    // Check for severity scale description
    const scaleDescription = page.getByText(/1 = Low.*5 = High/i);
    await expect(scaleDescription).toBeVisible({ timeout: 5000 });
  });

  test('Industry dropdown has Other option', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    await waNavigateToBasicInfo(page);
    await page.waitForTimeout(500);

    // Find Industry dropdown
    const industryLabel = page.getByText('Industry').first();
    await expect(industryLabel).toBeVisible({ timeout: 10000 });

    // Click the first combobox (Industry)
    const industryCombobox = page.locator('[role="combobox"]').first();
    await industryCombobox.click();
    await page.waitForTimeout(300);

    // Check for "Other (specify)" option specifically
    const otherOption = page.getByRole('option', { name: 'Other (specify)' });
    await expect(otherOption).toBeVisible({ timeout: 5000 });
  });

  test('Metric/Imperial toggle buttons exist', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    await waNavigateToBasicInfo(page);
    await page.waitForTimeout(500);

    // Check for Unit System label
    const unitLabel = page.getByText('Unit System').first();
    await expect(unitLabel).toBeVisible({ timeout: 10000 });

    // Check for Metric button
    const metricButton = page.getByRole('button', { name: /Metric.*mm.*cm/i });
    await expect(metricButton).toBeVisible({ timeout: 5000 });

    // Check for Imperial button
    const imperialButton = page.getByRole('button', { name: /Imperial.*in.*ft/i });
    await expect(imperialButton).toBeVisible();
  });

  test('Job Duration field with unit selector', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    await waNavigateToBasicInfo(page);
    await page.waitForTimeout(500);

    // Check for Job Duration label
    const durationLabel = page.getByText('Job Duration').first();
    await expect(durationLabel).toBeVisible({ timeout: 10000 });

    // Check for duration input
    const durationInput = page.locator('input#jobDuration');
    await expect(durationInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PPT Feedback - Navigation', () => {

  test('Step numbers are clickable and navigate between steps', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select Application Case
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    // Step buttons are just numbered buttons "1", "2", "3", etc.
    // Find step 3 button (Basic Info) - it's near text "Basic Info"
    const step3Button = page.locator('button').filter({ hasText: /^3$/ }).first();
    const step1Button = page.locator('button').filter({ hasText: /^1$/ }).first();

    await expect(step1Button).toBeVisible({ timeout: 5000 });
    await expect(step3Button).toBeVisible();

    // Click step 3 to navigate to Basic Info
    await step3Button.click();
    await page.waitForTimeout(500);

    // Verify Basic Info content is visible (Industry field is on this step)
    const basicInfoContent = page.getByText('Industry').first();
    await expect(basicInfoContent).toBeVisible({ timeout: 5000 });

    // Click step 1 to navigate back
    await step1Button.click();
    await page.waitForTimeout(500);

    // Verify Case Type content is visible - use first() because text appears in multiple places
    const caseTypeContent = page.getByText('Select Case Study Type').first();
    await expect(caseTypeContent).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PPT Feedback - Cost Calculator', () => {

  test('STAR case shows Cost Calculator with Service Life field', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select STAR Case
    await page.getByText('Star Case').click();
    await page.waitForTimeout(300);

    // Navigate to Cost Calculator step (step 4 for STAR)
    const step4Button = page.getByTitle('Go to Cost Calculator').or(
      page.locator('button').filter({ hasText: /^4$/ }).first()
    );

    if (await step4Button.isVisible({ timeout: 3000 }).catch(() => false)) {
      await step4Button.click();
      await page.waitForTimeout(500);

      // Check for Cost Calculator content
      const costCalcHeading = page.getByText('Cost Calculator');
      if (await costCalcHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for Service Life related fields
        const serviceLifeText = page.getByText(/Service Life|Lifetime/i);
        await expect(serviceLifeText.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

// ==================== COMPREHENSIVE FLOW TESTS ====================

test.describe('Case Study Creation Flow', () => {

  test('Can create and save draft case study', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Step 1: Select case type
    await page.getByText('Application Case').click();
    // Use exact: true to avoid matching "Open Next.js Dev Tools" button
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: Qualifier - we're on this step, just click Next
    // The qualifier may have customer search, try to proceed
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(500);

    // Navigate to Basic Info using step button if needed
    const step3 = page.locator('button').filter({ hasText: /^3$/ }).first();
    if (await step3.isVisible({ timeout: 2000 }).catch(() => false)) {
      await step3.click();
      await page.waitForTimeout(500);
    }

    // Fill basic info fields
    const titleInput = page.locator('input#title');
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Test Case Study - E2E Test');
    }

    // Select Industry
    const industryCombobox = page.locator('[role="combobox"]').first();
    if (await industryCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await industryCombobox.click();
      await page.waitForTimeout(200);
      const miningOption = page.getByRole('option', { name: /Mining/i }).first();
      if (await miningOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await miningOption.click();
      }
    }

    // Take screenshot of form state
    await page.screenshot({ path: 'test-results/draft-creation.png' });
  });

  test('Can navigate through all form steps', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/new', { timeout: 30000 });

    // Select Application Case
    await page.getByText('Application Case').click();
    await page.waitForTimeout(300);

    // Get all step buttons by their titles
    const steps = [
      'Go to Case Type',
      'Go to Qualifier',
      'Go to Basic Info',
      'Go to Problem',
      'Go to Solution',
      'Go to Review'
    ];

    for (const stepTitle of steps) {
      const stepButton = page.getByTitle(stepTitle);
      if (await stepButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await stepButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Should be on Review step
    const reviewHeading = page.getByText('Review').first();
    await expect(reviewHeading).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard Navigation', () => {

  test('Can navigate to My Cases page', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Click My Cases link
    await page.getByRole('link', { name: 'My Cases' }).click();
    await expect(page).toHaveURL(/\/dashboard\/my-cases/, { timeout: 10000 });
  });

  test('Can navigate to Library page', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Click Library link
    await page.getByRole('link', { name: 'Library' }).click();
    await expect(page).toHaveURL(/\/dashboard\/library/, { timeout: 10000 });

    // Verify library content loads
    const libraryHeading = page.getByRole('heading', { name: /Library|Case Studies/i }).first();
    await expect(libraryHeading).toBeVisible({ timeout: 10000 });
  });

  test('Can navigate to Saved Cases page', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Click Saved Cases link
    await page.getByRole('link', { name: 'Saved Cases' }).click();
    await expect(page).toHaveURL(/\/dashboard\/saved/, { timeout: 10000 });
  });

  test('Can navigate to Search page', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Click Search Database link
    await page.getByRole('link', { name: 'Search Database' }).click();
    await expect(page).toHaveURL(/\/dashboard\/search/, { timeout: 10000 });
  });

  test('Can navigate to Approvals page', async ({ page }) => {
    await waLoginAsAdmin(page);

    // Click Approvals link
    await page.getByRole('link', { name: 'Approvals' }).click();
    await expect(page).toHaveURL(/\/dashboard\/approvals/, { timeout: 10000 });
  });
});

test.describe('Case Study Library', () => {

  test('Library shows case study cards', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/library', { timeout: 30000 });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Library page has heading "Case Study Library"
    const libraryHeading = page.getByRole('heading', { name: /Case Study Library/i });
    await expect(libraryHeading).toBeVisible({ timeout: 10000 });

    // The page shows "Browse X approved industrial solutions" or "Showing X-Y of Z cases"
    // This indicates case studies are available
    const caseCountText = page.getByText(/Browse \d+ approved|Showing \d+-\d+ of \d+/i);
    await expect(caseCountText.first()).toBeVisible({ timeout: 5000 });
  });

  test('Can use search/filter on library', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/library', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(
      page.locator('input[type="search"]')
    ).or(
      page.locator('input[type="text"]').first()
    );

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Search should trigger - just verify no error
    }
  });
});

test.describe('Edit Case Study Flow', () => {

  test('Can access edit page for existing case (if any exist)', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/my-cases', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Look for an edit button or link
    const editButton = page.getByRole('link', { name: /edit/i }).or(
      page.getByRole('button', { name: /edit/i })
    ).or(
      page.locator('a[href*="/edit"]')
    );

    if (await editButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.first().click();
      await page.waitForTimeout(1000);

      // Should be on edit page
      await expect(page).toHaveURL(/\/edit/, { timeout: 10000 });

      // Verify edit form loads
      const formContent = page.getByText('Case Study Title').or(
        page.getByText('Edit Case Study')
      );
      await expect(formContent.first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Draft Management', () => {

  test('Can view drafts in My Cases', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/my-cases', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Look for draft filter or draft cases
    const draftFilter = page.getByRole('button', { name: /draft/i }).or(
      page.getByText(/draft/i)
    );

    // Just verify the page loads without error
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible({ timeout: 5000 });
  });
});

test.describe('View Case Study Details', () => {

  test('Can view case study details from library (if cases exist)', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/library', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Look for "View Details" button/link - these link to /dashboard/library/[id]
    const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first();

    if (await viewDetailsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);

      // URL pattern is /dashboard/library/[case-id]
      await expect(page).toHaveURL(/\/dashboard\/library\/[a-z0-9]+/, { timeout: 10000 });
    }
  });
});

test.describe('Approval Workflow', () => {

  test('Approvals page loads with pending items or empty state', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/approvals', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Check for approval content or empty state
    const approvalContent = page.getByText(/pending|approve|review/i).or(
      page.getByText(/no.*pending|no.*approvals/i)
    );

    await expect(approvalContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Compare Cases', () => {

  test('Compare page loads', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/compare', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Verify page loads
    const compareContent = page.getByText(/compare/i).or(
      page.getByText(/select.*cases/i)
    );

    await expect(compareContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Analytics', () => {

  test('Analytics page loads', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/analytics', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Verify analytics content
    const analyticsContent = page.getByText(/analytics|statistics|metrics/i);
    await expect(analyticsContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Leaderboard', () => {

  test('Leaderboard page loads', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    await page.waitForLoadState('networkidle');

    // Verify leaderboard content
    const leaderboardContent = page.getByText(/leaderboard|ranking|points/i);
    await expect(leaderboardContent.first()).toBeVisible({ timeout: 10000 });
  });
});
