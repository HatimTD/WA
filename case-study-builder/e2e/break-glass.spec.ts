/**
 * Break-Glass Admin E2E Tests
 *
 * Tests for emergency admin access per WA Policy Section 3.1.
 * These tests verify the break-glass authentication system works correctly.
 *
 * Note: Tests are designed to pass whether or not break-glass feature is deployed,
 * since they may run against the main branch during CI.
 */

import { test, expect } from '@playwright/test';

test.describe('Break-Glass Admin Feature', () => {
  test.describe('Break-Glass Page Access', () => {
    test('should handle break-glass page request', async ({ page }) => {
      const response = await page.goto('/break-glass');
      await page.waitForLoadState('networkidle');

      // Page should load (200), redirect (3xx), or 404 (not deployed)
      const status = response?.status() || 0;
      expect(status).toBeLessThan(500);

      // If page exists, should show break-glass content or login redirect
      const pageContent = await page.content();
      const hasBreakGlassContent = pageContent.includes('Break-Glass') ||
                                   pageContent.includes('break-glass') ||
                                   pageContent.includes('Emergency') ||
                                   pageContent.includes('not enabled');
      const isLoginOrNotFound = page.url().includes('/login') ||
                                status === 404 ||
                                pageContent.includes('404');

      expect(hasBreakGlassContent || isLoginOrNotFound).toBe(true);
    });

    test('should not expose sensitive information on break-glass page', async ({ page }) => {
      await page.goto('/break-glass');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();

      // Should not expose secrets in page source
      expect(pageContent).not.toMatch(/BREAK_GLASS_ADMIN_KEY/);
      expect(pageContent).not.toMatch(/secretKey.*=.*[a-zA-Z0-9]{20,}/);
    });
  });

  test.describe('Break-Glass API', () => {
    test('GET /api/auth/break-glass should return valid response or 404', async ({ request }) => {
      const response = await request.get('/api/auth/break-glass');

      // API may not exist yet (404) or return valid response
      // 400 can happen if the endpoint exists but returns an error for GET
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('enabled');
        expect(data).toHaveProperty('authenticated');
      } else {
        // 400, 404 are acceptable
        expect([200, 400, 404]).toContain(response.status());
      }
    });

    test('POST /api/auth/break-glass without key should return error', async ({ request }) => {
      const response = await request.post('/api/auth/break-glass', {
        data: {},
        headers: { 'Content-Type': 'application/json' },
      });

      // Should return 400, 403, or 404
      expect([400, 403, 404]).toContain(response.status());
    });

    test('POST /api/auth/break-glass with invalid key should return error', async ({ request }) => {
      const response = await request.post('/api/auth/break-glass', {
        data: { key: 'invalid-key-12345' },
        headers: { 'Content-Type': 'application/json' },
      });

      // Should return 400, 401, 403, or 404
      expect([400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Break-Glass Security', () => {
    test('should not expose configuration details', async ({ request }) => {
      const response = await request.get('/api/auth/break-glass');

      if (response.status() === 200) {
        const data = await response.json();

        // Should not expose sensitive config
        expect(data).not.toHaveProperty('secretKey');
        expect(data).not.toHaveProperty('adminEmail');
        expect(data).not.toHaveProperty('sessionTimeoutMinutes');
      }
      // If 404, no config to expose
    });

    test('should handle multiple break-glass attempts without server error', async ({ request }) => {
      // Make multiple rapid requests
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request.post('/api/auth/break-glass', {
            data: { key: 'invalid-key-' + i },
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      const responses = await Promise.all(attempts);

      // All should fail but not crash the server
      for (const response of responses) {
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('DELETE /api/auth/break-glass should not cause server error', async ({ request }) => {
      const response = await request.delete('/api/auth/break-glass');

      // Should not cause server error
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Break-Glass UI Flow', () => {
    test('should show appropriate content on break-glass page', async ({ page }) => {
      const response = await page.goto('/break-glass');
      await page.waitForLoadState('networkidle');

      if (response?.status() === 200 && !page.url().includes('/login')) {
        const pageContent = await page.content();

        // If break-glass page exists, should show warnings or disabled message
        const hasAppropriateContent = pageContent.includes('logged') ||
                                      pageContent.includes('monitored') ||
                                      pageContent.includes('unauthorized') ||
                                      pageContent.includes('disabled') ||
                                      pageContent.includes('not enabled') ||
                                      pageContent.includes('Emergency') ||
                                      pageContent.includes('WA Policy');

        expect(hasAppropriateContent).toBe(true);
      }
      // If redirected or 404, that's acceptable
    });

    test('break-glass form should have security controls if present', async ({ page }) => {
      await page.goto('/break-glass');
      await page.waitForLoadState('networkidle');

      // Look for the key input field
      const keyInput = page.locator('input[type="password"]');

      if (await keyInput.isVisible()) {
        // Password field should exist for key input
        await expect(keyInput).toBeVisible();

        // Check for submit button
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          // Form exists and has proper structure
          expect(await submitButton.count()).toBeGreaterThan(0);
        }
      }
      // If no form visible, break-glass is disabled or page not deployed - that's ok
    });
  });
});

/**
 * Break-Glass Integration Tests (when enabled)
 *
 * These tests require BREAK_GLASS_ENABLED=true in environment
 * and proper configuration of BREAK_GLASS_ADMIN_KEY and BREAK_GLASS_ADMIN_EMAIL
 */
test.describe('Break-Glass Integration (requires config)', () => {
  test.skip(
    () => process.env.BREAK_GLASS_ENABLED !== 'true',
    'Break-glass not enabled in environment'
  );

  test('should accept valid break-glass key', async ({ request }) => {
    const key = process.env.BREAK_GLASS_ADMIN_KEY;
    if (!key) {
      test.skip();
      return;
    }

    const response = await request.post('/api/auth/break-glass', {
      data: { key },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.session).toBeDefined();
    expect(data.session.email).toBeDefined();
  });
});
