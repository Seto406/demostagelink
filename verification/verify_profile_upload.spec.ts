import { test, expect } from '@playwright/test';

test('Dashboard Profile Upload UI (Mocked Auth)', async ({ page }) => {
  // Mock Shows Query to avoid errors
  await page.route('**/rest/v1/shows?*', async (route) => {
    await route.fulfill({ json: [] });
  });

  // Mock Analytics
  await page.route('**/rest/v1/analytics_events?*', async (route) => {
    await route.fulfill({ json: [] });
  });

  // 1. Disable Tour via LocalStorage
  await page.goto('/');
  await page.evaluate(() => {
     localStorage.setItem('stagelink_tour_seen_user123', 'true');
  });

  // 2. Go to Dashboard
  await page.goto('/dashboard');

  // Wait for Dashboard to load
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });

  // 3. Click Profile Tab using ID
  const profileTab = page.locator('#profile-tab');
  await expect(profileTab).toBeVisible();
  // Force click to bypass any overlay issues (like Tour if LS failed)
  await profileTab.click({ force: true });

  // 4. Verify Profile Tab Loaded
  await expect(page.getByRole('heading', { name: 'Group Profile' })).toBeVisible();

  // 5. Verify Avatar Upload UI
  await expect(page.getByText('Upload Logo')).toBeVisible();

  // 6. Verify Map Upload UI
  await expect(page.getByText('Upload Map Screenshot')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification_dashboard.png' });
});
