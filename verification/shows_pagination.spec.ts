import { test, expect } from '@playwright/test';

test.describe('Shows Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth - No Session
    await page.route('**/auth/v1/session', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ session: null }) });
    });
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ user: null }) });
    });

    // Mock Metadata Fetch
    await page.route('**/rest/v1/shows?select=city*', async route => {
         console.log('Mocking Metadata Fetch');
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { city: 'Manila', genre: 'Drama', niche: 'local' },
                { city: 'Quezon City', genre: 'Musical', niche: 'university' }
            ])
         });
    });
  });

  test('Load More flow works', async ({ page }) => {
    // Mock Shows Fetch (Specific to main fetch)
    // Using regex to ensure we don't catch the metadata fetch
    await page.route(/.*rest\/v1\/shows.*select=id.*/, async route => {
      const url = route.request().url();
      const headers = route.request().headers();

      console.log(`Matched Shows Fetch: ${url}`);

      // Determine page based on offset
      // URL contains offset=0, offset=12, etc.
      let pageIndex = 0;
      const match = url.match(/offset=(\d+)/);
      if (match) {
        const offset = parseInt(match[1], 10);
        pageIndex = offset / 12; // PAGE_SIZE = 12
      }

      // Create 12 items for the requested page
      const items = Array.from({ length: pageIndex === 0 ? 12 : 1 }, (_, i) => ({
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

      // Content-Range header
      // Page 0: 0-11/13
      // Page 1: 12-12/13
      const total = 13;
      const start = pageIndex * 12;
      const end = Math.min(start + items.length - 1, total - 1);
      const contentRange = `${start}-${end}/${total}`;

      await route.fulfill({
        status: 200,
        headers: { 'Content-Range': contentRange },
        contentType: 'application/json',
        body: JSON.stringify(items)
      });
    });

    // Console debugging
    page.on('console', msg => console.log(`Browser Console: ${msg.text()}`));

    await page.goto('/shows');

    // Initial Load
    await expect(page.getByText('Show P0-0')).toBeVisible({ timeout: 10000 });

    // Check Load More
    const loadMoreBtn = page.getByRole('button', { name: /Load More/i });
    await expect(loadMoreBtn).toBeVisible();
    await loadMoreBtn.click();

    // Verify Page 1 (Second page)
    await expect(page.getByText('Show P1-0')).toBeVisible({ timeout: 10000 });
    await expect(loadMoreBtn).toBeHidden();
  });
});
