import { test, expect } from '@playwright/test';

test('landing page loads and contains phase 3 updates', async ({ page }) => {
  // Mock Supabase Auth to return no session immediately
  // This prevents the app from hanging in "Loading..." state if it tries to contact real Supabase
  await page.route('**/auth/v1/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ session: null })
    });
  });

  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null })
    });
  });

  // Also mock any other initial requests that might block
  // ...

  await page.goto('/');

  // Wait for the main content to be visible
  await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // Check for "Mobile App (Coming Soon)" in footer
  await expect(page.getByText('Mobile App (Coming Soon)')).toBeVisible();

  // Check for Pricing section updates
  const waitlistButton = page.getByRole('button', { name: 'Join Waitlist' });
  await waitlistButton.scrollIntoViewIfNeeded();
  await expect(waitlistButton).toBeVisible();
});
