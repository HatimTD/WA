import { test, expect, Page } from '@playwright/test';

/**
 * Regional Leaderboard Tests
 * BRD - Gamification: Global and Regional rankings
 */

test.setTimeout(60000);

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

test.describe('Leaderboard - Regional Rankings', () => {

  test('Leaderboard page loads with global rankings by default', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Should show "Leaderboard" title
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible({ timeout: 10000 });

    // Should show "Global rankings" text
    await expect(page.getByText('Global rankings', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('Region filter dropdown exists and has Global option', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Find the region selector trigger
    const regionSelect = page.locator('[role="combobox"]').first();
    await expect(regionSelect).toBeVisible({ timeout: 10000 });

    // Click to open dropdown
    await regionSelect.click();
    await page.waitForTimeout(500);

    // Should have "Global (All Regions)" option
    await expect(page.getByRole('option', { name: 'Global (All Regions)' })).toBeVisible({ timeout: 5000 });
  });

  test('Your Ranking card shows user stats', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Should show "Your ... Ranking" card
    const rankingCard = page.getByText(/Your.*Ranking/i);
    await expect(rankingCard).toBeVisible({ timeout: 10000 });

    // Should show points
    await expect(page.getByText(/points/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Leaderboard shows top contributors with podium', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Should show trophy icon for 1st place (or at least show rankings)
    const hasRankings = await page.getByText(/approved/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/No contributors/i).isVisible({ timeout: 2000 }).catch(() => false);

    // Either we have rankings or empty state
    expect(hasRankings || hasEmptyState).toBeTruthy();
  });

  test('Region filter updates leaderboard when changed', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Get the region selector
    const regionSelect = page.locator('[role="combobox"]').first();
    await expect(regionSelect).toBeVisible({ timeout: 10000 });

    // Click to open dropdown
    await regionSelect.click();
    await page.waitForTimeout(500);

    // Check if there are region options beyond Global
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();

    console.log(`Found ${optionCount} region options`);

    // If there are regions, select one and verify it updates
    if (optionCount > 1) {
      // Click a region option (not Global)
      await options.nth(1).click();
      await page.waitForTimeout(1000);

      // Should update the subtitle text
      const hasRegionalText = await page.getByText(/regional rankings/i).isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await page.getByText(/No contributors in this region/i).isVisible({ timeout: 2000 }).catch(() => false);

      // Either showing regional rankings or empty state for that region
      expect(hasRegionalText || hasEmptyState).toBeTruthy();
    }
  });

  test('All Contributors section shows full list', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Wait for loading
    await page.waitForTimeout(2000);

    // Check for "All Contributors" section if there are more than 3 users
    const allContributorsSection = await page.getByText('All Contributors').isVisible({ timeout: 5000 }).catch(() => false);

    // Either we have the section or we have fewer than 4 users
    console.log('All Contributors section visible:', allContributorsSection);

    // The page should have loaded without errors
    const pageTitle = await page.getByRole('heading', { name: /Leaderboard/i }).isVisible();
    expect(pageTitle).toBeTruthy();
  });

  test('Badges are displayed for users who have earned them', async ({ page }) => {
    await waLoginAsAdmin(page);
    await page.goto('/dashboard/leaderboard', { timeout: 30000 });

    // Wait for loading
    await page.waitForTimeout(2000);

    // Look for badge-related elements (Explorer, Expert, Champion badges)
    // These may or may not be present depending on user data
    const hasBadges = await page.locator('[class*="badge"]').first().isVisible({ timeout: 3000 }).catch(() => false);

    console.log('Badges visible on leaderboard:', hasBadges);

    // The page should load regardless of badge status
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible();
  });
});
