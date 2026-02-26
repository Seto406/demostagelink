import { test, expect } from '@playwright/test';

test.describe('Pricing Section Tests', () => {

  test('Verify Pricing CTA is "Subscribe Now"', async ({ page }) => {
    // 1. Navigate to Home
    await page.goto('/');

    // 2. Wait for the pricing section to be visible
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();

    // 3. Scroll to the pricing section (optional but good practice)
    await pricingSection.scrollIntoViewIfNeeded();

    // 4. Check for "Subscribe Now" text
    const subscribeButton = page.getByRole('button', { name: 'Subscribe Now' });
    // This is the check that will fail initially
    await expect(subscribeButton).toBeVisible();

    // 5. Ensure "Join Waitlist" is NOT visible
    const waitlistButton = page.getByRole('button', { name: 'Join Waitlist' });
    await expect(waitlistButton).not.toBeVisible();
  });

});
