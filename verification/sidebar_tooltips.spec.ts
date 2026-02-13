import { test, expect } from '@playwright/test';

test.describe('Dashboard Sidebar Tooltips', () => {
  const producerUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'producer@example.com',
    user_metadata: { full_name: 'Producer User' }
  };

  const producerProfile = {
    id: 'profile-producer',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'producer',
    group_name: 'Test Group',
    created_at: new Date().toISOString()
  };

  const mockShow = {
    id: 'show-1',
    producer_id: 'profile-producer',
    title: 'Test Show',
    status: 'approved',
    production_status: 'ongoing',
    is_featured: false,
    created_at: new Date().toISOString()
  };

  test.beforeEach(async ({ page }) => {
    // Mock Profile
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([producerProfile])
        });
    });

    // Mock Shows
    await page.route('**/rest/v1/shows*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([mockShow])
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

    // Mock Analytics (RPC)
    await page.route('**/rpc/get_analytics_summary', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ views: 100, clicks: 10, ctr: 10, chartData: [] })
        });
    });

     // Mock Group Members
    await page.route('**/rest/v1/group_members*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Inject Auth
    await page.addInitScript((user) => {
      window.PlaywrightTest = true;
      window.PlaywrightUser = user;
      // Skip tour
      localStorage.setItem(`stagelink_tour_seen_${user.id}`, 'true');
    }, producerUser);
  });

  test('Verify Tooltips on Collapsed Sidebar Buttons', async ({ page }) => {
    await page.goto('http://localhost:8080/dashboard');

    // Sidebar should be collapsed by default on desktop (width 1280)
    // Verify collapsed state by checking width or absence of text labels
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/lg:w-20/);

    // Helper to hover and verify tooltip
    const verifyTooltip = async (buttonName: string, tooltipText: string) => {
      const button = page.getByRole('button', { name: buttonName });
      await expect(button.first()).toBeVisible();

      // Hover and focus to trigger tooltip
      await button.first().hover();
      await button.first().focus();

      // Wait for tooltip delay
      await page.waitForTimeout(500);

      // Check for tooltip content
      const tooltip = page.getByRole('tooltip', { name: tooltipText });
      await expect(tooltip).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: `verification/tooltip_${buttonName.replace(/ /g, '_')}.png` });

      // Move mouse away to reset state
      await page.mouse.move(500, 300);
      await page.waitForTimeout(500);
    };

    // Verify "Dashboard"
    await verifyTooltip('Dashboard', 'Dashboard');

    // Verify "My Productions"
    await verifyTooltip('My Productions', 'My Productions');

    // Verify "Profile"
    await verifyTooltip('Profile', 'Profile');

    // Verify "Members"
    await verifyTooltip('Members', 'Members');

    // Verify "Logout"
    await verifyTooltip('Logout', 'Logout');
  });
});
