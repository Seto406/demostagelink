import { test, expect } from '@playwright/test';

test('verify footer ad banner', async ({ page }) => {
  await page.goto('http://localhost:8080/directory');

  // Wait for footer to be visible (increase timeout)
  const footer = page.locator('footer');
  await expect(footer).toBeVisible({ timeout: 10000 });

  // Scroll to footer
  await footer.scrollIntoViewIfNeeded();

  // Check for AdBanner content
  const adText = page.getByText('Advertisement').last();
  await expect(adText).toBeVisible();

  await footer.screenshot({ path: 'verification/footer_ad_verification.png' });
});
