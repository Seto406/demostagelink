import { test, expect } from '@playwright/test';
import { User, CustomWindow } from './test-types';

test.describe('Favorites Performance Baseline', () => {
  const testUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
    app_metadata: { provider: 'email' },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  test.beforeEach(async ({ page }) => {
    // Inject test user
    await page.addInitScript((user) => {
      (window as unknown as CustomWindow).PlaywrightTest = true;
      (window as unknown as CustomWindow).PlaywrightUser = user;
    }, testUser);

    // Mock Health Check (RPC)
    await page.route('**/rest/v1/rpc/get_service_health', async route => {
      await route.fulfill({ json: { status: 'active' } });
    });

    // Mock profile fetch (needed for AuthContext)
    await page.route('**/rest/v1/profiles?*', async (route) => {
      const url = route.request().url();
      if (url.includes('select=*') && url.includes(`user_id=eq.${testUser.id}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'profile-id-1',
            user_id: testUser.id,
            role: 'audience',
            group_name: 'Test User'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock "approved-shows" query used by UserFeed
    // We mock 20 shows to trigger 20 potential favorite fetches
    const dummyShows = Array.from({ length: 20 }, (_, i) => ({
      id: `show-${i}`,
      title: `Show ${i}`,
      description: `Description for show ${i}`,
      date: new Date().toISOString(),
      venue: `Venue ${i}`,
      city: `City ${i}`,
      poster_url: null,
      created_at: new Date().toISOString(),
      profiles: {
        group_name: `Group ${i}`,
        id: `group-${i}`,
        avatar_url: null
      }
    }));

    await page.route('**/rest/v1/shows?*', async (route) => {
      const url = route.request().url();
      // Ensure this is the shows fetch for the feed (status=approved)
      if (url.includes('status=eq.approved')) {
         await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify(dummyShows)
         });
      } else {
         await route.continue();
      }
    });

    // Mock other requests to keep logs clean
    await page.route('**/rest/v1/producer_requests?*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/profiles?select=id,group_name,avatar_url,niche&role=eq.producer*', async route => route.fulfill({ json: [] }));
  });

  test('should reduce redundant favorites fetching', async ({ page }) => {
    let requestCount = 0;

    // Intercept favorites requests specifically fetching user's favorites
    await page.route('**/rest/v1/favorites?*', async (route) => {
        const url = route.request().url();
        // Check for 'select=show_id' and 'user_id=eq.profile-id-1'
        // Note: URL encoding might vary, so checking for key params
        if (url.includes('select=show_id') && url.includes('user_id=eq.profile-id-1')) {
             requestCount++;
             await route.fulfill({
                 status: 200,
                 contentType: 'application/json',
                 body: JSON.stringify([{ show_id: 'show-1' }])
             });
        } else {
            await route.continue();
        }
    });

    await page.goto('/feed');

    // Wait for at least one show to be visible
    await expect(page.getByRole('heading', { name: 'Show 0' })).toBeVisible({ timeout: 10000 });
    // Wait for the last show to be visible to ensure all components rendered
    await expect(page.getByRole('heading', { name: 'Show 19' })).toBeVisible();

    // Wait a bit for all effects to fire
    await page.waitForTimeout(1000);

    console.log(`Favorites requests made: ${requestCount}`);

    // Optimized assertion: requestCount should be 1 (or at most 2 due to React strict mode or initial mount quirks)
    expect(requestCount).toBeLessThanOrEqual(2);

    // Functional Verification: Ensure favorites are correctly loaded
    // show-1 was mocked as favorited
    const card1 = page.locator('.border-secondary\\/20').filter({ hasText: 'Show 1' }).first();
    const favButton1 = card1.getByRole('button', { name: 'Remove from favorites' });
    await expect(favButton1).toBeVisible();

    // show-0 was NOT favorited
    const card0 = page.locator('.border-secondary\\/20').filter({ hasText: 'Show 0' }).first();
    const favButton0 = card0.getByRole('button', { name: 'Add to favorites' });
    await expect(favButton0).toBeVisible();
  });
});
