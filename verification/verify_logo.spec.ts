import { test, expect } from '@playwright/test';

test('verify logo on landing and auth pages', async ({ page }) => {
  // Check Landing Page
  await page.goto('/');
  // Wait for the logo image to be visible. The logo is likely in the navbar.
  // We look for an img with src containing 'stagelink-logo-mask.png'
  const landingLogo = page.locator('img[src*="stagelink-logo-mask.png"]').first();
  await expect(landingLogo).toBeVisible();
  await page.screenshot({ path: 'landing_logo.png' });

  // Check Login Page
  await page.goto('/login');
  const loginLogo = page.locator('img[src*="stagelink-logo-mask.png"]').first();
  await expect(loginLogo).toBeVisible();
  await page.screenshot({ path: 'login_logo.png' });
});
