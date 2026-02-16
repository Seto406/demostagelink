import { test, expect } from '@playwright/test';

test.describe('Producer POV', () => {
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

  const MOCK_ADMIN_USER = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const MOCK_ADMIN_PROFILE = {
    id: 'admin-profile-123',
    user_id: 'admin-123',
    role: 'admin',
    created_at: new Date().toISOString(),
  };

  const MOCK_AUDIENCE_USER = {
    id: 'audience-123',
    email: 'audience@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const MOCK_AUDIENCE_PROFILE = {
    id: 'audience-profile-123',
    user_id: 'audience-123',
    role: 'audience',
    created_at: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    // 1. Mock Service Health (to bypass HealthCheckGate)
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
        body: JSON.stringify({ isPro: true }), // Give everyone Pro to avoid upsells blocking UI
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
  });

  test('Producer can access dashboard', async ({ page }) => {
    // Inject Producer Identity
    await page.addInitScript(({ user, profile }) => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
      (window as any).PlaywrightProfile = profile;
    }, { user: MOCK_PRODUCER_USER, profile: MOCK_PRODUCER_PROFILE });

    await page.goto('/dashboard');

    // Check for dashboard elements
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Total Productions')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Show' })).toBeVisible();
  });

  test('Admin can access dashboard', async ({ page }) => {
    // Inject Admin Identity
    await page.addInitScript(({ user, profile }) => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
      (window as any).PlaywrightProfile = profile;
    }, { user: MOCK_ADMIN_USER, profile: MOCK_ADMIN_PROFILE });

    await page.goto('/dashboard');

    // Check for dashboard access
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Total Productions')).toBeVisible();
  });

  test('Audience is redirected from dashboard', async ({ page }) => {
    // Inject Audience Identity
    await page.addInitScript(({ user, profile }) => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
      (window as any).PlaywrightProfile = profile;
    }, { user: MOCK_AUDIENCE_USER, profile: MOCK_AUDIENCE_PROFILE });

    await page.goto('/dashboard');

    // Should redirect to Home (feed) or Index
    // Since mock profile exists, it might go to feed if authenticated
    // But RBAC check in Dashboard sends to "/"
    await expect(page).not.toHaveURL(/\/dashboard/);
    // Usually redirects to '/'
    await expect(page).toHaveURL(/http:\/\/localhost:8080\/?$/);
  });

  test('Show creation sends performance_date', async ({ page }) => {
    // Inject Producer Identity
    await page.addInitScript(({ user, profile }) => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
      (window as any).PlaywrightProfile = profile;
      localStorage.setItem(`stagelink_tour_seen_${user.id}`, 'true');
    }, { user: MOCK_PRODUCER_USER, profile: MOCK_PRODUCER_PROFILE });

    // Mock POST to shows
    await page.route('**/rest/v1/shows*', async (route) => {
        if (route.request().method() === 'POST') {
             const data = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ ...data, id: 'new-show-uuid' }),
            });
        } else {
            await route.continue();
        }
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Add New Show' }).click();

    // Fill form
    await page.getByLabel('Show Title *').fill('My Test Show');
    await page.getByLabel('Description').fill('A great show');

    // Date input (Type date)
    // Playwright .fill on date input expects YYYY-MM-DD
    await page.getByLabel('Show Date').fill('2024-12-25');

    await page.getByLabel('Venue').fill('Test Venue');

    // City Select (Radix UI)
    await page.click('button[role="combobox"] >> text=Select city');
    await page.click('div[role="option"] >> text=Manila');

    // Wait for request
    const requestPromise = page.waitForRequest(request => request.url().includes('/rest/v1/shows') && request.method() === 'POST');

    // Submit
    await page.getByRole('button', { name: 'Submit Show' }).click();

    const request = await requestPromise;
    const capturedPayload = request.postDataJSON();

    // Verify Payload
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.title).toBe('My Test Show');
    expect(capturedPayload.date).toBe('2024-12-25');

    // Verify performance_date is ISO string
    // "2024-12-25" -> "2024-12-25T00:00:00.000Z" (UTC midnight)
    // Note: The conversion happens in client using new Date('2024-12-25').toISOString()
    // In browser environment, new Date('YYYY-MM-DD') is UTC.
    expect(capturedPayload.performance_date).toBe('2024-12-25T00:00:00.000Z');
  });

  test('Directory lists producers', async ({ page }) => {
     // Mock Profiles Fetch for Directory
    await page.route('**/rest/v1/profiles*', async (route) => {
        const url = route.request().url();
        if (url.includes('role=eq.producer')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([MOCK_PRODUCER_PROFILE]),
            });
        } else {
            await route.continue();
        }
    });

    await page.goto('/directory');
    await expect(page.getByText('Test Theater Group')).toBeVisible();
  });

});
