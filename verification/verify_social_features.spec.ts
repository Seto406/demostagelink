import { test, expect } from '@playwright/test';

test('Social features routes exist (public view or redirect)', async ({ page }) => {
  // Check Notifications route exists and loads (even if stuck on loading state due to env)
  await page.goto('/notifications');
  // It should NOT be 404. 404 page has "Oops! Page not found"
  await expect(page.getByText('Oops! Page not found')).toBeHidden();

  // It should show a loader or the content
  const loaderOrContent = page.locator('text=/Loading/i').or(page.locator('text=Please log in'));
  await expect(loaderOrContent).toBeVisible();
});

test('UserFeed redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/feed');
  await page.waitForURL(/\/login/);
  await expect(page).toHaveURL(/\/login/);
});
