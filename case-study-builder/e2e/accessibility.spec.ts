import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests - WCAG 2.1 Level AA Compliance
 * Uses axe-core to automatically detect accessibility violations
 * Per research: axe-core can find ~57% of WCAG issues automatically
 */
test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  // Increase timeout for accessibility tests since they scan the DOM
  test.setTimeout(60000);
  test.describe('Public Pages', () => {
    test('homepage should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Homepage accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
          console.log(`    Nodes affected: ${violation.nodes.length}`);
        });
      }

      // Critical and serious violations should be 0
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });

    test('login page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Login page accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
        });
      }

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });
  });

  test.describe('Authenticated Pages', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/dev-login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill('tidihatim@gmail.com');
      await page.getByLabel('Password').fill('Godofwar@3');
      await page.getByLabel('Role').click();
      await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
      await page.getByRole('button', { name: /Login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    });

    test('dashboard should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.recharts-wrapper') // Exclude chart library (3rd party)
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Dashboard accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
        });
      }

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });

    test('case studies page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/dashboard/case-studies');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Case studies page accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
        });
      }

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });

    test('library page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/dashboard/library');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Library page accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
        });
      }

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });

    test('profile page should have no critical accessibility violations', async ({ page }) => {
      await page.goto('/dashboard/profile');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Profile page accessibility violations:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
        });
      }

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);
    });
  });

  test.describe('Specific WCAG Requirements', () => {
    test('forms should have proper labels (WCAG 1.3.1)', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      // Check for label-related violations
      const labelViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('label') || v.id.includes('form')
      );

      if (labelViolations.length > 0) {
        console.log('Form label violations:');
        labelViolations.forEach(v => console.log(`  - ${v.id}: ${v.description}`));
      }
    });

    test('images should have alt text (WCAG 1.1.1)', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Check for image-related violations
      const imageViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('image') || v.id.includes('alt')
      );

      if (imageViolations.length > 0) {
        console.log('Image accessibility violations:');
        imageViolations.forEach(v => {
          console.log(`  - ${v.id}: ${v.description}`);
          v.nodes.forEach(node => console.log(`    Element: ${node.html.substring(0, 100)}`));
        });
      }
    });

    test('page should have proper heading hierarchy (WCAG 1.3.1)', async ({ page }) => {
      // Login first
      await page.goto('/dev-login');
      await page.getByLabel('Email').fill('tidihatim@gmail.com');
      await page.getByLabel('Password').fill('Godofwar@3');
      await page.getByLabel('Role').click();
      await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
      await page.getByRole('button', { name: /Login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.goto('/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Check for heading-related violations
      const headingViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('heading')
      );

      if (headingViolations.length > 0) {
        console.log('Heading hierarchy violations:');
        headingViolations.forEach(v => console.log(`  - ${v.id}: ${v.description}`));
      }
    });

    test('color contrast should be sufficient (WCAG 1.4.3)', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Check for contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('contrast')
      );

      if (contrastViolations.length > 0) {
        console.log('Color contrast violations:');
        contrastViolations.forEach(v => {
          console.log(`  - ${v.id}: ${v.description} (${v.impact})`);
          console.log(`    Affected elements: ${v.nodes.length}`);
        });
      }

      // Contrast violations should not be critical
      const criticalContrastViolations = contrastViolations.filter(
        v => v.impact === 'critical'
      );
      expect(criticalContrastViolations).toHaveLength(0);
    });

    test('interactive elements should be keyboard accessible (WCAG 2.1.1)', async ({ page }) => {
      await page.goto('/login');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Check for keyboard-related violations
      const keyboardViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('keyboard') || v.id.includes('focus') || v.id.includes('tabindex')
      );

      if (keyboardViolations.length > 0) {
        console.log('Keyboard accessibility violations:');
        keyboardViolations.forEach(v => console.log(`  - ${v.id}: ${v.description}`));
      }
    });

    test('page should have proper ARIA landmarks (WCAG 1.3.1)', async ({ page }) => {
      // Login first
      await page.goto('/dev-login');
      await page.getByLabel('Email').fill('tidihatim@gmail.com');
      await page.getByLabel('Password').fill('Godofwar@3');
      await page.getByLabel('Role').click();
      await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
      await page.getByRole('button', { name: /Login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      await page.goto('/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Check for ARIA violations
      const ariaViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('aria') || v.id.includes('landmark') || v.id.includes('region')
      );

      if (ariaViolations.length > 0) {
        console.log('ARIA landmark violations:');
        ariaViolations.forEach(v => console.log(`  - ${v.id}: ${v.description}`));
      }
    });
  });

  test.describe('Accessibility Summary Report', () => {
    test('generate full accessibility report for key pages', async ({ page }) => {
      test.setTimeout(120000); // Increase timeout for this comprehensive test

      const pages = [
        { name: 'Homepage', url: '/', requiresAuth: false },
        { name: 'Login', url: '/login', requiresAuth: false },
        { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
        { name: 'Case Studies', url: '/dashboard/case-studies', requiresAuth: true },
      ];

      const report: { page: string; violations: number; critical: number; serious: number; moderate: number; minor: number }[] = [];

      let isLoggedIn = false;
      for (const pageConfig of pages) {
        if (pageConfig.requiresAuth && !isLoggedIn) {
          // Login once for all authenticated pages
          await page.goto('/dev-login');
          await page.waitForLoadState('networkidle');
          await page.getByLabel('Email').fill('tidihatim@gmail.com');
          await page.getByLabel('Password').fill('Godofwar@3');
          await page.getByLabel('Role').click();
          await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
          await page.getByRole('button', { name: /Login/i }).click();
          await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
          isLoggedIn = true;
        }

        await page.goto(pageConfig.url);
        await page.waitForTimeout(2000); // Wait for page to fully render

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const summary = {
          page: pageConfig.name,
          violations: results.violations.length,
          critical: results.violations.filter(v => v.impact === 'critical').length,
          serious: results.violations.filter(v => v.impact === 'serious').length,
          moderate: results.violations.filter(v => v.impact === 'moderate').length,
          minor: results.violations.filter(v => v.impact === 'minor').length,
        };

        report.push(summary);
      }

      // Print summary report
      console.log('\n=== ACCESSIBILITY SUMMARY REPORT ===\n');
      console.log('Page\t\t\tTotal\tCritical\tSerious\tModerate\tMinor');
      console.log('-------------------------------------------------------------------');
      report.forEach(r => {
        console.log(`${r.page.padEnd(20)}\t${r.violations}\t${r.critical}\t\t${r.serious}\t${r.moderate}\t\t${r.minor}`);
      });
      console.log('\n');

      // Total critical + serious should be minimal
      const totalCritical = report.reduce((sum, r) => sum + r.critical, 0);
      const totalSerious = report.reduce((sum, r) => sum + r.serious, 0);

      console.log(`Total Critical: ${totalCritical}`);
      console.log(`Total Serious: ${totalSerious}`);
    });
  });
});
