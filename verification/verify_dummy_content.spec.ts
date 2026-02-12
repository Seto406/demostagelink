
import { test, expect } from '@playwright/test';

test.describe('Verify Dummy Content Seeding', () => {
  test('Dummy shows should be visible on the feed', async ({ page }) => {
    // Mock Auth (Audience)
    await page.addInitScript(() => {
        window.localStorage.setItem('sb-dssbduklgbmxezpjpuen-auth-token', JSON.stringify({
            access_token: 'fake-jwt-audience',
            refresh_token: 'fake-refresh-audience',
            user: { id: 'audience-id', role: 'authenticated', email: 'audience@test.com' }
        }));
        window.PlaywrightTest = true;
        window.PlaywrightUser = { id: 'audience-id', role: 'audience', email: 'audience@test.com' };
    });

    // Go to Feed
    await page.goto('/feed');

    // Check for dummy shows (targeting titles)
    await expect(page.locator('h3:has-text("Mula sa Buwan")')).toBeVisible();
    await expect(page.locator('h3:has-text("Ang Huling El Bimbo")')).toBeVisible();
    await expect(page.locator('h3:has-text("Dekada \'70")')).toBeVisible();
  });

  test('Dummy show details should be accessible', async ({ page }) => {
     // Mock Auth (Audience)
     await page.addInitScript(() => {
        window.PlaywrightTest = true;
        window.PlaywrightUser = { id: 'audience-id', role: 'audience', email: 'audience@test.com' };
    });

    // Go to specific show details
    await page.goto('/shows/demo-msb');

    // Check details
    await expect(page.locator('h1:has-text("Mula sa Buwan")')).toBeVisible();
    await expect(page.locator('text=Samsung Performing Arts Theater')).toBeVisible();
    await expect(page.locator('text=Pat Valera')).toBeVisible(); // Director
    await expect(page.locator('text=Myke Salomon')).toBeVisible(); // Cast
  });
});
