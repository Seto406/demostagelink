import { test, expect } from '@playwright/test';

test.describe('Health Check Verification', () => {

  test('Shows Connection Issue when Health Check fails', async ({ page }) => {
    // Mock the RPC call to fail with 404
    await page.route('**/rpc/get_service_health', async route => {
      await route.fulfill({
        status: 404,
        body: 'Not Found'
      });
    });

    await page.goto('/');

    // Verify "Connection Issue" text appears
    // The text might be inside a component, so we wait for it.
    await expect(page.getByText('Connection Issue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("We're having trouble connecting to our servers.")).toBeVisible();
  });

  test('Loads App when Health Check succeeds', async ({ page }) => {
    // Mock the RPC call to succeed
    await page.route('**/rpc/get_service_health', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'ok',
          health: 'active',
          version: 'v1',
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.goto('/');

    // Verify that the app loads and "Connection Issue" is NOT visible.
    await expect(page.getByText('Connection Issue')).not.toBeVisible({ timeout: 10000 });
  });
});
