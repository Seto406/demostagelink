import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {
        avatar_url: 'https://example.com/avatar.jpg',
        full_name: 'Test Producer',
    },
    created_at: new Date().toISOString(),
  };

  const mockSession = {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    expires_in: 3600,
    user: mockUser,
    token_type: 'bearer'
  };

  const mockProfile = {
    id: 'test-group-id',
    user_id: 'test-user-id',
    username: 'testproducer',
    group_name: 'Test Group',
    role: 'producer',
    has_completed_onboarding: true,
    avatar_url: null,
    group_logo_url: null,
    group_banner_url: null,
    description: 'Test Description',
    founded_year: 2020,
    address: 'Test Address'
  };

  const mockSubscription = {
    id: 'sub_123',
    user_id: 'test-user-id',
    status: 'active',
    tier: 'pro',
    current_period_end: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  };

  const mockAnalytics = {
    views: 123,
    clicks: 45,
    ctr: 36.5,
    chartData: [
      { date: '2023-10-26', clicks: 10 },
      { date: '2023-10-27', clicks: 20 },
      { date: '2023-10-28', clicks: 15 },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // 1. Mock Supabase Auth Routes
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ json: mockUser });
    });

    await page.route('**/auth/v1/session', async (route) => {
        await route.fulfill({ json: mockSession });
    });

    await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
        await route.fulfill({ json: mockSession });
    });

    // 2. Mock Application Data Routes

    // Profiles
    await page.route('**/rest/v1/profiles*', async (route) => {
       await route.fulfill({ json: [mockProfile] });
    });

    // Subscriptions - default to active
    await page.route('**/rest/v1/subscriptions*', async (route) => {
      await route.fulfill({ json: [mockSubscription] });
    });

    // Analytics RPC
    await page.route('**/rpc/get_analytics_summary', async (route) => {
      await route.fulfill({ json: mockAnalytics });
    });

    // Pending Tickets Count
    await page.route('**/rest/v1/tickets*', async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      console.log(`Intercepted tickets request: ${method} ${route.request().url()}`);
      console.log('Headers:', JSON.stringify(headers));

      // Supabase JS sends Prefer: count=exact for count queries
      if (method === 'HEAD' || headers['prefer']?.includes('count=exact') || route.request().url().includes('count=exact')) {
          await route.fulfill({
              headers: {
                  'content-range': '0-4/5',
                  'content-type': 'application/json',
                  'access-control-expose-headers': 'content-range'
              },
              status: 200,
              json: [] // Return empty array as body, count is in header
          });
      } else {
          await route.continue();
      }
    });

    // Other dashboard data
    await page.route('**/rest/v1/shows*', async (route) => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/group_members*', async (route) => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/collaboration_requests*', async (route) => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/follows*', async (route) => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/notifications*', async (route) => {
        await route.fulfill({ json: [] });
    });

    // Inject session and Playwright globals for AuthContext
    await page.addInitScript(({ session, user, profile }) => {
        const projectId = 'dssbduklgbmxezpjpuen'; // from .env
        window.localStorage.setItem(`sb-${projectId}-auth-token`, JSON.stringify(session));

        // Mock AuthContext
        (window as any).PlaywrightTest = true;
        (window as any).PlaywrightUser = user;
        (window as any).PlaywrightProfile = profile;
    }, { session: mockSession, user: mockUser, profile: mockProfile });
  });

  test('should display analytics data for Pro user', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for dashboard content
    await expect(page.getByText('Test Group')).toBeVisible({ timeout: 10000 });

    // Verify Stats
    await expect(page.getByText('Total Profile Views')).toBeVisible();
    await expect(page.getByText('123')).toBeVisible();

    await expect(page.getByText('Total Ticket Clicks')).toBeVisible();
    await expect(page.getByText('45')).toBeVisible();

    await expect(page.getByText('Click-Through Rate')).toBeVisible();
    await expect(page.getByText('36.5%')).toBeVisible();

    // Verify Chart
    await expect(page.getByText('Ticket Clicks (Last 7 Days)')).toBeVisible();

    // Verify Pending Tickets Warning (mocked count=5)
    await expect(page.getByText('Pending Ticket Verifications')).toBeVisible();
    await expect(page.getByText('You have 5 tickets')).toBeVisible();

    // Check Analyze button works (scrolls)
    const analyzeBtn = page.getByRole('button', { name: 'Analyze Production' });
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();
    // (Playwright can't easily assert scroll position, but clicking shouldn't fail)
  });

  test('should show locked state for non-Pro user', async ({ page }) => {
    // Override subscription mock to inactive
    await page.route('**/rest/v1/subscriptions*', async (route) => {
      await route.fulfill({ json: [{ ...mockSubscription, status: 'inactive' }] });
    });

    await page.goto('/dashboard');

    // Wait for dashboard content
    await expect(page.getByText('Test Group')).toBeVisible({ timeout: 10000 });

    // Check for locked message
    await expect(page.getByText('Detailed Analytics Locked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upgrade to Pro' })).toBeVisible();

    // Verify stats are NOT visible (they are blurred/hidden behind overlay)
    // The component renders the card but with overlay. The text "123" should not be in the document or hidden.
    // The component logic for !isPro renders a completely different structure inside the card.
    await expect(page.getByText('Total Profile Views')).not.toBeVisible();
  });
});
