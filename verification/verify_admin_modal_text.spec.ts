import { test, expect } from '@playwright/test';

test('verify admin delete user modal text', async ({ page }) => {
  // 1. Mock the authenticated admin state
  await page.addInitScript(() => {
    window.localStorage.setItem('sb-fzaq...-auth-token', JSON.stringify({
      user: {
        id: 'test-admin-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'admin@example.com',
      },
      access_token: 'fake-token',
      refresh_token: 'fake-refresh-token',
    }));

    // Inject the mock user object that the app might be looking for
    // (Based on memory: "Test scripts must inject both window.PlaywrightTest = true and a valid window.PlaywrightUser object")
    window.PlaywrightTest = true;
    window.PlaywrightUser = {
      id: 'test-admin-id',
      email: 'admin@example.com',
      app_metadata: { provider: 'email' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
  });

  // Mock the profile response to ensure the user is an admin
  await page.route('**/rest/v1/profiles*', async (route) => {
    const url = route.request().url();
    if (url.includes('user_id=eq.test-admin-id')) {
      // Mock for useAuth (logged in user)
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
        // Note: PostgREST returns array even for single() unless header is set,
        // but Supabase client handles array->single transformation if 1 item returned.
      });
    } else {
      // Mock for fetchUsers (list)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'profile-id',
            user_id: 'test-admin-id',
            role: 'admin',
            group_name: 'Admin Group',
            created_at: new Date().toISOString(),
          },
          {
            id: 'user-profile-id',
            user_id: 'test-user-id',
            role: 'audience',
            group_name: 'Regular User',
            created_at: new Date().toISOString(),
          }
        ]),
        headers: {
            'content-range': '0-1/2'
        }
      });
    }
  });

  // Mock other necessary endpoints to avoid errors
  await page.route('**/rest/v1/shows*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  });
  await page.route('**/rest/v1/producer_requests*', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  });
  // Mock stats RPC
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

  // 2. Navigate to the Admin Panel
  await page.goto('/admin');

  // 3. Switch to "User Management" tab (if not default) or ensure users are loaded
  // The default tab seems to be "shows". Click "User Management".
  // Sidebar might be collapsed, so we click the button with the Users icon.
  // We can try to find the button that would contain "User Management" if it were expanded.
  // It is the second button in the nav.
  await page.click('aside nav button:nth-child(2)');

  // 4. Click the "Delete User" (trash icon) for a user
  // We need to make sure there is a user in the list. The profile mock returned one.
  // Wait for the table to load
  await page.waitForSelector('table');

  // Click the trash icon. It's an icon-only button with title "Delete User" or just the icon.
  // Using the locator strategy from memory/analysis: find the button with the Trash2 icon.
  // Based on the code: <Button ... title="Delete User"><Trash2 ... /></Button>
  await page.click('button[title="Delete User"]');

  // 5. Verify the modal content
  const modal = page.locator('div[role="dialog"]');
  await expect(modal).toBeVisible();

  // Check for the CORRECT text
  await expect(modal).toContainText('StageLink Admin Security Key');
  await expect(page.locator('input[placeholder="Enter StageLink Admin Security Key"]')).toBeVisible();

  // Check that the WRONG text is NOT present
  const bodyText = await page.textContent('body');
  expect(bodyText).not.toContain('dev password');
  expect(bodyText).not.toContain('Enter dev password');

  // Take a screenshot for verification
  await page.screenshot({ path: 'verification/admin_modal_verified.png', fullPage: true });
});
