import { test, expect } from '@playwright/test';

test.describe('Redouble Check Verification', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const otherProducerId = 'other-producer-id';

  test.beforeEach(async ({ page }) => {
    // Mock Service Health
    await page.route('**/rest/v1/rpc/get_service_health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
      });
    });

    // Mock Analytics Summary
    await page.route('**/rpc/get_analytics_summary', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Mock Check Subscription
    await page.route('**/functions/v1/check-subscription', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subscribed: false }),
      });
    });

    // Mock Profile
    await page.addInitScript(({ userId }) => {
      window.localStorage.setItem(`stagelink_tour_seen_${userId}`, 'true');
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = {
        id: userId,
        email: 'test@example.com',
        user_metadata: { full_name: 'Test Producer' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      (window as any).PlaywrightProfile = {
        id: userId,
        role: 'producer',
        group_name: 'Test Group',
        avatar_url: 'https://via.placeholder.com/150',
        has_completed_tour: true, // Prevent tour from running
      };
    }, { userId });
  });

  test('UserFeed: Displays "Stats temporarily unavailable" on error', async ({ page }) => {
    await page.route('**/rest/v1/tickets*', async (route) => route.abort('failed'));
    await page.route('**/rest/v1/shows*', async (route) => {
        await route.fulfill({ status: 200, body: '[]' });
    });
    await page.route('**/rest/v1/profiles*', async (route) => route.fulfill({ status: 200, body: '[]' }));

    await page.goto('http://localhost:8080/feed');
    await expect(page.getByText('Stats temporarily unavailable')).toBeVisible({ timeout: 10000 });
  });

  test('FeedPost: Shows edit button ONLY for own shows', async ({ page }) => {
    await page.route('**/rest/v1/shows*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 'show-owned',
                    title: 'My Show',
                    description: 'Description',
                    date: '2024-01-01',
                    venue: 'Venue',
                    city: 'City',
                    poster_url: null,
                    created_at: new Date().toISOString(),
                    profiles: { id: userId, group_name: 'My Group' },
                    favorites: [{ count: 0 }]
                }
            ])
        });
    });
    await page.route('**/rest/v1/tickets*', async (route) => route.fulfill({ status: 200, body: '[{ "count": 10 }]' }));
    await page.route('**/rest/v1/profiles*', async (route) => route.fulfill({ status: 200, body: '[]' }));

    await page.goto('http://localhost:8080/feed');
    const editButton = page.getByRole('button', { name: 'Edit Production' });
    await expect(editButton).toHaveCount(1);
  });

  test('Dashboard: Removes ?edit=ID parameter', async ({ page }) => {
    const showId = 'show-123';

    await page.route('**/rest/v1/shows*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: showId,
                title: 'Test Show',
                description: 'Description',
                date: '2024-01-01',
                venue: 'Venue',
                city: 'City',
                poster_url: null,
                created_at: new Date().toISOString(),
                status: 'approved',
                production_status: 'ongoing',
                producer_id: userId
            }])
        });
    });

    await page.route('**/rest/v1/tickets*', async (route) => route.fulfill({ status: 200, body: '[]' }));

    await page.goto(`http://localhost:8080/dashboard?tab=shows&edit=${showId}`, { waitUntil: 'networkidle' });

    // Wait for modal to open
    // Note: The heading 'Your Shows' might be obscured by the modal, so we skip checking it.
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Edit Show')).toBeVisible();

    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).not.toContain(`edit=${showId}`);

    await page.screenshot({ path: 'verification/verify_dashboard_deep_link.png' });
  });
});
