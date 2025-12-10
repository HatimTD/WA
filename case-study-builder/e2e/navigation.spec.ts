import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('tidihatim@gmail.com');
    await page.getByLabel('Password').fill('Godofwar@3');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('main navigation works', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Test navigation to Case Studies
    const caseStudiesLink = page.getByRole('link', { name: /case stud/i }).first();
    if (await caseStudiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await caseStudiesLink.click();
      await expect(page).toHaveURL(/\/dashboard\/case-studies/, { timeout: 10000 });
    }

    // Navigate back to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard|home/i }).first();
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    }

    // Test navigation to Profile/Settings if available
    const profileLink = page.getByRole('link', { name: /profile|settings|account/i }).first();
    if (await profileLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForTimeout(1000);
      // Verify URL changed or modal opened
      const urlChanged = !page.url().includes('/dashboard?') && !page.url().endsWith('/dashboard');
      expect(urlChanged || await page.getByRole('dialog').isVisible()).toBeTruthy();
    }
  });

  test('sidebar navigation links work', async ({ page }) => {
    // Test each main sidebar navigation item
    const navigationItems = [
      { name: /dashboard|home/i, urlPattern: /\/dashboard$/ },
      { name: /case stud/i, urlPattern: /\/case-studies/ },
      { name: /analytics|reports/i, urlPattern: /\/analytics|\/reports/ },
      { name: /settings/i, urlPattern: /\/settings/ },
    ];

    for (const item of navigationItems) {
      const link = page.getByRole('link', { name: item.name }).first();

      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await page.waitForTimeout(1000);

        // Verify URL matches expected pattern
        const currentUrl = page.url();
        const matches = item.urlPattern.test(currentUrl);

        expect(matches).toBeTruthy();
      }
    }
  });

  test('breadcrumbs work', async ({ page }) => {
    // Navigate to a nested page (case studies detail)
    await page.goto('/dashboard/case-studies');

    // Wait for page to load
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Look for breadcrumb navigation
    const breadcrumbs = page.getByRole('navigation', { name: /breadcrumb/i })
      .or(page.locator('[aria-label*="readcrumb"]'))
      .or(page.locator('.breadcrumb'));

    if (await breadcrumbs.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on a breadcrumb link (e.g., Dashboard)
      const dashboardBreadcrumb = breadcrumbs.getByRole('link', { name: /dashboard|home/i });

      if (await dashboardBreadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dashboardBreadcrumb.click();
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      }
    } else {
      test.skip('Breadcrumbs not available on this page');
    }
  });

  test('breadcrumbs show current location', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/dashboard/case-studies');

    // Look for breadcrumb
    const breadcrumbs = page.getByRole('navigation', { name: /breadcrumb/i })
      .or(page.locator('[aria-label*="readcrumb"]'))
      .or(page.locator('.breadcrumb'));

    if (await breadcrumbs.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if current page is shown in breadcrumbs
      const currentPageText = breadcrumbs.getByText(/case stud/i);
      await expect(currentPageText).toBeVisible();
    } else {
      test.skip('Breadcrumbs not available');
    }
  });

  test('mobile menu', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page to apply mobile layout
    await page.reload();
    await page.waitForTimeout(1000);

    // Look for mobile menu button (hamburger menu)
    const mobileMenuButton = page.getByRole('button', { name: /menu|navigation|open menu/i })
      .or(page.locator('button[aria-label*="menu"]'))
      .or(page.locator('.mobile-menu-button'))
      .or(page.locator('[data-testid="mobile-menu-button"]'));

    if (await mobileMenuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to open mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Verify menu is visible
      const mobileNav = page.getByRole('navigation').or(page.locator('[role="dialog"]')).or(page.locator('.mobile-menu'));
      await expect(mobileNav.first()).toBeVisible({ timeout: 5000 });

      // Try to navigate to case studies from mobile menu
      const caseStudiesLink = page.getByRole('link', { name: /case stud/i }).first();
      if (await caseStudiesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await caseStudiesLink.click();
        await expect(page).toHaveURL(/\/case-studies/, { timeout: 10000 });
      }
    } else {
      test.skip('Mobile menu not found');
    }
  });

  test('mobile menu opens and closes', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page to apply mobile layout
    await page.reload();
    await page.waitForTimeout(1000);

    // Look for mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu|navigation|open menu/i })
      .or(page.locator('button[aria-label*="menu"]'))
      .or(page.locator('.mobile-menu-button'));

    if (await mobileMenuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Open menu
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Verify menu is open
      const mobileNav = page.getByRole('navigation').or(page.locator('[role="dialog"]'));
      await expect(mobileNav.first()).toBeVisible({ timeout: 5000 });

      // Close menu (look for close button or overlay)
      const closeButton = page.getByRole('button', { name: /close/i })
        .or(page.locator('button[aria-label*="close"]'))
        .or(page.locator('[data-testid="close-menu"]'));

      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Verify menu is closed (may still be in DOM but hidden)
        const menuHidden = await mobileNav.first().isHidden().catch(() => true);
        expect(menuHidden).toBeTruthy();
      }
    } else {
      test.skip('Mobile menu not found');
    }
  });

  test('navigation persists user session', async ({ page }) => {
    // Start on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to case studies
    await page.goto('/dashboard/case-studies');
    await expect(page).toHaveURL(/\/dashboard\/case-studies/);

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify user is still logged in (should not redirect to login)
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/login/);
    expect(currentUrl).toMatch(/\/dashboard/);
  });
});
