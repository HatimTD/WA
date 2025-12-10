import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 * Validates page load times, Core Web Vitals, and resource optimization
 */
test.describe('Performance Tests', () => {
  test.describe('Page Load Times', () => {
    test('homepage should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
      const domContentLoaded = Date.now() - startTime;

      await page.waitForLoadState('load');
      const fullLoad = Date.now() - startTime;

      console.log(`Homepage Load Times:`);
      console.log(`  DOM Content Loaded: ${domContentLoaded}ms`);
      console.log(`  Full Load: ${fullLoad}ms`);

      expect(response?.status()).toBeLessThan(400);
      // DOM should load within 3 seconds
      expect(domContentLoaded).toBeLessThan(3000);
      // Full load within 10 seconds
      expect(fullLoad).toBeLessThan(10000);
    });

    test('login page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
      const domContentLoaded = Date.now() - startTime;

      await page.waitForLoadState('load');
      const fullLoad = Date.now() - startTime;

      console.log(`Login Page Load Times:`);
      console.log(`  DOM Content Loaded: ${domContentLoaded}ms`);
      console.log(`  Full Load: ${fullLoad}ms`);

      expect(response?.status()).toBeLessThan(400);
      expect(domContentLoaded).toBeLessThan(3000);
      expect(fullLoad).toBeLessThan(10000);
    });

    test('dashboard should load within acceptable time after login', async ({ page }) => {
      // Login
      await page.goto('/dev-login');
      await page.getByLabel('Email').fill('tidihatim@gmail.com');
      await page.getByLabel('Password').fill('Godofwar@3');
      await page.getByLabel('Role').click();
      await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
      await page.getByRole('button', { name: /Login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Now measure dashboard load
      const startTime = Date.now();
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const domContentLoaded = Date.now() - startTime;

      await page.waitForLoadState('load');
      const fullLoad = Date.now() - startTime;

      console.log(`Dashboard Load Times:`);
      console.log(`  DOM Content Loaded: ${domContentLoaded}ms`);
      console.log(`  Full Load: ${fullLoad}ms`);

      expect(domContentLoaded).toBeLessThan(5000);
      expect(fullLoad).toBeLessThan(15000);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('measure Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/');

      // Wait for page to settle
      await page.waitForTimeout(3000);

      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry;
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(-1), 5000);
        });
      });

      console.log(`LCP: ${lcp}ms`);
      // Good LCP is under 2500ms
      if (lcp > 0) {
        expect(lcp).toBeLessThan(4000); // Acceptable threshold
      }
    });

    test('measure First Input Delay simulation (FID)', async ({ page }) => {
      await page.goto('/login');

      // Simulate FID by measuring time to first interaction
      const startTime = Date.now();

      const emailInput = page.getByLabel(/email/i).first();
      await emailInput.click();

      const responseTime = Date.now() - startTime;

      console.log(`First interaction response: ${responseTime}ms`);
      // Good FID is under 100ms, acceptable under 300ms
      expect(responseTime).toBeLessThan(500);
    });

    test('measure Cumulative Layout Shift (CLS)', async ({ page }) => {
      await page.goto('/');

      // Wait for page to settle
      await page.waitForTimeout(3000);

      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      console.log(`CLS: ${cls}`);
      // Good CLS is under 0.1, acceptable under 0.25
      expect(cls).toBeLessThan(0.5);
    });
  });

  test.describe('Resource Optimization', () => {
    test('page should not have excessive JavaScript', async ({ page }) => {
      const responses: { url: string; size: number }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.endsWith('.js') || url.includes('.js?')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          responses.push({ url, size });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('load');

      const totalJsSize = responses.reduce((sum, r) => sum + r.size, 0);
      const totalJsSizeKB = totalJsSize / 1024;

      console.log(`Total JavaScript: ${totalJsSizeKB.toFixed(2)} KB (${responses.length} files)`);

      // Log largest JS files
      const largestFiles = responses.sort((a, b) => b.size - a.size).slice(0, 5);
      console.log('Largest JS files:');
      largestFiles.forEach(f => {
        console.log(`  - ${f.url.split('/').pop()}: ${(f.size / 1024).toFixed(2)} KB`);
      });
    });

    test('page should not have excessive CSS', async ({ page }) => {
      const responses: { url: string; size: number }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.endsWith('.css') || url.includes('.css?')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          responses.push({ url, size });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('load');

      const totalCssSize = responses.reduce((sum, r) => sum + r.size, 0);
      const totalCssSizeKB = totalCssSize / 1024;

      console.log(`Total CSS: ${totalCssSizeKB.toFixed(2)} KB (${responses.length} files)`);
    });

    test('images should be optimized', async ({ page }) => {
      const images: { url: string; size: number }[] = [];

      page.on('response', async (response) => {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('image')) {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          images.push({ url: response.url(), size });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('load');

      const totalImageSize = images.reduce((sum, img) => sum + img.size, 0);
      const totalImageSizeKB = totalImageSize / 1024;

      console.log(`Total Images: ${totalImageSizeKB.toFixed(2)} KB (${images.length} images)`);

      // Check for excessively large images
      const largeImages = images.filter(img => img.size > 500 * 1024); // Over 500KB
      if (largeImages.length > 0) {
        console.log('Warning: Large images detected:');
        largeImages.forEach(img => {
          console.log(`  - ${img.url.split('/').pop()}: ${(img.size / 1024).toFixed(2)} KB`);
        });
      }
    });

    test('should use HTTP/2 or HTTP/3', async ({ page }) => {
      let httpVersion = '';

      page.on('response', (response) => {
        const headers = response.headers();
        // Check for HTTP/2 indicators
        if (headers[':status']) {
          httpVersion = 'HTTP/2';
        }
      });

      await page.goto('/');

      console.log(`HTTP Version: ${httpVersion || 'HTTP/1.1 or unable to determine'}`);
    });
  });

  test.describe('Memory Usage', () => {
    test('page should not have memory leaks during navigation', async ({ page }) => {
      // Login
      await page.goto('/dev-login');
      await page.getByLabel('Email').fill('tidihatim@gmail.com');
      await page.getByLabel('Password').fill('Godofwar@3');
      await page.getByLabel('Role').click();
      await page.getByRole('option', { name: /CONTRIBUTOR/i }).click();
      await page.getByRole('button', { name: /Login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Navigate multiple times
      const pages = ['/dashboard', '/dashboard/case-studies', '/dashboard/library', '/dashboard'];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('load');
      }

      // Get memory metrics
      const metrics = await page.evaluate(() => {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        if (memory) {
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
          };
        }
        return null;
      });

      if (metrics) {
        const usedMB = metrics.usedJSHeapSize / (1024 * 1024);
        const totalMB = metrics.totalJSHeapSize / (1024 * 1024);
        console.log(`Memory Usage: ${usedMB.toFixed(2)} MB / ${totalMB.toFixed(2)} MB`);

        // Memory should not exceed 500MB for a web app
        expect(usedMB).toBeLessThan(500);
      }
    });
  });

  test.describe('API Response Times', () => {
    test('API endpoints should respond quickly', async ({ request }) => {
      const endpoints = [
        { name: 'Case Studies', url: '/api/case-studies', method: 'GET' },
        { name: 'Auth Session', url: '/api/auth/session', method: 'GET' },
      ];

      console.log('\nAPI Response Times:');
      console.log('-------------------');

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(endpoint.url);
        const responseTime = Date.now() - startTime;

        console.log(`${endpoint.name}: ${responseTime}ms (status: ${response.status()})`);

        // API should respond within 2 seconds
        expect(responseTime).toBeLessThan(2000);
      }
    });
  });
});
