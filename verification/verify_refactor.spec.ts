import { test, expect } from '@playwright/test';

test('Verify Dashboard and UserFeed Refactor', async ({ page }) => {
  // Mock the health check RPC
  await page.route('**/rpc/get_service_health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    });
  });

  // Mock Shows RPC
  await page.route('**/rest/v1/shows*', async route => {
    console.log('Intercepted shows request:', route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '1',
          title: 'Refactored Show',
          description: 'This show is fetched via React Query',
          status: 'approved',
          producer_id: 'producer1',
          created_at: new Date().toISOString(),
          production_status: 'ongoing',
          is_featured: false,
          poster_url: 'https://placehold.co/400',
        }
      ]),
    });
  });

  // Mock Profile for Dashboard
  await page.addInitScript(() => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: {
        access_token: 'mock-token',
        user: { id: 'producer1', email: 'producer@example.com', role: 'authenticated' }
      }
    }));
    // Inject mock user for AuthContext
    (window as any).PlaywrightTest = true;
    (window as any).PlaywrightUser = {
      id: 'producer1',
      email: 'producer@example.com',
      user_metadata: { full_name: 'Test Producer' }
    };
    // Disable tour guide
    window.localStorage.setItem('stagelink_tour_seen_producer1', 'true');
  });

  // Also mock profiles endpoint
   await page.route('**/rest/v1/profiles*', async route => {
    const headers = route.request().headers();
    const mockProfile = {
        id: 'producer1',
        user_id: 'producer1',
        role: 'producer',
        group_name: 'Test Group',
        created_at: new Date().toISOString(),
    };

    if (headers['accept']?.includes('vnd.pgrst.object')) {
         await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProfile),
        });
    } else {
         await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockProfile]),
        });
    }
  });

  // Navigate to Dashboard
  console.log('Navigating to dashboard...');
  await page.goto('/dashboard');

  // Verify stats (should show 1 approved)
  await expect(page.locator('#dashboard-stats').getByText('1').first()).toBeVisible();

  // Try to open sidebar if collapsed
  // Check if "My Productions" text is visible
  if (!await page.getByText('My Productions').isVisible()) {
      console.log('Sidebar closed, opening...');
      // Try to find the toggle button
      const toggle = page.locator('button[aria-label="Open sidebar"]');
      if (await toggle.isVisible()) {
          await toggle.click();
      } else {
          // Maybe it's just icon only mode on desktop and text is never visible unless hovered?
          // Or maybe I should just find the button by index.
          // Let's try to click the second button in the sidebar nav.
          console.log('Toggle not found or visible, trying to click icon...');
          // Assuming sidebar is <aside><nav><button>...
          await page.locator('aside nav button').nth(1).click();
      }
  }

  // Now try to click "My Productions" if visible, otherwise we already clicked the icon
  if (await page.getByText('My Productions').isVisible()) {
      await page.click('text=My Productions');
  }

  // Verify Dashboard loads and shows the show in the list
  await expect(page.getByText('Refactored Show')).toBeVisible({ timeout: 5000 });

  // Take screenshot
  await page.screenshot({ path: 'verification/dashboard_refactor.png' });

  // Navigate to UserFeed
  console.log('Navigating to feed...');
  await page.goto('/feed');

  // Verify UserFeed loads
  await expect(page.getByText('Refactored Show')).toBeVisible({ timeout: 5000 });

  // Take screenshot
  await page.screenshot({ path: 'verification/userfeed_refactor.png' });
});
