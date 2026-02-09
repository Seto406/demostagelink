import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('UserFeed Sidebar Layout', () => {
    // Shared mock data
    const mockUser: User = {
        id: 'test-user-id',
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

    const setupMocks = async (page: Page) => {
        // Initialize global variables
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.user;
             // Disable Tour
            window.localStorage.setItem('stagelink_tour_seen_test-user-id', 'true');
        }, { user: mockUser });

        // Mock Supabase Auth
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([{
                    id: mockUser.id,
                    user_id: mockUser.id,
                    username: 'testuser',
                    role: 'audience',
                }])
            });
        });

        // Mock Shows for Feed
        await page.route('**/rest/v1/shows*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

         // Mock Other requests to avoid errors
        await page.route('**/rest/v1/producer_requests*', async (route) => route.fulfill({ body: '[]' }));
        await page.route('**/rest/v1/notifications*', async (route) => route.fulfill({ body: '[]' }));
        await page.route('**/functions/v1/check-subscription*', async (route) => route.fulfill({ body: '{"isPro": false}' }));
    };

    test('Sidebars should have correct scroll and layout classes', async ({ page }) => {
        await setupMocks(page);
        await page.goto('/feed');

        // Wait for page to load
        await expect(page.getByRole('navigation').first()).toBeVisible();

        // Left Sidebar
        // It is the first 'aside'
        const leftSidebar = page.locator('aside').first();
        await expect(leftSidebar).toBeVisible();

        // Check for scrollability classes
        // We expect these to BE present if fixed, so initially this test might fail if I assert they are present.
        // Since I want to "check if its fix", I will assert the DESIRED state.

        // Check for overflow-y-auto
        await expect(leftSidebar).toHaveClass(/overflow-y-auto/);

        // Check for scrollbar-hide
        await expect(leftSidebar).toHaveClass(/scrollbar-hide/);

        // Check that footer is NOT absolutely positioned at bottom-0 of the relative container in a way that overlaps
        // The fix described involves using flex-col and mt-auto
        await expect(leftSidebar).toHaveClass(/flex-col/);

        // The footer (copyright text) should be inside
        const footer = leftSidebar.locator('text=© 2026 StageLink');
        await expect(footer).toBeVisible();

        // Check Right Sidebar
        const rightSidebar = page.locator('aside').last();
        await expect(rightSidebar).toBeVisible();
        await expect(rightSidebar).toHaveClass(/overflow-y-auto/);
        await expect(rightSidebar).toHaveClass(/scrollbar-hide/);

        // Take a screenshot for visual verification
        await page.screenshot({ path: 'verification/sidebar_visual.png', fullPage: true });
    });
});
