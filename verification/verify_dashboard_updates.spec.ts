import { test, expect } from '@playwright/test';

test.describe('Dashboard Updates Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Mock user profile as Producer
    await page.route('**/rest/v1/profiles*', async route => {
        const url = route.request().url();
        if (url.includes('producer-user-id')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'producer-profile-id',
                    user_id: 'producer-user-id',
                    role: 'producer',
                    group_name: 'Test Group',
                    created_at: new Date().toISOString(),
                    username: 'Producer',
                    avatar_url: null
                }])
            });
        } else {
            await route.continue();
        }
    });

    // Mock Subscription (Non-Pro)
    await page.route('**/rest/v1/subscriptions*', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]) // No active subscription
        });
    });

    // Mock Shows
    await page.route('**/rest/v1/shows*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'show-1',
                    title: 'Test Show',
                    status: 'pending',
                    production_status: 'ongoing',
                    created_at: new Date().toISOString(),
                    producer_id: 'producer-profile-id',
                    is_featured: false
                }])
            });
        } else {
            await route.continue();
        }
    });

    // Mock Analytics Events (empty)
    await page.route('**/rpc/get_analytics_summary*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ views: 0, clicks: 0, ctr: 0, chartData: [] })
        });
    });
  });

  test('Producer Dashboard: Non-Pro Visual Gating', async ({ page }) => {
    // Inject authenticated user
    await page.addInitScript(() => {
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = {
        id: 'producer-user-id',
        email: 'producer@example.com',
        user_metadata: { full_name: 'Producer User' }
      };
      // Skip tour
      localStorage.setItem('stagelink_tour_seen_producer-user-id', 'true');
    });

    await page.goto('http://localhost:8080/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Verify "Analytics Overview" has Lock icon
    const analyticsTitle = page.locator('h2', { hasText: 'Analytics Overview' });
    await expect(analyticsTitle).toBeVisible();
    await expect(analyticsTitle.locator('.lucide-lock')).toBeVisible();

    // 2. Verify "Members" sidebar item has Lock icon
    const membersLink = page.getByRole('button', { name: 'Members' });
    await expect(membersLink.locator('.lucide-lock')).toBeVisible();

    // 3. Click "Members" and verify Modal
    await membersLink.click();
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('This is a Pro Feature');

    // Close modal
    await modal.getByRole('button', { name: 'Maybe Later' }).click();
    await expect(modal).not.toBeVisible();

    // 4. Verify "Promote" button in Shows tab
    // Navigate to Shows tab
    await page.getByRole('button', { name: 'My Productions' }).click();
    await expect(page.locator('text=Test Show')).toBeVisible();

    const promoteBtn = page.getByRole('button', { name: 'Promote' });
    await expect(promoteBtn).toBeVisible();
    await expect(promoteBtn.locator('.lucide-lock')).toBeVisible();

    // Click Promote and verify Modal
    await promoteBtn.click();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('This is a Pro Feature');

    await page.screenshot({ path: 'verification/producer_dashboard_gating.png' });
  });

  test('Admin: Invitation Hub Tooltip', async ({ page }) => {
      // Mock Admin
      await page.addInitScript(() => {
        (window as any).PlaywrightTest = true;
        (window as any).PlaywrightUser = {
            id: 'admin-user-id',
            email: 'admin@example.com',
            user_metadata: { full_name: 'Admin User' }
        };
      });

      // Mock Admin Profile
      await page.route('**/rest/v1/profiles*', async route => {
          if (route.request().url().includes('admin-user-id')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'admin-profile-id',
                    user_id: 'admin-user-id',
                    role: 'admin',
                    group_name: null,
                    created_at: new Date().toISOString(),
                    username: 'Admin',
                    avatar_url: null
                }])
            });
          } else {
             await route.continue();
          }
      });

      // Mock Invitations
      await page.route('**/rest/v1/invitations*', async route => {
           await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
           });
      });

      // Mock Stats
      await page.route('**/rpc/get_admin_dashboard_stats*', async route => {
           await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                    totalUsers: 0,
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

      await page.goto('http://localhost:8080/admin');

      // Navigate to Invitations (Sidebar might be collapsed, so targeting by index/icon)
      // 1. Shows, 2. Users, 3. Invitations
      await page.locator('aside nav button').nth(2).click();

      // Check for tooltip text
      await expect(page.locator('text=Tip: You can use \'email+1@gmail.com\'')).toBeVisible();

      await page.screenshot({ path: 'verification/admin_invitation_hub.png' });
  });

});
