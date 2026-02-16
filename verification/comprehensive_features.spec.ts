import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Comprehensive Feature Tests', () => {
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

    const mockProducerUser: User = {
        id: 'producer-user-id',
        email: 'producer@example.com',
        user_metadata: { full_name: 'Producer User', avatar_url: null },
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

     const mockProducerSession: Session = {
        access_token: 'mock-producer-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockProducerUser
    };

    // Helper to setup common mocks
    const setupMocks = async (page: Page, role: 'viewer' | 'producer' | 'guest' = 'guest') => {
        const currentUser = role === 'producer' ? mockProducerUser : mockUser;
        const currentSession = role === 'producer' ? mockProducerSession : mockSession;
        const isAuthenticated = role !== 'guest';

        // Initialize global variables and inject user if authenticated
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.adsbygoogle = [];
            win.PlaywrightTest = true;
            if (data.isAuthenticated) {
                win.PlaywrightUser = data.currentUser;
            }
            // Disable Tour
            window.localStorage.setItem('stagelink_tour_seen_test-user-id', 'true');
            window.localStorage.setItem('stagelink_tour_seen_producer-user-id', 'true');
        }, { isAuthenticated, currentUser });

        // Mock Supabase Auth
        await page.route('**/auth/v1/session', async (route) => {
            if (isAuthenticated) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentSession) });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
            }
        });

        await page.route('**/auth/v1/user', async (route) => {
            if (isAuthenticated) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentUser) });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
            }
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            const method = route.request().method();
            console.log(`[Mock] Profiles Request: ${method} ${url}`);

            // Mock Profile Update
            if (method === 'PATCH') {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ...currentUser, username: 'UpdatedName' })
                });
                return;
            }

            // Handle Profile Fetch by ID (for Producer Dashboard or User Profile)
            if (url.includes('id=eq')) {
                const isProducerQuery = role === 'producer';
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: currentUser.id, // Match the logged in user
                        user_id: currentUser.id,
                        group_name: isProducerQuery ? 'Test Productions' : null,
                        username: isProducerQuery ? 'Test Productions' : 'testuser',
                        description: 'A test account.',
                        founded_year: 2020,
                        role: role === 'producer' ? 'producer' : 'audience',
                        avatar_url: null,
                        niche: 'local'
                    }])
                });
                return;
            }

            // Handle user_id query (Settings page uses user_id)
            if (url.includes('user_id=eq')) {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: currentUser.id,
                        user_id: currentUser.id,
                        username: 'testuser',
                        role: role === 'producer' ? 'producer' : 'audience',
                    }])
                });
                return;
            }

             // Handle generic profile queries
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([])
            });
        });

        // Mock Shows Listing & Details
        await page.route('**/rest/v1/shows*', async (route) => {
            const url = route.request().url();
            const method = route.request().method();
            console.log(`[Mock] Shows Request: ${method} ${url}`);

             // Mock Filter Metadata (city, genre, niche)
             if (url.includes('select=city') && url.includes('genre') && method === 'GET') {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        { city: 'Manila', genre: 'Musical', niche: 'local' },
                        { city: 'Quezon City', genre: 'Drama', niche: 'university' }
                    ])
                });
                return;
             }

            // Mock Insert (Producer adding a show)
            if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'new-show-id', status: 'pending' })
                });
                return;
            }

            // Mock List or Details
            const showData = {
                id: 'show-abc',
                title: 'The Phantom of the QA',
                description: 'A haunting tale.',
                date: '2026-12-25T19:00:00Z',
                price: 500,
                venue: 'Virtual Stage',
                city: 'Manila',
                poster_url: null,
                producer_id: 'producer-user-id',
                status: 'approved',
                genre: 'Musical',
                niche: 'local',
                created_at: new Date().toISOString(),
                profiles: {
                    id: 'producer-user-id',
                    group_name: 'Test Productions',
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
            const method = route.request().method();

            if (method === 'POST') {
                 await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'new-review-id' })
                });
                return;
            }

             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '*/0' },
                body: JSON.stringify([]) // Empty reviews initially
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

        // Mock Notifications (prevent 404s)
        await page.route('**/rest/v1/notifications*', async (route) => {
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

         // Mock Subscription Check
        await page.route('**/functions/v1/check-subscription*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ isPro: false })
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

        // Mock Service Health
        await page.route('**/rpc/get_service_health', async r => r.fulfill({ body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }) }));
        await page.route('**/rpc/get_analytics_summary', async r => r.fulfill({ body: JSON.stringify({ views: 0, clicks: 0, ctr: 0, chartData: [] }) }));
    };

    test('Shows: Filtering and Search', async ({ page }) => {
        await setupMocks(page, 'guest'); // Public user can view shows
        await page.goto('/shows');

        // 1. Verify Initial Load
        await expect(page.getByRole('heading', { name: 'The Phantom of the QA' })).toBeVisible({ timeout: 15000 });

        // 2. Test City Filter
        const cityButton = page.getByRole('button', { name: 'Manila' }).first();
        await expect(cityButton).toBeVisible();

        // Click filter and verify request
        const filterRequestPromise = page.waitForRequest(req =>
            req.url().includes('city=eq.Manila')
        );
        await cityButton.click();
        await filterRequestPromise;

        // 3. Test Search
        const searchInput = page.getByPlaceholder(/Search productions/i);
        await searchInput.fill('Phantom');

        const searchRequestPromise = page.waitForRequest(req =>
            req.url().includes('Phantom')
        );
        // Wait for debounce
        await searchRequestPromise;

        // Verify UI still shows the result (since it matches)
        await expect(page.getByRole('heading', { name: 'The Phantom of the QA' })).toBeVisible();
    });

    test('Viewer: Submit Review', async ({ page }) => {
        await setupMocks(page, 'viewer');
        await page.goto('/show/show-abc');

        await expect(page.getByRole('heading', { name: 'The Phantom of the QA' })).toBeVisible({ timeout: 10000 });

        // Locate Review Form
        const reviewInput = page.getByPlaceholder(/What did you think/i);
        await expect(reviewInput).toBeVisible();
        await reviewInput.fill('This was an amazing performance!');

        // Select Rating (5 stars)
        const starButton = page.locator('button:has(.lucide-star)').nth(4);
        await starButton.click();

        // Submit
        const submitButton = page.getByRole('button', { name: /Submit Review/i });
        await submitButton.click();

        // Verify POST request or Success Message
        await expect(page.getByText(/Review submitted/i)).toBeVisible();
    });

    test('Producer: Create Show', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout for complex form interaction
        await setupMocks(page, 'producer');
        await page.goto('/dashboard');

        // 1. Verify Dashboard Access
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });

        // 2. Open Add Show Modal
        const addShowButton = page.locator('#add-show-button');
        await addShowButton.click();

        await expect(page.getByRole('heading', { name: 'Add New Show' })).toBeVisible();

        // 3. Fill Form
        await page.fill('#showTitle', 'New Test Show');
        await page.fill('#showDescription', 'A generated test show.');
        await page.fill('#showDate', '2026-10-31');

        // Select Venue
        await page.click('button:has-text("Select venue")', { force: true });
        await page.click('div[role="option"]:has-text("Samsung Performing Arts Theater")', { force: true });

        // Select City
        const cityTrigger = page.locator('button').filter({ hasText: 'Select city' });
        await cityTrigger.click();
        const manilaOption = page.getByRole('option', { name: 'Manila' });
        await expect(manilaOption).toBeVisible();
        await manilaOption.click();

        // 4. Submit
        const saveButton = page.getByRole('button', { name: /Submit Show/i });
        await page.waitForTimeout(500); // Wait for animations
        await saveButton.click({ force: true });

        // 5. Verify Success
        // Use a more generic expectation if needed, or wait longer
        await expect(page.getByRole('heading', { name: /Thank You/i })).toBeVisible({ timeout: 10000 });
    });

    test('Settings: Update Profile', async ({ page }) => {
        await setupMocks(page, 'viewer');
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

        const usernameInput = page.locator('#username');
        await usernameInput.fill('UpdatedUser');

        // Click Save button next to username
        const saveButton = page.getByRole('button', { name: 'Save' }).first();
        await saveButton.click();

        // Verify Toast
        await expect(page.getByText('Profile Updated', { exact: true })).toBeVisible();
    });

    test('404 Page Not Found', async ({ page }) => {
        await setupMocks(page, 'guest');
        await page.goto('/non-existent-page-12345');

        // Use more specific selector to avoid ambiguity
        await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
        // Use link role for anchor tag
        await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
    });
});
