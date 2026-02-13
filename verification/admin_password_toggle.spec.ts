import { test, expect } from '@playwright/test';

test('verify admin password toggle functionality', async ({ page }) => {
  // Mock User
  const mockUser = {
    id: 'test-admin-id',
    email: 'admin@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  await page.addInitScript((user) => {
    window.PlaywrightTest = true;
    window.PlaywrightUser = user;
  }, mockUser);

  // Mock Profile (Admin)
  await page.route('**/rest/v1/profiles*', async (route) => {
    const url = route.request().url();
    if (url.includes('user_id=eq.test-admin-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'profile-id',
          user_id: 'test-admin-id',
          role: 'admin',
          group_name: 'Admin Group',
          created_at: new Date().toISOString(),
        }]),
      });
    } else {
      // Fallback for any other profile requests
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
  });

  // Mock get_admin_user_list RPC
  await page.route('**/rpc/get_admin_user_list', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            id: 'user-profile-id',
            user_id: 'test-user-id',
            email: 'user@example.com',
            role: 'audience',
            group_name: 'Regular User',
            created_at: new Date().toISOString(),
          }
        ],
        total_count: 1
      })
    });
  });

  // Mock Shows (empty)
  await page.route('**/rest/v1/shows*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  });

  // Mock Producer Requests (empty)
  await page.route('**/rest/v1/producer_requests*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  });

  // Mock Stats RPC
  await page.route('**/rpc/get_admin_dashboard_stats', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        totalUsers: 1,
        totalShows: 0,
        activeProducers: 0,
        pendingRequests: 0,
        deletedShows: 0,
        pendingShows: 0,
        approvedShows: 0,
        rejectedShows: 0
      })
    });
  });

  // Navigate
  await page.goto('/admin');

  // Go to Users tab (2nd button in nav)
  await page.click('aside nav button:nth-child(2)');
  await page.waitForSelector('table');

  // Click Delete User
  await page.click('button[title="Delete User"]');

  // Verify
  const passwordInput = page.locator('input[placeholder="Enter StageLink Admin Security Key"]');
  const toggleButton = page.locator('button[aria-label="Show password"]');

  await expect(passwordInput).toBeVisible();
  await expect(passwordInput).toHaveAttribute('type', 'password');
  await expect(toggleButton).toBeVisible();

  // Click toggle: show password
  await toggleButton.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
  await page.screenshot({ path: 'verification/admin_password_visible.png' });

  // Verify button label changes
  const hideButton = page.locator('button[aria-label="Hide password"]');
  await expect(hideButton).toBeVisible();

  // Click toggle: hide password
  await hideButton.click();
  await expect(passwordInput).toHaveAttribute('type', 'password');
  await expect(toggleButton).toBeVisible();
  await page.screenshot({ path: 'verification/admin_password_hidden.png' });
});
