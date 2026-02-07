import { test, expect } from '@playwright/test';
import { User, CustomWindow } from './test-types';

test.describe('Admin Stats Performance', () => {
  const adminUser: User = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@stagelink.show',
    user_metadata: { full_name: 'Admin User' },
    app_metadata: { provider: 'email' },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  test.beforeEach(async ({ page }) => {
    // Inject admin user
    await page.addInitScript((user) => {
      (window as unknown as CustomWindow).PlaywrightTest = true;
      (window as unknown as CustomWindow).PlaywrightUser = user;
    }, adminUser);

    // Mock profile as admin
    await page.route('**/rest/v1/profiles?*', async (route) => {
      const url = route.request().url();
      console.log('Profile request intercepted:', url);
      if (url.includes('select=*') && url.includes(`user_id=eq.${adminUser.id}`)) {
        console.log('Fulfilling profile request as admin');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'profile-id-1',
            user_id: adminUser.id,
            role: 'admin',
            group_name: 'Admin Group'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock initial data load (shows, requests, etc.) to prevent errors
    await page.route('**/rest/v1/shows?*', async (route) => {
        const url = route.request().url();
        if (!url.includes('count=exact')) {
             await route.fulfill({ json: [] });
        } else {
            await route.continue();
        }
    });
    await page.route('**/rest/v1/producer_requests?*', async (route) => {
        const url = route.request().url();
        if (!url.includes('count=exact')) {
             await route.fulfill({ json: [] });
        } else {
            await route.continue();
        }
    });
  });

  test('should load stats using multiple requests (baseline)', async ({ page }) => {
    // Force RPC to fail so it falls back to multiple requests
    await page.route('**/rest/v1/rpc/get_admin_dashboard_stats', async (route) => {
        await route.fulfill({ status: 500 });
    });

    // Mock the 8 stats requests
    let requestCount = 0;

    await page.route('**/rest/v1/*', async (route) => {
        const url = route.request().url();
        const headers = route.request().headers();
        const prefer = headers['prefer'] || '';

        // Only intercept stats requests (they select ONLY 'id')
        // We use regex to ensure 'id' is not followed by other fields (comma or %2C)
        const isIdOnlySelect = /select=(%22)?id(%22)?(&|$)/.test(url);

        if (prefer.includes('count=exact') && isIdOnlySelect) {
             requestCount++;
             // Simulate network delay
             await new Promise(r => setTimeout(r, 50));
             await route.fulfill({
                 status: 200,
                 headers: {
                    'Content-Range': '0-0/100',
                    'Access-Control-Expose-Headers': 'Content-Range'
                 },
                 body: JSON.stringify([{ id: '00000000-0000-0000-0000-000000000000' }])
             });
        } else {
            await route.fallback();
        }
    });

    const startTime = Date.now();
    await page.goto('/admin');
    console.log('Navigated to:', page.url());

    // Wait for stats to appear
    await expect(page.getByText('Total Users')).toBeVisible({ timeout: 10000 });

    // Check what is actually rendered for Total Users
    // Locate the paragraph with "Total Users" and get its sibling
    const totalUsersCount = page.getByText('Total Users', { exact: true }).locator('xpath=following-sibling::p');
    await expect(totalUsersCount).toBeVisible();

    // All stats should show 100
    await expect(totalUsersCount).toHaveText('100');

    // We expect at least 8 requests for stats
    expect(requestCount).toBeGreaterThanOrEqual(8);
  });

  test('should load stats using RPC (optimized)', async ({ page }) => {
    // Mock RPC
    let rpcCalled = false;
    await page.route('**/rest/v1/rpc/get_admin_dashboard_stats', async (route) => {
        rpcCalled = true;
        // Simulate network delay (same as 1 request)
        await new Promise(r => setTimeout(r, 50));
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                totalUsers: 100,
                totalShows: 50,
                activeProducers: 10,
                pendingRequests: 5,
                deletedShows: 2,
                pendingShows: 3,
                approvedShows: 40,
                rejectedShows: 5
            })
        });
    });

    let fallbackRequestCount = 0;

    // Catch fallback requests
    await page.route('**/rest/v1/*', async (route) => {
        const url = route.request().url();
        const headers = route.request().headers();
        const prefer = headers['prefer'] || '';

        // Only intercept stats requests (they select ONLY 'id')
        const isIdOnlySelect = /select=(%22)?id(%22)?(&|$)/.test(url);

        if (prefer.includes('count=exact') && isIdOnlySelect) {
             fallbackRequestCount++;
             await route.fulfill({
                 status: 200,
                 headers: {
                    'Content-Range': '0-0/0',
                    'Access-Control-Expose-Headers': 'Content-Range'
                 },
                 body: JSON.stringify([])
             });
        } else {
            await route.fallback();
        }
    });

    const startTime = Date.now();
    await page.goto('/admin');

    // Check Total Users
    // Locate the paragraph with "Total Users" and get its sibling
    const totalUsersCount = page.getByText('Total Users', { exact: true }).locator('xpath=following-sibling::p');
    await expect(totalUsersCount).toBeVisible();
    await expect(totalUsersCount).toHaveText('100');

    // Check another stat to be sure
    const totalShowsCount = page.getByText('Total Productions', { exact: true }).locator('xpath=following-sibling::p');
    await expect(totalShowsCount).toHaveText('50');

    expect(rpcCalled).toBe(true);
    expect(fallbackRequestCount).toBe(0);
  });
});
