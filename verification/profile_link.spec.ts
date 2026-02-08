import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Profile Link Visibility', () => {
    const mockUser: User = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User', avatar_url: null },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockProducer: User = {
        ...mockUser,
        id: '00000000-0000-0000-0000-000000000002',
    };

    const mockSession: Session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
    };

    const setupMocks = async (page: Page, userRole: 'audience' | 'producer' = 'audience') => {
        const user = userRole === 'producer' ? mockProducer : mockUser;

        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.user;
        }, { user });

        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ...mockSession, user })
            });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(user)
            });
        });

        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([{
                    id: user.id,
                    user_id: user.id,
                    username: 'TestUser',
                    role: userRole
                }])
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
    };

    test('Profile link should be VISIBLE in Desktop User Dropdown for Audience', async ({ page }) => {
        await setupMocks(page, 'audience');
        await page.goto('/feed');

        // Wait for navbar to load
        // The avatar fallback or image should be present
        const avatarButton = page.locator('button.rounded-full').first();
        await expect(avatarButton).toBeVisible();

        // Open Dropdown
        await avatarButton.click();

        // Check for Settings link (should be there)
        await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();

        // Check for Profile link (should be VISIBLE)
        await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
        await page.screenshot({ path: 'verification/profile_link_desktop.png' });
    });

    test('Profile link should be VISIBLE in Mobile Menu for Producer', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await setupMocks(page, 'producer');
        await page.goto('/feed');

        // Open Mobile Menu
        await page.getByLabel('Toggle menu').click();

        // Wait for menu animation
        const menuContainer = page.locator('.fixed.inset-x-8');
        await expect(menuContainer).toBeVisible();

        // Check for Dashboard link (should be there for producer)
        // Scope to the menu container to avoid bottom nav
        await expect(menuContainer.getByRole('link', { name: 'Dashboard' })).toBeVisible();

        // Check for Settings link (should be there)
        await expect(menuContainer.getByRole('link', { name: 'Settings' })).toBeVisible();

        // Check for Profile link (should be VISIBLE)
        await expect(menuContainer.getByRole('link', { name: 'Profile' })).toBeVisible();
        await page.screenshot({ path: 'verification/profile_link_mobile.png' });
    });
});
