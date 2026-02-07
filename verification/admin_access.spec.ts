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

        // Mock Shows for Admin Panel (One Pending Show)
        await page.route('**/rest/v1/shows*', async (route) => {
            const url = route.request().url();
            // Only return the pending show if querying shows
            if (url.includes('select=') && !url.includes('count=exact')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: 'pending-show-id',
                        title: 'A Pending Masterpiece',
                        description: 'Waiting for approval.',
                        date: '2025-01-01T12:00:00Z',
                        venue: 'Test Venue',
                        city: 'Test City',
                        niche: 'local',
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        producer_id: 'prod-id',
                        poster_url: null,
                        profiles: { group_name: 'Test Producer Group' }
                    }])
                });
            } else {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '*/0' },
                    body: JSON.stringify([])
                });
            }
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
                    pendingShows: 1,
                    approvedShows: 4,
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

    test('Admin user can see pending shows and approval buttons', async ({ page }) => {
        await setupAdminMocks(page);
        await page.goto('/admin/dashboard');

        // Wait for page to load
        await page.waitForTimeout(1000);

        // Expect specific Admin Panel elements
        await expect(page.getByRole('heading', { name: /Show Approvals|User Management/ })).toBeVisible({ timeout: 15000 });

        // Check for the pending show
        await expect(page.getByText('A Pending Masterpiece')).toBeVisible();
        await expect(page.getByText('Test Producer Group')).toBeVisible();

        // Check for Approve and Reject buttons (using titles or icons if text is hidden)
        // In the code: title="Approve" and title="Reject"
        await expect(page.locator('button[title="Approve"]')).toBeVisible();
        await expect(page.locator('button[title="Reject"]')).toBeVisible();
    });
});
