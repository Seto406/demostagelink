import { test, expect } from '@playwright/test';

test('Take screenshot of landing page', async ({ page }) => {
  // Mock the health check RPC
  await page.route('**/rest/v1/rpc/get_service_health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
    });
  });

  await page.goto('/');

  // Wait for "Connection Issue" or "System Updating" to definitely NOT be there.
  await expect(page.getByText('System Updating')).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Connection Issue')).not.toBeVisible({ timeout: 10000 });

  // Wait for network idle to ensure assets load
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: 'verification/landing_page.png', fullPage: true });
});
