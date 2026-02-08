import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Feed Sidebar Collapse Verification', () => {

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

    test('Sidebar should be collapsible', async ({ page }) => {
        await page.goto('/feed');

        // Wait for page load
        await expect(page.getByText('Home', { exact: true }).first()).toBeVisible({ timeout: 15000 });

        // Identify sidebar - assume it's the aside element
        const sidebar = page.locator('aside').first();
        await expect(sidebar).toBeVisible();

        // Check for navigation items text visibility (Initially Visible)
        await expect(sidebar.getByText('Home')).toBeVisible();
        await expect(sidebar.getByText('Upcoming Shows')).toBeVisible();

        // Find the toggle button
        // Since I haven't implemented it yet, this selector is a guess of what I WILL implement.
        // I will use a test id or specificaria label in implementation.
        // For now, let's look for a button with a chevron icon or specific aria-label "Toggle Sidebar".
        const toggleBtn = sidebar.locator('button[aria-label="Toggle Sidebar"]');

        // This assertion is expected to fail currently, confirming the need for implementation.
        // If it fails, I will know I need to add it.
        // To make the test "pass" during the "Create Verification Test" phase if I want to run it to confirm failure,
        // I can use .toBeVisible() and expect it to timeout/fail.
        // However, I will comment out the interaction part until implementation or wrap it in a try/catch if I was doing strict TDD,
        // but typically in this agent workflow I create the test that defines "Success".

        // So I will write the test as it SHOULD be.

        // Verify Toggle Button Exists
        await expect(toggleBtn).toBeVisible({ timeout: 5000 });

        // Click Toggle
        await toggleBtn.click();

        // Verify Sidebar Collapsed State
        // Text should be hidden
        await expect(sidebar.getByText('Home')).toBeHidden();
        await expect(sidebar.getByText('Upcoming Shows')).toBeHidden();

        // Icons should still be visible (can verify by class or presence)
        // Note: verifying icons is tricky without specific test ids, but buttons should still exist.
        // The Home button (link) should still exist.
        const homeLink = sidebar.locator('a[href="/feed"]');
        await expect(homeLink).toBeVisible();

        // Click Toggle Again to Expand
        await toggleBtn.click();

        // Verify Sidebar Expanded State
        await expect(sidebar.getByText('Home')).toBeVisible();
    });

});
