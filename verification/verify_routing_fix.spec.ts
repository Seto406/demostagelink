import { test, expect } from '@playwright/test';

test.describe('Routing Fix Verification', () => {
    const producerId = '00000000-0000-0000-0000-000000000001';
    const userId = 'user-123';

    // Mock Data
    const producerData = {
        id: producerId,
        group_name: 'Test Theater Group',
        niche: 'local',
        avatar_url: 'https://example.com/avatar.jpg'
    };

    const showData = {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Test Show',
        description: 'A test show description.',
        date: '2026-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        poster_url: null,
        created_at: new Date().toISOString(),
        producer_id: producerId,
        profiles: {
            id: producerId,
            group_name: 'Test Theater Group',
            avatar_url: 'https://example.com/avatar.jpg'
        },
        status: 'approved'
    };

    const mockUser = {
        id: userId,
        email: 'user@example.com',
        user_metadata: { full_name: 'Test User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    test.beforeEach(async ({ page }) => {
        // Log page errors
        page.on('pageerror', error => console.log('PAGE ERROR:', error));
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Mock Auth with User Injection
        await page.addInitScript((user) => {
             window.localStorage.setItem('sb-access-token', 'mock-token');
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (window as any).PlaywrightTest = true;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (window as any).PlaywrightUser = user;
        }, mockUser);

        // Mock Session
        await page.route('**/auth/v1/session', async (route) => {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'mock-token', user: mockUser }) });
        });
        await page.route('**/auth/v1/user', async (route) => {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([producerData]) });
        });

        // Mock Shows
        await page.route('**/rest/v1/shows*', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([showData])
            });
        });

        // Block others
        await page.route('**/rest/v1/favorites*', async (route) => route.fulfill({ body: '[]' }));
        await page.route('**/rest/v1/comments*', async (route) => route.fulfill({ body: '[]' }));
        await page.route('**/functions/v1/check-subscription*', async (route) => route.fulfill({ json: { isPro: false } }));
        await page.route('**/producer_requests*', async (route) => route.fulfill({ body: '[]' }));
    });

    test('Feed Post Producer Link', async ({ page }) => {
        await page.goto('/feed');

        await expect(page.getByText('Test Show').first()).toBeVisible({ timeout: 5000 });

        const producerLink = page.getByRole('link', { name: 'Test Theater Group' }).first();
        await expect(producerLink).toBeVisible();
        await expect(producerLink).toHaveAttribute('href', `/producer/${producerId}`);
    });

    test('Suggested Producers Widget Link', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/feed');

        // Check the link in the suggested widget
        const aside = page.locator('aside');
        const widgetLink = aside.getByRole('link', { name: 'Test Theater Group' }).first();

        // Just check attribute
        await expect(widgetLink).toHaveAttribute('href', `/producer/${producerId}`);
    });
});
