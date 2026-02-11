import { test, expect } from '@playwright/test';

test.describe('Visual Verification', () => {

  test.beforeEach(async ({ page }) => {
     // Mock Profiles query
     // The app usually does select(*) so we mock that.
     // Also need to handle user_id filter.
     await page.route('**/rest/v1/profiles*', async route => {
        const url = route.request().url();
        if (url.includes('admin-user-id')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ // Supabase returns array
                    id: 'admin-profile-id',
                    user_id: 'admin-user-id',
                    role: 'admin',
                    group_name: null,
                    created_at: new Date().toISOString(),
                    username: 'Admin',
                    avatar_url: null
                }])
            });
        } else if (url.includes('audience-user-id')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'audience-profile-id',
                    user_id: 'audience-user-id',
                    role: 'audience',
                    group_name: null,
                    created_at: new Date().toISOString(),
                    username: 'Audience',
                    avatar_url: null
                }])
            });
        } else {
            await route.continue();
        }
     });

     // Mock RPC stats
     await page.route('**/rpc/get_admin_dashboard_stats', async route => {
          await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    totalUsers: 123,
                    totalShows: 45,
                    activeProducers: 12,
                    pendingRequests: 3,
                    deletedShows: 5,
                    pendingShows: 3,
                    approvedShows: 40,
                    rejectedShows: 2
                })
            });
     });

     // Mock Shows
      await page.route('**/rest/v1/shows*', async route => {
           await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
      });

      // Mock Producer Requests
       await page.route('**/rest/v1/producer_requests*', async route => {
           await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
      });
  });

  test('Admin Dashboard UI Polish', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        user_metadata: { full_name: 'Admin User' }
      };
    });

    await page.goto('http://localhost:8080/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for potential animations
    await page.screenshot({ path: 'verification/admin_dashboard.png', fullPage: true });
  });

  test('Admin User Feed - No Producer Access Button', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        user_metadata: { full_name: 'Admin User' }
      };
    });

    await page.goto('http://localhost:8080/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).not.toContainText('Are you a theater group?');
    await page.screenshot({ path: 'verification/admin_feed.png' });
  });

   test('Audience User Feed - Has Producer Access Button', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = {
        id: 'audience-user-id',
        email: 'audience@example.com',
        user_metadata: { full_name: 'Audience User' }
      };
    });

    await page.goto('http://localhost:8080/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toContainText('Are you a theater group?');
    await page.screenshot({ path: 'verification/audience_feed.png' });
  });
});
