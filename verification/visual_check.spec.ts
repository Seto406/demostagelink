import { test, expect } from '@playwright/test';

test('Capture Landing Page Screenshot', async ({ page }) => {
  await page.goto('/');
  // Wait for Marquee (using class selector based on TheaterMarquee code)
  // Class: relative bg-primary border-y-2 border-secondary overflow-hidden
  await expect(page.locator('.bg-primary.border-y-2')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'verification/landing_page.png' });
});
