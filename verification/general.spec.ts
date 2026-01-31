import { test, expect } from '@playwright/test';

test.describe('General Pages', () => {
  test('404 Page loads for invalid URL', async ({ page }) => {
    await page.goto('/some-random-url-that-does-not-exist');

    // Expect 404 content
    await expect(page.getByRole('heading', { name: /404/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();

    // Verify <main> landmark exists (accessibility)
    await expect(page.locator('main')).toBeVisible();
  });

  test('Privacy Policy loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  });

  test('Terms of Service loads', async ({ page }) => {
    await page.goto('/terms');
    // More specific locator to avoid strict mode violations (matching multiple headers)
    await expect(page.getByRole('heading', { name: 'Terms of Service', exact: true })).toBeVisible();
  });
});
