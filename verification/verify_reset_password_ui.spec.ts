import { test, expect } from '@playwright/test';

test('Reset Password Page UI Verification', async ({ page }) => {
  // Navigate to the reset password page with type=recovery
  await page.goto('/reset-password?type=recovery');

  // Mock the authenticated state (as if the user clicked the recovery link)
  await page.addInitScript(() => {
    // Mock user session for AuthContext
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // Inject PlaywrightUser for AuthContext to pick up
    (window as any).PlaywrightTest = true;
    (window as any).PlaywrightUser = mockUser;
  });

  // Reload to apply the mock
  await page.reload();

  // Wait for the page to load and check for the heading
  await expect(page.locator('h1', { hasText: 'Set New Password' })).toBeVisible();

  // Assert that "New Password" and "Confirm New Password" fields are present
  await expect(page.getByLabel('New Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm New Password', { exact: true })).toBeVisible();

  // Assert that the "Email" field is NOT present
  // The email field has label "Email", so we expect it not to be visible
  await expect(page.getByLabel('Email')).not.toBeVisible();

  // Verify static layout (no framer-motion classes if possible, but mainly just visibility)
  const container = page.locator('.max-w-md.mx-auto');
  await expect(container).toBeVisible();
});

test('Reset Password Request Page UI Verification (Unauthenticated)', async ({ page }) => {
  // Navigate to the reset password page without params
  await page.goto('/reset-password');

  // Ensure no user mock is present (default state)

  // Wait for the page to load
  await expect(page.locator('h1', { hasText: 'Reset Password' })).toBeVisible();

  // Assert that "Email" field is present
  await expect(page.getByLabel('Email')).toBeVisible();

  // Assert that "New Password" fields are NOT present
  await expect(page.getByLabel('New Password')).not.toBeVisible();
});
