import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Admin Panel Optimization Check', () => {
    // Shared mock data
    const mockUser: User = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        user_metadata: { full_name: 'Admin User' },
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

    test('Admin Panel should fetch only necessary columns for shows and render correctly', async ({ page }) => {
        // initialize mocks
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.mockUser;
        }, { mockUser });

        // Mock Auth Session
        await page.route('**/auth/v1/session', async (route) => {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
        });

        // Mock Admin Profile
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            // If fetching specific user profile (for auth check)
            if (url.includes('user_id=eq')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify({
                        id: 'admin-profile-id',
                        user_id: 'admin-user-id',
                        role: 'admin',
                        group_name: 'Admin Group'
                    })
                });
                return;
            }
             // List of users for admin panel
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([])
            });
        });

        // Mock Producer Requests
        await page.route('**/rest/v1/producer_requests*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/0' },
                body: JSON.stringify([])
            });
        });

        // Intercept Shows Request
        const showsRequestPromise = page.waitForRequest(request =>
            request.url().includes('/rest/v1/shows') &&
            request.method() === 'GET' &&
            !request.url().includes('count=exact') &&
            request.url().includes('select=')
        );

        // Mock Shows Response with data to verify rendering
        const mockShow = {
            id: 'show-123',
            title: 'Optimized Show Title',
            description: 'This is a description',
            date: '2026-01-01T20:00:00Z',
            venue: 'Test Venue',
            city: 'Test City',
            niche: 'local',
            status: 'pending',
            created_at: new Date().toISOString(),
            producer_id: 'prod-123',
            poster_url: null,
            deleted_at: null,
            profiles: {
                group_name: 'Test Group'
            }
        };

        await page.route('**/rest/v1/shows*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([mockShow])
            });
        });

        await page.goto('/admin');

        // 1. Verify Request Optimization
        const request = await showsRequestPromise;
        const url = new URL(request.url());
        const selectParam = decodeURIComponent(url.searchParams.get('select') || '');

        console.log('Intercepted Select Param:', selectParam);

        const isOptimized = !selectParam.startsWith('*,') && !selectParam.startsWith('*');
        expect(isOptimized, `Query should not select all columns (*). Actual: ${selectParam}`).toBe(true);

        // 2. Verify UI Rendering with limited columns
        // Wait for the show title to appear
        await expect(page.getByText('Optimized Show Title')).toBeVisible();
        await expect(page.getByText('Test Group')).toBeVisible();
        await expect(page.getByText('Local/Community')).toBeVisible(); // Niche label
        await expect(page.getByText('PENDING', { exact: true })).toBeVisible(); // Status label

        console.log('UI rendered correctly with optimized data.');
    });
});
