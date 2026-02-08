import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Visual Feed Sidebar Verification', () => {

    // Mock Data
    const mockUser: User = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User', avatar_url: null },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockSession: Session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
    };

    // Setup function
    const setupMocks = async (page: Page) => {
        // Window injection
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.mockUser;
            localStorage.setItem(`stagelink_tour_seen_${data.mockUser.id}`, 'true');
        }, { mockUser });

        // Auth mocks
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockSession)
            });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockUser)
            });
        });

        // Profile mock
        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: mockUser.id,
                    role: 'producer',
                    group_name: 'Test Group',
                    username: 'testuser'
                })
            });
        });

        // Shows mock (empty list is fine)
        await page.route('**/rest/v1/shows*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/0' },
                body: JSON.stringify([])
            });
        });

        // Notifications mock
         await page.route('**/rest/v1/notifications*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/0' },
                body: JSON.stringify([])
            });
        });
    };

    test.beforeEach(async ({ page }) => {
        await setupMocks(page);
    });

    test('Sidebar visual verification (Producer)', async ({ page }) => {
        // Set viewport size to ensure sidebar is visible (desktop)
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.goto('/feed');
        await expect(page.getByText('Home', { exact: true }).first()).toBeVisible({ timeout: 15000 });

        // Screenshot Expanded
        await page.screenshot({ path: 'verification/sidebar_expanded.png' });

        // Collapse
        const toggleBtn = page.locator('button[aria-label="Toggle Sidebar"]');
        await toggleBtn.click();

        // Wait for animation
        await page.waitForTimeout(500);

        // Screenshot Collapsed
        await page.screenshot({ path: 'verification/sidebar_collapsed.png' });
    });

    test('Sidebar visual verification (Non-Producer)', async ({ page }) => {
        // Override the profile mock to be a viewer
        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: mockUser.id,
                    role: 'viewer', // Changed role
                    group_name: null,
                    username: 'testviewer'
                })
            });
        });

        // Set viewport size
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.goto('/feed');
        await expect(page.getByText('Home', { exact: true }).first()).toBeVisible({ timeout: 15000 });

        // Check "Producer Access" text is visible initially
        await expect(page.getByText('Producer Access')).toBeVisible();

        // Collapse
        const toggleBtn = page.locator('button[aria-label="Toggle Sidebar"]');
        await toggleBtn.click();

        // Wait for animation
        await page.waitForTimeout(500);

        // Screenshot Collapsed Non-Producer
        await page.screenshot({ path: 'verification/sidebar_collapsed_viewer.png' });

        // Verify "Producer Access" text is hidden but button/icon exists
        await expect(page.getByText('Producer Access')).toBeHidden();
        // We expect the Users icon button to be visible.
        // Since we didn't add a specific test-id, we can look for the button with the title "Producer Access"
        await expect(page.locator('button[title="Producer Access"]')).toBeVisible();
    });

});
