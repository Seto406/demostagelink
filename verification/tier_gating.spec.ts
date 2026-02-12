import { test, expect } from '@playwright/test';

test.describe('Tier Gating Verification', () => {

  test.beforeEach(async ({ page }) => {
     // Mock Profiles query for Producer
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
                    group_name: 'Test Theater Group',
                    created_at: new Date().toISOString(),
                    username: 'Producer',
                    avatar_url: null
                }])
            });
        } else {
            await route.continue();
        }
     });

     // Mock Subscriptions (Return null/empty for Basic Tier)
     await page.route('**/rest/v1/subscriptions*', async route => {
          await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]) // No subscription
            });
     });

     // Mock Shows (Return one show for Promote testing)
      await page.route('**/rest/v1/shows*', async route => {
           await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'show-123',
                    title: 'Test Show',
                    description: 'A test show',
                    date: new Date().toISOString(),
                    venue: 'Test Venue',
                    city: 'Manila',
                    niche: 'local',
                    status: 'approved',
                    production_status: 'ongoing',
                    producer_id: 'producer-profile-id',
                    is_featured: false, // Not featured, so promote button should show
                    created_at: new Date().toISOString()
                }])
            });
      });

      // Mock Analytics RPC
      await page.route('**/rpc/get_analytics_summary', async route => {
           await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    views: 0,
                    clicks: 0,
                    ctr: 0,
                    chartData: []
                })
            });
      });
  });

  test('Basic Producer Dashboard - Tier Gating', async ({ page }) => {
    // Inject Producer User
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

    // Open sidebar to ensure labels and icons are visible
    const sidebarToggle = page.getByLabel('Open sidebar');
    if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await page.waitForTimeout(500); // Wait for animation
    }

    // 1. Verify "Analytics Overview" has Lock icon
    const analyticsHeader = page.getByRole('heading', { name: 'Analytics Overview' });
    await expect(analyticsHeader).toBeVisible();
    // Check for lock icon nearby (sibling or child of container)
    // The implementation is:
    // <div className="flex items-center gap-2">
    //   <h2 ...>Analytics Overview</h2>
    //   {!isPro && <Lock ... />}
    // </div>
    const analyticsLockIcon = page.locator('h2:has-text("Analytics Overview") + svg.lucide-lock');
    await expect(analyticsLockIcon).toBeVisible();

    // 2. Verify "Members" sidebar tab has Lock icon
    const membersTab = page.getByRole('button', { name: 'Members' });
    await expect(membersTab).toBeVisible();
    const membersLock = membersTab.locator('svg.lucide-lock');
    await expect(membersLock).toBeVisible();

    // 3. Click "Members" -> Verify Upsell Modal
    await membersTab.click();
    const modalTitle = page.getByRole('heading', { name: 'Unlock the Full StageLink Experience' });
    await expect(modalTitle).toBeVisible();

    // Close Modal
    await page.keyboard.press('Escape');
    await expect(modalTitle).not.toBeVisible();

    // 4. Navigate to "My Productions" tab (should be accessible)
    const showsTab = page.getByRole('button', { name: 'My Productions' });
    await showsTab.click();

    // 5. Verify "Promote" button has Lock icon
    // Wait for shows to load
    await page.waitForTimeout(1000);
    const promoteButton = page.getByRole('button', { name: 'Promote (₱500)' });
    await expect(promoteButton).toBeVisible();
    const promoteLock = promoteButton.locator('svg.lucide-lock');
    await expect(promoteLock).toBeVisible();

    // 6. Click "Promote" -> Verify Upsell Modal
    await promoteButton.click();
    await expect(modalTitle).toBeVisible();

    await page.screenshot({ path: 'verification/tier_gating_success.png' });
  });
});
