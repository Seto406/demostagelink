
import { test, expect } from '@playwright/test';

const pagesToCheck = [
  '/',
  '/shows',
  '/directory',
  '/login',
  '/about',
];

test.describe('Sanity Checks', () => {

  test.describe('Link and Resource Integrity', () => {
    for (const pageUrl of pagesToCheck) {
      test(`should report broken internal links on ${pageUrl}`, async ({ page, baseURL }) => {
        const failedResources: string[] = [];

        page.on('response', response => {
          const url = response.url();
          const isInternal = baseURL && url.startsWith(baseURL);

          // Check for any 4xx or 5xx error on internal resources
          if (response.status() >= 400 && isInternal) {
             failedResources.push(`${response.status()} - ${url}`);
          }
        });

        await page.goto(pageUrl);
        // Use 'load' instead of 'networkidle' to avoid timeouts on background requests
        await page.waitForLoadState('load');

        if (failedResources.length > 0) {
          console.error(`Failed resources on ${pageUrl}:`, failedResources);
        }

        expect(failedResources).toEqual([]);
      });
    }
  });

  test.describe('Console Errors', () => {
    for (const pageUrl of pagesToCheck) {
      test(`should not have console errors on ${pageUrl}`, async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore specific known warnings
            if (
              !text.includes('React Router Future Flag Warning') &&
              !text.includes('Failed to load resource') && // Handled by network check
              !text.includes('Content Security Policy directive') // Ignore CSP report-only warnings
            ) {
               consoleErrors.push(text);
            }
          }
        });

        page.on('pageerror', exception => {
          consoleErrors.push(`Uncaught exception: ${exception.message}`);
        });

        await page.goto(pageUrl);
        // Use 'load' instead of 'networkidle' to avoid timeouts
        await page.waitForLoadState('load');

        if (consoleErrors.length > 0) {
          console.error(`Console errors on ${pageUrl}:`, consoleErrors);
        }

        expect(consoleErrors).toEqual([]);
      });
    }
  });

  test.describe('404 Page Rendering', () => {
    test('should render 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');

      // Expect the heading "404"
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();

      // Expect the text "Page not found"
      await expect(page.getByText('Oops! Page not found')).toBeVisible();

      // Check for "Go Home" or similar button
      await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
    });
  });

});
