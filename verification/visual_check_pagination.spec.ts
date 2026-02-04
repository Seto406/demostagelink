import { test, expect } from '@playwright/test';

test('Visual Check Pagination', async ({ page }) => {
    // Mock Auth
    await page.route('**/auth/v1/session', async route => route.fulfill({ status: 200, body: JSON.stringify({ session: null }) }));
    await page.route('**/auth/v1/user', async route => route.fulfill({ status: 200, body: JSON.stringify({ user: null }) }));

    // Mock Metadata
    await page.route('**/rest/v1/shows?select=city*', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { city: 'Manila', genre: 'Drama', niche: 'local' }
            ])
         });
    });

    // Mock Shows
    await page.route(/.*rest\/v1\/shows.*select=id.*/, async route => {
        const url = route.request().url();
        let pageIndex = 0;
        const match = url.match(/offset=(\d+)/);
        if (match) pageIndex = parseInt(match[1], 10) / 12;

        const items = Array.from({ length: 12 }, (_, i) => ({
            id: `p${pageIndex}-${i}`,
            title: `Show P${pageIndex}-${i}`,
            description: 'Desc',
            date: new Date().toISOString(),
            venue: 'Venue',
            city: 'Manila',
            niche: 'local',
            genre: 'Drama',
            ticket_link: 'http://link',
            poster_url: null,
            status: 'approved',
            profiles: { id: 'prod1', group_name: 'Group 1', avatar_url: null }
        }));

        await route.fulfill({
            status: 200,
            headers: { 'Content-Range': `${pageIndex*12}-${pageIndex*12+11}/${100}` }, // 100 total
            contentType: 'application/json',
            body: JSON.stringify(items)
        });
    });

    await page.goto('/shows');
    await expect(page.getByText('Show P0-0')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'verification/shows_page_1.png', fullPage: true });

    const btn = page.getByRole('button', { name: /Load More/i });
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
    await expect(page.getByText('Show P1-0')).toBeVisible({ timeout: 15000 });

    // Wait for a bit for animation
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'verification/shows_page_2.png', fullPage: true });
});
