import { test, expect } from '@playwright/test';

test('Floating Input Accessibility Check', async ({ page }) => {
  // Mock Auth to prevent hanging on session check
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

  // Go to login page where FloatingInput is used
  await page.goto('/login');

  // Verify we are actually on the login page (and not redirected)
  await expect(page).toHaveURL(/\/login/);

  // Locate the email input using ID as it is most reliable here
  const emailInput = page.locator('input#email');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Get the id of the input
  const inputId = await emailInput.getAttribute('id');
  expect(inputId).toBe('email');

  // Locate the label associated with this input id
  // We look for a label with the 'for' attribute matching the input id
  const label = page.locator(`label[for="${inputId}"]`);

  // Verify label exists and contains expected text
  await expect(label).toBeVisible();
  await expect(label).toHaveText(/Email/);

  // Verify the label has pointer-events: none class
  await expect(label).toHaveClass(/pointer-events-none/);
});
