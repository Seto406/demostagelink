
import { test, expect } from '@playwright/test';

test.describe('Admin Auto-Approve Verification', () => {
  test('admin can see auto-approve checkbox in production modal', async ({ page }) => {
    // 1. Inject PlaywrightTest flag and Mock User into Window object BEFORE app initialization
    await page.addInitScript(() => {
        // Disable tour to prevent overlay
        localStorage.setItem('stagelink_tour_active', 'false');
        localStorage.setItem('stagelink_has_seen_tour', 'true');

        // This triggers the bypass in AuthContext
        (window as any).PlaywrightTest = true;
        (window as any).PlaywrightUser = {
            id: 'admin-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@example.com',
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: new Date().toISOString()
        };
        (window as any).PlaywrightProfile = {
            id: 'admin-profile-id',
            user_id: 'admin-user-id',
            role: 'admin',
            group_name: 'Admin Group',
            description: 'Admin Profile',
            founded_year: 2020,
            niche: 'local',
            map_screenshot_url: null,
            address: '123 Admin St',
            facebook_url: null,
            instagram_url: null,
            website_url: null,
            avatar_url: null,
            rank: 'Pro',
            xp: 1000,
            university: null,
            group_logo_url: null,
            group_banner_url: null,
            producer_role: 'Director',
            has_completed_tour: true,
            username: 'adminuser',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    });

    // 2. Intercept Network Requests (Still needed for components fetching data)

    // Mock Empty Shows List (Dashboard)
    await page.route('**/rest/v1/shows*', async route => {
       await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Empty Subscriptions (Pro Check)
    await page.route('**/rest/v1/subscriptions*', async route => {
       await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Empty Theater Groups
    await page.route('**/rest/v1/theater_groups*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Empty Applications
    await page.route('**/rest/v1/group_members*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Empty Collab Requests
    await page.route('**/rest/v1/collaboration_requests*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Empty Follows
    await page.route('**/rest/v1/follows*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Profiles Query (used by Dashboard to fetch managed groups)
    await page.route('**/rest/v1/profiles*', async route => {
        // Return the admin profile for any profile query
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'admin-profile-id',
            user_id: 'admin-user-id',
            group_name: 'Admin Group',
            avatar_url: null,
            group_logo_url: null,
            group_banner_url: null,
            description: 'Admin Profile',
            founded_year: 2020,
            address: '123 Admin St'
          }])
        });
    });

    // 3. Navigate to Dashboard
    await page.goto('http://localhost:8080/dashboard');

    // Wait for the page to settle
    await page.waitForTimeout(3000);

    // Debug screenshot of dashboard
    await page.screenshot({ path: 'verification/dashboard-debug-final.png' });

    // 4. Open "Post New Production" Modal
    // The button text is "Post Show" in QuickActions
    // Use a more generic selector if specific text fails due to responsive layout
    const postShowButton = page.locator('button').filter({ hasText: 'Post a Show' });

    if (await postShowButton.count() > 0) {
        await postShowButton.first().click();
    } else {
        // Fallback: Try clicking the first primary action card if text varies
        // Or fail with screenshot
        console.log("Button not found, taking screenshot");
        await page.screenshot({ path: 'verification/button-not-found.png' });
        expect(await postShowButton.count()).toBeGreaterThan(0);
    }

    // 5. Verify Checkbox
    const modalTitle = page.getByRole('heading', { name: 'Post New Production' });
    await expect(modalTitle).toBeVisible();

    const autoApproveCheckbox = page.getByLabel('Auto-approve changes');
    await expect(autoApproveCheckbox).toBeVisible();

    // Uncheck and check to verify interactivity
    await autoApproveCheckbox.uncheck();
    await expect(autoApproveCheckbox).not.toBeChecked();
    await autoApproveCheckbox.check();
    await expect(autoApproveCheckbox).toBeChecked();

    // 6. Screenshot
    await page.screenshot({ path: 'verification/admin-auto-approve.png' });
  });
});
