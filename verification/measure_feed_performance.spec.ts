import { test, expect } from '@playwright/test';

test('Measure N+1 requests on Feed', async ({ page }) => {
  // Mock auth
  await page.route('**/auth/v1/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      })
    });
  });

  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-user-id', email: 'test@example.com' })
    });
  });

  // Mock profile (for user_id check in AuthContext)
  await page.route('**/rest/v1/profiles?select=*&user_id=eq.test-user-id*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
          id: 'profile-id',
          user_id: 'test-user-id',
          role: 'audience',
          group_name: 'Test User'
      })
    });
  });

  // Mock profile (for id check if any)
  await page.route('**/rest/v1/profiles?select=*&id=eq.test-user-id*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
          id: 'test-user-id',
          user_id: 'test-user-id',
          role: 'audience'
      }])
    });
  });

  // Mock subscription check
  await page.route('**/functions/v1/check-subscription*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ isPro: false })
    });
  });

  // Mock service health check
  await page.route('**/rpc/get_service_health', async (route) => {
      await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      });
  });

  // Mock suggested producers
  await page.route('**/rest/v1/profiles?select=id,group_name,avatar_url,niche&role=eq.producer&limit=5', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Mock existing producer request
  await page.route('**/rest/v1/producer_requests?select=status&user_id=eq.test-user-id&limit=1', async (route) => {
     await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null'
     });
  });

  // Intercept shows request
  const showCount = 20;
  await page.route('**/rest/v1/shows?select=*&status=eq.approved&order=created_at.desc&limit=20', async (route) => {
    const shows = Array.from({ length: showCount }, (_, i) => ({
      id: `show-${i}`,
      title: `Show ${i}`,
      description: `Description ${i}`,
      date: new Date().toISOString(),
      venue: 'Venue',
      city: 'City',
      poster_url: null,
      created_at: new Date().toISOString(),
      producer_id: 'producer-id',
      profiles: {
          group_name: 'Group',
          id: 'producer-id',
          avatar_url: null
      },
      favorites: i === 0 ? [{ count: 42 }] : []
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(shows)
    });
  });

  // Count favorites count requests
  let favoritesCountRequests = 0;

  // Also capture the HEAD requests or GET requests with count params
  // The pattern in FeedPost is: .from('favorites').select('*', { count: 'exact', head: true }).eq('show_id', show.id)
  // This typically generates a HEAD request to /rest/v1/favorites?show_id=eq.xxx&select=*
  // Or GET with Prefer: count=exact, head=true (which results in empty body)

  await page.route('**/rest/v1/favorites*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // We want to count requests that are fetching the count for a specific show
    // These requests have show_id=eq.xxx
    if (url.includes('show_id=eq.show-') && (method === 'HEAD' || url.includes('head=true') || route.request().headerValue('prefer')?.includes('count=exact'))) {
      favoritesCountRequests++;
      await route.fulfill({
        status: 200,
        headers: {
            'Content-Range': '0-0/5',
            'Range-Unit': 'items'
        },
        body: '' // Empty body for HEAD/count request
      });
    } else if (url.includes('user_id=eq.test-user-id') && url.includes('select=show_id')) {
        // This is the useFavorites hook fetching the user's favorites list
        await route.fulfill({
            status: 200,
            body: JSON.stringify([])
        });
    } else {
        await route.continue();
    }
  });

  // Inject auth session and Playwright flags
  await page.addInitScript(() => {
    (window as any).PlaywrightTest = true;
    (window as any).PlaywrightUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
    };

    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: {
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    }));
  });

  // Navigate
  await page.goto('/feed');

  // Wait for feed to load (last show visible)
  // Scroll to bottom to ensure all requests are triggered if there's lazy loading (though FeedPost renders all by default)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  try {
      await expect(page.getByText(`Show 0`)).toBeVisible({ timeout: 5000 });
      console.log('First show visible');

      // Verify like count for Show 0 is 42
      await expect(page.getByText('42', { exact: true })).toBeVisible();

      // Wait a bit for other requests
      await page.waitForTimeout(2000);

      console.log(`Favorites count requests detected: ${favoritesCountRequests}`);
  } catch (e) {
      console.log('Failed to see shows. Taking screenshot.');
      await page.screenshot({ path: 'verification/feed_debug.png' });
      throw e;
  }

  // Assert N+1 behavior is GONE
  // We expect 0 requests because data is pre-fetched
  console.log(`Favorites count requests detected: ${favoritesCountRequests}`);
  expect(favoritesCountRequests).toBe(0);
});
