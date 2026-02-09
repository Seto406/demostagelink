import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Notifications Pagination', () => {
    // Enable console logging
    test.beforeEach(({ page }) => {
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[vite]') && !text.includes('Download the React')) {
                console.log(`[Browser] ${text}`);
            }
        });
    });

    const mockUser: User = {
        id: '00000000-0000-0000-0000-000000000001',
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

        // Mock Auth
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify(mockSession) });
        });
        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify(mockUser) });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
             await route.fulfill({
                status: 200,
                body: JSON.stringify({ id: mockUser.id, role: 'audience', username: 'tester' })
            });
        });

        // Mock Notifications Count (Unread) - Used by NotificationContext
        await page.route('**/rest/v1/notifications*select=*count=exact*', async (route) => {
             // This matches the count query
             await route.fulfill({
                status: 200,
                headers: { 'Content-Range': '0-5/5' }, // Mock 5 unread
                body: JSON.stringify([]) // head: true returns empty body usually, but count in header
            });
        });

        // Mock Notifications List
        await page.route('**/rest/v1/notifications*order=created_at*', async (route) => {
            const url = route.request().url();

            // Generate mock notifications
            const generateNotifications = (start: number, count: number) => {
                return Array.from({ length: count }, (_, i) => ({
                    id: `notif-${start + i}`,
                    user_id: mockUser.id,
                    title: `Notification ${start + i}`,
                    message: `This is notification message number ${start + i}`,
                    read: false,
                    type: 'like',
                    link: null,
                    created_at: new Date(Date.now() - (start + i) * 60000).toISOString()
                }));
            };

            // Parse Range header if present, or query params?
            // Supabase JS client uses Range header for pagination usually,
            // but the mock in button_audit.spec.ts suggests checking URL or headers.
            // Actually supabase-js sends Range: start-end in headers.

            const headers = route.request().headers();
            const rangeHeader = headers['range'] || headers['content-range']; // Supabase client sends Range

            let start = 0;
            let end = 19;

            console.log(`[Mock] Request Headers:`, JSON.stringify(headers));
            console.log(`[Mock] Request URL:`, url);

            if (rangeHeader) {
                const match = rangeHeader.match(/(\d+)-(\d+)/);
                if (match) {
                    start = parseInt(match[1]);
                    end = parseInt(match[2]);
                }
            } else {
                 // Fallback to query params parsing if offset/limit are present
                 const urlObj = new URL(url);
                 const offset = urlObj.searchParams.get('offset');
                 const limit = urlObj.searchParams.get('limit');
                 if (offset) {
                    start = parseInt(offset);
                    if (limit) end = start + parseInt(limit) - 1;
                 }
            }

            console.log(`[Mock] Handling notifications request. Range: ${start}-${end}`);

            if (start === 0) {
                // First page: Return 20 items
                const body = generateNotifications(0, 20);
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Range': `0-19/${100}` }, // Total 100
                    body: JSON.stringify(body)
                });
            } else if (start === 20) {
                // Second page: Return 5 items (end of list for this test)
                const body = generateNotifications(20, 5);
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Range': `20-24/${100}` },
                    body: JSON.stringify(body)
                });
            } else {
                await route.fulfill({ status: 200, body: JSON.stringify([]) });
            }
        });
    };

    test('Loads initial 20 notifications and loads more on click', async ({ page }) => {
        await setupMocks(page);

        await page.goto('/notifications');

        // 1. Verify Title
        await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible({ timeout: 10000 });

        // 2. Verify initial list size (20)
        // We look for text "Notification 0" to "Notification 19"
        await expect(page.getByText('Notification 0', { exact: true })).toBeVisible();
        await expect(page.getByText('Notification 19')).toBeVisible();
        await expect(page.getByText('Notification 20')).toBeHidden();

        // 3. Verify "Load more" button is visible
        const loadMoreBtn = page.getByRole('button', { name: 'Load more' });
        await expect(loadMoreBtn).toBeVisible();

        // 4. Click Load More
        await loadMoreBtn.click();

        // 5. Verify new items loaded
        await expect(page.getByText('Notification 20')).toBeVisible();
        await expect(page.getByText('Notification 24')).toBeVisible();

        // 6. Verify "Load more" is gone (since we returned < 20 items in 2nd batch, code sets hasMore=false)
        await expect(loadMoreBtn).toBeHidden();

        // 7. Screenshot
        await page.screenshot({ path: 'verification/notifications_pagination.png', fullPage: true });
    });
});
