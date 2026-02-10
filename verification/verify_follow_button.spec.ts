import { test, expect } from '@playwright/test';

test('capture screenshot of producer profile with follow button', async ({ page }) => {
    // Valid UUIDs
    const producerId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000003';

    await page.addInitScript(() => { window.PlaywrightTest = true; });

    // Mock Session
    await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-token',
                user: { id: userId, email: 'test@example.com' }
            })
        });
    });

    // Mock User
    await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: userId, email: 'test@example.com' })
        });
    });

    // Mock Producer
    await page.route(`**/rest/v1/profiles?select=*&id=eq.${producerId}*`, async (route) => {
            await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: producerId,
                group_name: 'Social Group',
                description: 'A very social theater group.',
                founded_year: 2024,
                niche: 'local',
                avatar_url: null,
                facebook_url: null,
                instagram_url: null,
                map_screenshot_url: null
            }])
        });
    });

    // Mock Shows
    await page.route(`**/rest/v1/shows?select=*&producer_id=eq.${producerId}*`, async (route) => {
            await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Mock Follows Count
    await page.route(`**/rest/v1/follows*`, async (route) => {
            const url = route.request().url();
            if (url.includes(`following_id=eq.${producerId}`) && !url.includes(`follower_id`)) {
                await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: {
                    'Content-Range': '0-9/10',
                    'Range-Unit': 'items',
                    'Prefer': 'count=exact'
                },
                body: JSON.stringify([])
            });
            } else {
                route.continue();
            }
    });

    // Mock Analytics
    await page.route('**/rest/v1/analytics_events*', async (route) => {
            await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'event-123' })
        });
    });

    await page.goto(`/producer/${producerId}`);

    // Wait for button
    await expect(page.getByRole('button', { name: /Follow/i })).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'verification/follow_button.png', fullPage: true });
});
