import { test, expect } from '@playwright/test';

test.describe('Upsell Modal & Lock Icons Consolidation', () => {
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

  test('Verify UI Consolidation for Non-Pro Producer', async ({ page }) => {
    await page.goto('http://localhost:8080/dashboard');

    // 1. Verify Lock Icon on Promote Button (Shows Tab)
    // First switch to Shows tab
    await page.getByRole('button', { name: 'My Productions' }).click();

    // Check for promote button and lock icon
    const promoteBtn = page.getByRole('button', { name: 'Promote (₱500)' });
    await expect(promoteBtn).toBeVisible();

    // Inspect the button to verify it contains a lock icon
    // We look for the lucide-lock SVG inside the button
    const lockIconInPromote = promoteBtn.locator('svg.lucide-lock');
    await expect(lockIconInPromote).toBeVisible();

    // Verify clicking it opens the Upsell Modal
    await promoteBtn.click();
    await expect(page.getByText('Unlock the Full StageLink Experience')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByText('Unlock the Full StageLink Experience')).not.toBeVisible();

    // 2. Verify Lock Icon on Analytics Header (Dashboard Tab)
    await page.getByRole('button', { name: 'Dashboard' }).click();
    const analyticsHeader = page.locator('h2', { hasText: 'Analytics Overview' });
    // The lock icon is a sibling or near it.
    const analyticsLock = page.locator('.flex.items-center.gap-2').filter({ has: page.getByText('Analytics Overview') }).locator('svg.lucide-lock');
    await expect(analyticsLock).toBeVisible();

    // 3. Verify Upgrade Button in Analytics Locked State opens Modal
    const upgradeBtn = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();
    await expect(page.getByText('Unlock the Full StageLink Experience')).toBeVisible();
    await page.keyboard.press('Escape');

    // 4. Verify Sidebar Lock Icon (Collapsed State)
    // Default sidebar state on desktop is collapsed (width 20)
    const membersBtn = page.getByRole('button', { name: 'Members' });
    const sidebarLock = membersBtn.locator('svg.lucide-lock');
    await expect(sidebarLock).toBeVisible();

    // 5. Verify Clicking Members opens Modal
    await membersBtn.click();
    await expect(page.getByText('Unlock the Full StageLink Experience')).toBeVisible();
  });
});
