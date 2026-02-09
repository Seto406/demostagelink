import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Settings Profile', () => {
    const mockUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
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
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.mockUser;
        }, { mockUser });

        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
        });

        await page.route('**/rest/v1/profiles*', async (route) => {
            const method = route.request().method();
            const url = route.request().url();

            // Initial GET
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: 'prod-123',
                        user_id: 'test-user-id',
                        username: 'current_user',
                        role: 'audience'
                    }])
                });
                return;
            }

            // PATCH Update
            if (method === 'PATCH' && url.includes('user_id=eq.test-user-id')) {
                const postData = route.request().postDataJSON();
                if (postData.username === 'duplicate_user') {
                     await route.fulfill({
                        status: 409,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            code: '23505',
                            message: 'duplicate key value violates unique constraint "profiles_username_key"',
                            details: 'Key (username)=(duplicate_user) already exists.'
                        })
                    });
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
                }
            }
        });
    };

    test.beforeEach(async ({ page }) => {
        await setupMocks(page);
    });

    test('Should display specific error message for duplicate username', async ({ page }) => {
        await page.goto('/settings');

        // Wait for username input to be populated
        const usernameInput = page.getByLabel('Username / Display Name');
        await expect(usernameInput).toHaveValue('current_user', { timeout: 10000 });

        // Change username to duplicate
        await usernameInput.fill('duplicate_user');

        // Click save
        await page.getByRole('button', { name: 'Save' }).first().click();

        // Check for error toast
        await expect(page.getByText('Username already taken.', { exact: true })).toBeVisible();
    });

    test('Should validate username format', async ({ page }) => {
        await page.goto('/settings');
        const usernameInput = page.getByLabel('Username / Display Name');
        await expect(usernameInput).toHaveValue('current_user', { timeout: 10000 });

        // Invalid: too short
        await usernameInput.fill('ab');
        await page.getByRole('button', { name: 'Save' }).first().click();
        await expect(page.getByText('Username must be between 3 and 20 characters.', { exact: true })).toBeVisible();

        // Invalid: special chars
        await usernameInput.fill('user!name');
        await page.getByRole('button', { name: 'Save' }).first().click();
        await expect(page.getByText('Username can only contain letters, numbers, and underscores.', { exact: true })).toBeVisible();
    });
});
