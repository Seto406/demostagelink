import { test, expect } from '@playwright/test';
import { CustomWindow } from './test-types';

test.describe('Interactivity Check', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`[Browser] ${msg.text()}`));

        // Mock Auth
        await page.addInitScript(() => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = {
                id: 'test-user-id',
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User', avatar_url: null },
                app_metadata: { provider: 'email' },
                aud: 'authenticated',
                created_at: new Date().toISOString()
            };
        });

        // Mock Profiles (Minimal)
        await page.route('**/rest/v1/profiles*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([{
                    id: 'prod-123',
                    user_id: 'test-user-id',
                    group_name: 'QA Productions',
                    role: 'producer',
                    username: 'qa_prod'
                }])
            });
        });

        // Mock Badges (User reported error about user_badges)
        await page.route('**/rest/v1/user_badges*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });
    });

    test('Settings Page Buttons are Clickable', async ({ page }) => {
        await page.goto('/settings');

        // Wait for page to load
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

        // Check Upgrade Pro button
        const upgradeButton = page.getByRole('button', { name: /Upgrade Pro/i });
        await expect(upgradeButton).toBeVisible();

        // Check if button is intercepted by another element
        await upgradeButton.click({ trial: true });

        // Check Save button
        const saveButton = page.getByRole('button', { name: /Save/i }).first();
        await expect(saveButton).toBeVisible();
        await saveButton.click({ trial: true });
    });
});
