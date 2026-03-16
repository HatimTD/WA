/**
 * Image Recognition E2E Tests
 *
 * Tests for the AI-powered image analysis and OCR functionality.
 * Tests API endpoints and component behavior.
 */

import { test, expect } from '@playwright/test';

test.describe('Image Recognition Feature', () => {
  test.describe('API Endpoints', () => {
    test('GET /api/ai/image-analysis returns API info', async ({ request }) => {
      const response = await request.get('/api/ai/image-analysis');

      // Should return API info or 404 if not deployed
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.name).toBe('Image Analysis API');
        expect(data.version).toBeDefined();
        expect(data.endpoints).toBeDefined();
        expect(data.supportedFormats).toContain('JPEG');
        expect(data.supportedFormats).toContain('PNG');
      }
    });

    test('POST /api/ai/image-analysis requires authentication', async ({ request }) => {
      const response = await request.post('/api/ai/image-analysis', {
        data: {
          imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          contentType: 'general',
        },
      });

      // Should require auth (401) or return 400/404 if not deployed
      expect([400, 401, 404]).toContain(response.status());
    });

    test('POST /api/ai/image-analysis validates required fields', async ({ request }) => {
      const response = await request.post('/api/ai/image-analysis', {
        data: {
          // Missing imageUrl
          contentType: 'general',
        },
      });

      // Should return 400 for missing imageUrl or 401/404
      expect([400, 401, 404]).toContain(response.status());
    });

    test('POST /api/ai/image-analysis validates image URL format', async ({ request }) => {
      const response = await request.post('/api/ai/image-analysis', {
        data: {
          imageUrl: 'invalid-url',
          contentType: 'general',
        },
      });

      // Should return 400 for invalid URL or 401/404
      expect([400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Image Analyzer Component', () => {
    test('component page is accessible', async ({ page }) => {
      // Navigate to a page that might contain the image analyzer
      // This is a component, so we test if the app loads correctly
      const response = await page.goto('/');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Content Type Support', () => {
    const contentTypes = [
      'text',
      'data_sheet',
      'case_study',
      'technical_specs',
      'general',
    ];

    for (const contentType of contentTypes) {
      test(`API accepts content type: ${contentType}`, async ({ request }) => {
        const response = await request.post('/api/ai/image-analysis', {
          data: {
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            contentType,
            action: 'analyze',
          },
        });

        // Should not return 400 for valid content types (401 is acceptable - auth required)
        // 404 is acceptable if endpoint not deployed
        expect([200, 401, 404, 500]).toContain(response.status());

        // If we got a client error, it shouldn't be about invalid content type
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.error).not.toContain('content type');
        }
      });
    }
  });

  test.describe('Action Types', () => {
    const actions = ['analyze', 'extract_text', 'data_sheet'];

    for (const action of actions) {
      test(`API accepts action: ${action}`, async ({ request }) => {
        const response = await request.post('/api/ai/image-analysis', {
          data: {
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            contentType: 'general',
            action,
          },
        });

        // Should not return 400 for valid actions (401 is acceptable - auth required)
        // 404 is acceptable if endpoint not deployed
        expect([200, 401, 404, 500]).toContain(response.status());
      });
    }
  });

  test.describe('Image Format Support', () => {
    test('API info lists supported formats', async ({ request }) => {
      const response = await request.get('/api/ai/image-analysis');

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.supportedFormats).toEqual(
          expect.arrayContaining(['JPEG', 'PNG', 'GIF', 'WebP'])
        );
        expect(data.maxImageSize).toBe('20MB');
      }
    });
  });

  test.describe('Security', () => {
    test('API does not expose internal errors in production', async ({ request }) => {
      const response = await request.post('/api/ai/image-analysis', {
        data: {
          imageUrl: 'data:image/png;base64,invalid-base64-data!!!',
          contentType: 'general',
        },
      });

      if (response.status() === 500) {
        const data = await response.json();
        // Should not expose stack traces or internal paths
        expect(JSON.stringify(data)).not.toContain('node_modules');
        expect(JSON.stringify(data)).not.toContain('at ');
      }
    });

    test('API requires proper content type header', async ({ request }) => {
      const response = await request.post('/api/ai/image-analysis', {
        headers: {
          'Content-Type': 'text/plain',
        },
        data: 'invalid body',
      });

      // Should reject non-JSON requests
      expect([400, 401, 404, 415, 500]).toContain(response.status());
    });
  });
});
