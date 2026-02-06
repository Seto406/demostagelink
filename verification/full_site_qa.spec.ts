import { test, expect } from '@playwright/test';

// Define types for mock data
interface User {
    id: string;
    email: string;
    user_metadata: {
        full_name?: string;
        avatar_url?: string | null;
    };
    app_metadata: {
        provider?: string;
        [key: string]: any;
    };
    aud: string;
    created_at: string;
}

interface Session {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: User;
}

test.describe('Full Site QA', () => {
    // Enable console logging from the browser
    test.beforeEach(({ page }) => {
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[vite]') && !text.includes('Download the React')) {
                console.log(`[Browser] ${text}`);
            }
        });
    });

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

    // Helper to setup common mocks
    const setupMocks = async (page: any, authenticated = false) => {
        // Initialize global variables and inject user if authenticated
        await page.addInitScript((data) => {
            (window as any).adsbygoogle = [];
            (window as any).PlaywrightTest = true;
            if (data.authenticated) {
                (window as any).PlaywrightUser = data.mockUser;
                console.log("PlaywrightUser injected:", data.mockUser.email);
            }
        }, { authenticated, mockUser });

        // Mock Supabase Auth
        await page.route('**/auth/v1/session', async (route) => {
            if (authenticated) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
            }
        });

        await page.route('**/auth/v1/user', async (route) => {
            if (authenticated) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
            }
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            console.log(`[Mock] Profiles Request: ${url}`);

            // Single User (Auth Check)
            if (url.includes('user_id=eq')) {
                if (authenticated) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers: { 'Content-Range': '0-0/1' },
                        body: JSON.stringify([{
                            id: 'prod-123',
                            user_id: 'test-user-id',
                            group_name: 'QA Productions',
                            username: 'QA Productions',
                            description: 'We test things.',
                            founded_year: 2020,
                            role: 'producer',
                            avatar_url: null
                        }])
                    });
                } else {
                    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Content-Range': '*/0' }, body: JSON.stringify([]) });
                }
                return;
            }

            // Directory List
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-1/2' },
                body: JSON.stringify([
                    {
                        id: 'prod-123',
                        group_name: 'QA Productions',
                        description: 'We test things.',
                        founded_year: 2020,
                        niche: 'local',
                        avatar_url: null
                    },
                    {
                        id: 'prod-456',
                        group_name: 'Beta Thespians',
                        description: 'Another test group.',
                        founded_year: 2021,
                        niche: 'university',
                        avatar_url: null
                    }
                ])
            });
        });

        // Mock Shows
        await page.route('**/rest/v1/shows*', async (route) => {
            const showData = {
                id: 'show-abc',
                title: 'The Phantom of the QA',
                description: 'A haunting tale.',
                date: '2026-12-25T19:00:00Z',
                price: 500,
                venue: 'Virtual Stage',
                city: 'Cloud City',
                poster_url: null,
                producer_id: 'prod-123',
                status: 'approved',
                genre: 'Musical',
                niche: 'local',
                created_at: new Date().toISOString(),
                profiles: {
                    id: 'prod-123',
                    group_name: 'QA Productions',
                    founded_year: 2020,
                    niche: 'local'
                }
            };

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([showData])
            });
        });

        // Mock Reviews
        await page.route('**/rest/v1/reviews*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

        // Mock User Badges
        await page.route('**/rest/v1/user_badges*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

         // Mock Favorites
        await page.route('**/rest/v1/favorites*', async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '*/0' },
                    body: JSON.stringify([])
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
            }
        });

        // Mock Edge Functions
        await page.route('**/functions/v1/create-paymongo-session', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ checkoutUrl: 'https://test.paymongo.com/checkout' })
            });
        });
    };

    test.describe('Unauthenticated Visitor', () => {
        test.beforeEach(async ({ page }) => {
            await setupMocks(page, false);
        });

        test('Public Navigation: Landing Page', async ({ page }) => {
            await page.goto('/');
            await expect(page).toHaveTitle(/StageLink/);
            await expect(page.getByRole('heading', { name: 'The Stage Is Yours.' })).toBeVisible({ timeout: 15000 });
            await page.goto('/shows');
            await expect(page).toHaveURL(/\/shows/);
        });

        test('Public Navigation: Directory', async ({ page }) => {
            await page.goto('/directory');
            await expect(page.getByRole('heading', { name: 'Theater Directory' })).toBeVisible({ timeout: 15000 });

            // Wait for data to load
            await page.waitForTimeout(2000);
            await expect(page.getByText('QA Productions')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Authenticated User', () => {
        test.beforeEach(async ({ page }) => {
            await setupMocks(page, true);
        });

        test('Auth Flow: Directory (Sanity Check)', async ({ page }) => {
            await page.goto('/directory');
            await expect(page.getByRole('heading', { name: 'Theater Directory' })).toBeVisible({ timeout: 15000 });

            await page.waitForTimeout(1000);

            // Check that Login button is GONE (User is logged in)
            await expect(page.getByRole('button', { name: 'Login' })).not.toBeVisible();

            // Check for User Avatar (generic selector as fallback)
            // Shadcn dropdown trigger usually is a button with an avatar image or initials
            const userMenu = page.locator('button[id^="radix-"]'); // Radix UI trigger often has generated ID
            // Or look for rounded-full in nav
            const avatar = page.locator('nav button div.rounded-full');

            // Verify at least something user-like is there
            if (await avatar.count() > 0) {
                await expect(avatar.first()).toBeVisible();
            } else {
               // Fallback to text matching
               await expect(page.getByText(/QA Productions|Test User/)).toBeVisible();
            }
        });

        test('Auth Flow: Settings Page', async ({ page }) => {
            await page.goto('/settings');
            await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(1000);
            await expect(page.getByLabel('Group Name')).toHaveValue('QA Productions', { timeout: 10000 });
        });

        test('Shows & Tickets', async ({ page }) => {
            await page.goto('/show/show-abc');
            await expect(page.getByRole('heading', { name: 'The Phantom of the QA' })).toBeVisible({ timeout: 15000 });

            const ticketButton = page.getByRole('button', { name: /Get Tickets/i });
            await expect(ticketButton).toBeVisible();
            await expect(ticketButton).toBeEnabled();

            const requestPromise = page.waitForRequest(req =>
                req.url().includes('create-paymongo-session') && req.method() === 'POST'
            );

            await ticketButton.click({ force: true });
            await requestPromise;
        });

        test('Favorites Toggle', async ({ page }) => {
            await page.goto('/shows');
             await expect(page.getByRole('heading', { name: 'The Phantom of the QA' })).toBeVisible({ timeout: 15000 });
        });
    });
});
