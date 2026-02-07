import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Admin Access', () => {
    // Shared mock data for Admin
    const mockAdminUser: User = {
        id: 'admin-user-id',
        email: 'admin@stagelink.show',
        user_metadata: { full_name: 'Admin User', avatar_url: null },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockAdminSession: Session = {
        access_token: 'mock-admin-token',
        refresh_token: 'mock-admin-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockAdminUser
    };

    const setupAdminMocks = async (page: Page) => {
        // Initialize global variables and inject user
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.mockAdminUser;
            console.log("PlaywrightUser injected:", data.mockAdminUser.email);
        }, { mockAdminUser });

        // Mock Supabase Auth
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminUser) });
        });

        // Mock Profiles (Admin Role)
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            console.log(`[Mock] Profiles Request: ${url}`);

            if (url.includes('user_id=eq')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: 'admin-profile-id',
                        user_id: 'admin-user-id',
                        group_name: 'System Admin',
                        role: 'admin', // Critical: Role is admin
                        created_at: new Date().toISOString()
                    }])
                });
                return;
            }

            // Allow other profile requests to return empty list or defaults
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });

        // Mock Shows for Admin Panel
        await page.route('**/rest/v1/shows*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([]) // Empty list for now, just testing access
            });
        });

        // Mock Stats RPC
        await page.route('**/rpc/get_admin_dashboard_stats', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    totalUsers: 10,
                    totalShows: 5,
                    activeProducers: 2,
                    pendingRequests: 1,
                    deletedShows: 0,
                    pendingShows: 0,
                    approvedShows: 5,
                    rejectedShows: 0
                })
            });
        });

         // Mock Producer Requests
        await page.route('**/rest/v1/producer_requests*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });
    };

    test('Admin user can access /admin/dashboard', async ({ page }) => {
        await setupAdminMocks(page);
        await page.goto('/admin/dashboard');

        // Wait for page to load
        await page.waitForTimeout(1000);

        // Expect specific Admin Panel elements
        await expect(page.getByRole('heading', { name: /Show Approvals|User Management/ })).toBeVisible({ timeout: 15000 });

        // Check if stats are visible (mocked)
        await expect(page.getByText('Total Users')).toBeVisible();
    });
});
