import { test, expect } from '@playwright/test';

test.describe('Ad Banner Rendering', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Mock Supabase Auth Session and User
    const userResponse = {
        access_token: 'fake-token',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: { id: 'test-user-id', email: 'test@example.com' },
    };

    await page.route('**/auth/v1/session', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userResponse),
        });
    });

    await page.route('**/auth/v1/user', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userResponse.user),
        });
    });

    // Mock User Profile (Producer)
    await page.route('**/rest/v1/profiles*', async (route) => {
        const url = route.request().url();
        if (url.includes('limit=5')) {
             // Suggested producers
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'p1', group_name: 'G1', role: 'producer', niche: 'local' },
                    { id: 'p2', group_name: 'G2', role: 'producer', niche: 'university' },
                ]),
            });
        } else {
             // User profile (single)
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-user-id',
                    role: 'producer',
                    group_name: 'Test Group',
                }),
            });
        }
    });

    // Mock Shows for Feed
    await page.route('**/rest/v1/shows*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: '1', title: 'Show 1', status: 'approved' },
                { id: '2', title: 'Show 2', status: 'approved' },
                { id: '3', title: 'Show 3', status: 'approved' },
            ]),
        });
    });
  });

  test('should render ads for non-pro users', async ({ page }) => {
    // Mock Non-Pro Subscription (empty array = no subscription found)
    await page.route('**/rest/v1/subscriptions*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // Check Feed
    await page.goto('http://localhost:8080/feed');
    await page.waitForTimeout(2000); // Wait for queries to settle

    // Debug URL
    console.log('Current URL:', page.url());

    // Wait for loader to disappear
    await expect(page.locator('text=Loading...')).toBeHidden({ timeout: 10000 });

    const ads = page.locator('[data-testid="ad-banner"]');
    // We expect at least one in feed (after 2nd post) and one in sidebar
    await expect(ads.first()).toBeVisible();
    const count = await ads.count();
    console.log(`Found ${count} ads on Feed page for non-pro user`);
    expect(count).toBeGreaterThanOrEqual(1);

    // Take screenshot of Feed with Ads
    console.log('Taking screenshot...');
    await page.waitForTimeout(1000); // Extra wait for visual stability
    await page.screenshot({ path: 'verification/ads_feed_non_pro.png' });

    // Check Dashboard
    await page.goto('http://localhost:8080/dashboard');
    await page.waitForTimeout(2000);

    const dashboardAds = page.locator('[data-testid="ad-banner"]');
    await expect(dashboardAds.first()).toBeVisible();

    // Take screenshot of Dashboard with Ads
    await page.screenshot({ path: 'verification/ads_dashboard_non_pro.png', fullPage: true });
  });

  test('should NOT render ads for pro users', async ({ page }) => {
    // Mock Pro Subscription
    await page.route('**/rest/v1/subscriptions*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'sub-1',
                user_id: 'test-user-id',
                status: 'active',
                tier: 'pro',
            }]),
        });
    });

    // Check Feed
    await page.goto('http://localhost:8080/feed');
    await page.waitForTimeout(2000);

    const ads = page.locator('[data-testid="ad-banner"]');
    await expect(ads).toHaveCount(0);

    // Check Dashboard
    await page.goto('http://localhost:8080/dashboard');
    await page.waitForTimeout(2000);

    const dashboardAds = page.locator('[data-testid="ad-banner"]');
    await expect(dashboardAds).toHaveCount(0);
  });
});
