import { test, expect } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Analytics Performance', () => {
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

    const mockProfile = {
        id: 'prod-123',
        user_id: 'test-user-id',
        group_name: 'QA Productions',
        username: 'QA Productions',
        description: 'We test things.',
        founded_year: 2020,
        role: 'producer',
        avatar_url: null
    };

    test.beforeEach(async ({ page }) => {
        // Initialize global variables and inject user
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.mockUser;
        }, { mockUser });

        // Mock Supabase Auth
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            if (url.includes('user_id=eq')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([mockProfile])
                });
            } else {
                 await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
            }
        });

         // Mock Shows
        await page.route('**/rest/v1/shows*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

         // Mock Members
        await page.route('**/rest/v1/group_members*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

        // Mock Audience Links
        await page.route('**/rest/v1/group_audience_links*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });
    });

    test('Measure Server-Side Aggregation Performance (Optimized)', async ({ page }) => {
        // Mock RPC call - Small payload
        await page.route('**/rpc/get_analytics_summary', async (route) => {
            const chartData = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    date: d.toISOString().split('T')[0],
                    clicks: 500
                };
            });

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    views: 5000,
                    clicks: 5000,
                    ctr: 100,
                    chartData
                })
            });
        });

        const start = Date.now();
        await page.goto('/dashboard');

        await expect(page.locator('.recharts-responsive-container')).toBeVisible({ timeout: 60000 });

        const end = Date.now();
        console.log(`[Performance] Render time with RPC Aggregation: ${end - start}ms`);
    });
});
