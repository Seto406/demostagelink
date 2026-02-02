import { test, expect } from '@playwright/test';

test.describe('Landing Footer Verification', () => {
  test('Footer contains Terms of Service and Privacy Policy links', async ({ page }) => {
    // Go to landing page
    await page.goto('/');

    // Check if Terms of Service link exists and has correct href
    const termsLink = page.getByRole('link', { name: 'Terms of Service' });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    // Check if Privacy Policy link exists and has correct href
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  test('Clicking links navigates to correct pages', async ({ page }) => {
    await page.goto('/');

    // Test Terms link navigation
    await page.getByRole('link', { name: 'Terms of Service' }).click();
    await expect(page).toHaveURL(/.*\/terms/);

    // Go back
    await page.goBack();

    // Test Privacy link navigation
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/.*\/privacy/);
  });
});
