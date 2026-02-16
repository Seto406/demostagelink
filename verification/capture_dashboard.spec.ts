import { test, expect } from '@playwright/test';

test('Capture Dashboard Screenshot', async ({ page }) => {
  // Mock User Data
  const MOCK_PRODUCER_USER = {
    id: 'producer-123',
    email: 'producer@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  };

  const MOCK_PRODUCER_PROFILE = {
    id: 'producer-profile-123',
    user_id: 'producer-123',
    role: 'producer',
    group_name: 'Test Theater Group',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Mock Service Health
  await page.route('**/rpc/get_service_health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    });
  });

  // 2. Mock Subscription Check
  await page.route('**/functions/v1/check-subscription', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ isPro: true }),
    });
  });

  // 3. Mock Shows Fetch (Default empty)
  await page.route('**/rest/v1/shows*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.continue();
    }
  });

  // Inject Producer Identity
  await page.addInitScript(({ user, profile }) => {
    (window as any).PlaywrightTest = true;
    (window as any).PlaywrightUser = user;
    (window as any).PlaywrightProfile = profile;
    localStorage.setItem(`stagelink_tour_seen_${user.id}`, 'true');
  }, { user: MOCK_PRODUCER_USER, profile: MOCK_PRODUCER_PROFILE });

  await page.goto('/dashboard');

  // Wait for dashboard to load
  await expect(page.getByText('Total Productions')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification/dashboard_screenshot.png', fullPage: true });
});
