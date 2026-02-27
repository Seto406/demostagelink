import { test, expect } from '@playwright/test';

test('Admin Panel - New vs Edited Shows', async ({ page }) => {
  // 1. Initialize localStorage for Tour Skip
  await page.addInitScript(() => {
    localStorage.setItem('stagelink_tour_active', 'false');
    localStorage.setItem('stagelink_tour_step_index', '10');
  });

  // 2. Inject Mock Admin User via window object (Bypassing Auth0/Supabase Auth)
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightTest = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightUser = {
      id: 'admin-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'admin@example.com',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightProfile = {
      id: 'admin-profile-id',
      user_id: 'admin-user-id',
      role: 'admin',
      group_name: 'Admin Group',
    };
  });

  // 3. Mock the dashboard stats RPC
  await page.route('**/rest/v1/rpc/get_admin_dashboard_stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalUsers: 100,
        totalShows: 50,
        activeProducers: 20,
        pendingRequests: 5,
        deletedShows: 2,
        pendingNewShows: 3,
        pendingEditedShows: 2,
        approvedShows: 40,
        rejectedShows: 5,
      }),
    });
  });

  // 4. Mock the producer requests fetch (to avoid errors)
  await page.route('**/rest/v1/producer_requests*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // 5. Mock the shows fetch - Scenario 1: New Pending Shows
  await page.route('**/rest/v1/shows*', async (route) => {
    const url = route.request().url();

    // Check if filtering for "New Pending" (is_update=false)
    if (url.includes('is_update=eq.false')) {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'show-1',
            title: 'New Show Submission',
            description: 'A brand new show.',
            date: '2024-12-25',
            venue: 'Main Stage',
            city: 'New York',
            niche: 'local',
            status: 'pending',
            created_at: '2024-11-01T10:00:00Z',
            updated_at: '2024-11-01T10:00:00Z',
            is_update: false,
            producer_id: 'producer-1',
            poster_url: null,
            deleted_at: null,
            seo_metadata: null,
            profiles: { group_name: 'Theater Group A' }
          }
        ]),
         headers: {
            'content-range': '0-0/1'
         }
      });
      return;
    }

    // Check if filtering for "Edit Requests" (is_update=true)
    if (url.includes('is_update=eq.true')) {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'show-2',
            title: 'Edited Show',
            description: 'An updated show description.',
            date: '2024-12-30',
            venue: 'Side Stage',
            city: 'Chicago',
            niche: 'university',
            status: 'pending',
            created_at: '2024-10-01T10:00:00Z',
            updated_at: '2024-11-02T12:00:00Z', // Updated later
            is_update: true,
            producer_id: 'producer-2',
            poster_url: null,
            deleted_at: null,
            seo_metadata: null,
            profiles: { group_name: 'Theater Group B' }
          }
        ]),
         headers: {
            'content-range': '0-0/1'
         }
      });
      return;
    }

    // Default empty for other queries
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
        headers: {
            'content-range': '0-0/0'
         }
    });
  });

  // 6. Navigate to Admin Panel
  await page.goto('/admin');

  // 7. Verify Stats Widget
  await expect(page.getByText('New Pending')).toBeVisible();
  await expect(page.getByText('Edit Requests')).toBeVisible();

  // Verify counts in the tabs/buttons
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible(); // Pending New Shows count
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible(); // Pending Edited Shows count

  // 8. Verify "New Pending" Tab Content
  // It should be selected by default (based on implementation)
  await expect(page.getByText('New Show Submission')).toBeVisible();
  await expect(page.getByText('Theater Group A')).toBeVisible();
  await expect(page.getByText('NEW', { exact: true })).toBeVisible(); // The badge
  await expect(page.getByText('Submission', { exact: true })).toBeVisible(); // The sub-label

  // 9. Click "Edit Requests" Tab
  await page.getByText('Edit Requests').click();

  // 10. Verify "Edit Requests" Tab Content
  await expect(page.getByText('Edited Show')).toBeVisible();
  await expect(page.getByText('Theater Group B')).toBeVisible();
  await expect(page.getByText('EDIT', { exact: true })).toBeVisible(); // The badge
  await expect(page.getByText('Update Request', { exact: true })).toBeVisible(); // The sub-label

  // 11. Verify Action Button differences
  // New should have simple check/x
  await page.getByText('New Pending').click();
  await expect(page.locator('button[title="Approve"]')).toBeVisible();

  // Edit should have "Approve Edit" button
  await page.getByText('Edit Requests').click();
  await expect(page.locator('button[title="Approve Update"]')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'admin-panel-tabs.png', fullPage: true });
});
