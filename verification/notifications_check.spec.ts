import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Notifications Page Check', () => {
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

    const setupMocks = async (page: Page, authenticated = false) => {
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            if (data.authenticated) {
                win.PlaywrightUser = data.mockUser;
            }
        }, { authenticated, mockUser });

        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(authenticated ? mockSession : null)
            });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(authenticated ? mockUser : null)
            });
        });

        await page.route('**/rest/v1/notifications*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/0' },
                body: JSON.stringify([])
            });
        });

        // Mock Profiles needed for Navbar
        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([{
                    id: '00000000-0000-0000-0000-000000000002',
                    user_id: mockUser.id,
                    username: 'TestUser',
                    role: 'user'
                }])
            });
        });
    };

    test('Unauthenticated user should see login message with Navbar', async ({ page }) => {
        await setupMocks(page, false);
        await page.goto('/notifications');

        // Check for Navbar (StageLink logo/text)
        await expect(page.getByText('StageLink')).toBeVisible();

        // Check for "Please log in" message
        await expect(page.getByText('Please log in to view notifications.')).toBeVisible();
    });

    test('Authenticated user should see notifications page with Navbar', async ({ page }) => {
        await setupMocks(page, true);
        await page.goto('/notifications');

        // Check for Navbar (StageLink logo/text)
        await expect(page.getByText('StageLink')).toBeVisible();

        // Check for Notifications header
        await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();

        // Check for "No notifications yet" message since we mocked empty list
        await expect(page.getByText('No notifications yet')).toBeVisible();
    });
});
