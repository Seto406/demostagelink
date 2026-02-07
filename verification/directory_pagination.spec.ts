import { test, expect } from '@playwright/test';

test.describe('Directory Pagination and Filtering', () => {

  test('should apply server-side pagination and filtering', async ({ page }) => {
    const requests: { url: string, range?: string }[] = [];

    // Mock Supabase response
    await page.route('**/rest/v1/profiles?*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = request.headers();

      // Check if it's the profiles query
      if (url.searchParams.has('select') && url.searchParams.get('select')?.includes('group_name')) {
        console.log('Profiles Request:', url.toString());
        console.log('Range Header:', headers['range']);

        let range = headers['range'];
        if (!range && url.searchParams.has('offset') && url.searchParams.has('limit')) {
            const offset = parseInt(url.searchParams.get('offset') || '0');
            const limit = parseInt(url.searchParams.get('limit') || '0');
            range = `${offset}-${offset + limit - 1}`;
        }

        requests.push({ url: url.toString(), range });

        // Determine offset from range header (e.g., "0-12")
        // But for mock, we just return enough data to verify logic

        // Create 13 items to trigger "hasMore" (since limit is 12)
        // Implementation fetches 13 items (0-12).
        const mockData = Array(13).fill(0).map((_, i) => ({
            id: `producer-${Date.now()}-${i}`,
            group_name: `Producer ${i}`,
            description: 'Description',
            niche: 'local',
            role: 'producer',
            address: 'Manila'
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
          headers: {
            'Content-Range': '0-12/100'
          }
        });
        return;
      }

      await route.continue();
    });

    // Load page
    await page.goto('/directory');

    // Verify "Load More" button appears
    // The implementation fetches 13 items, slices to 12. Since 13 > 12, hasMore = true.
    await expect(page.getByRole('button', { name: 'Load More' })).toBeVisible({ timeout: 10000 });

    // Assert initial request
    // Range should be 0-12
    const initialReq = requests.find(r => !r.url.includes('group_name=ilike'));
    expect(initialReq).toBeDefined();
    expect(initialReq?.range).toBe('0-12');

    // Test Search
    const searchInput = page.getByPlaceholder('Search theater groups...');
    await searchInput.fill('Test Search');

    // Wait for debounce and request
    await expect(async () => {
        const lastReq = requests[requests.length - 1];
        expect(lastReq.url).toContain('group_name=ilike');
        expect(lastReq.url).toMatch(/Test(\+|%20)Search/);
        expect(lastReq.range).toBe('0-12'); // Reset to page 0
    }).toPass({ timeout: 5000 });

    // Clear requests to cleanly test load more
    // (Optional, or just check last one)

    // Test Load More
    await page.getByRole('button', { name: 'Load More' }).click();

    // Wait for new request
    await expect(async () => {
        const lastReq = requests[requests.length - 1];
        // Page 1: from=12, to=24. Range 12-24.
        expect(lastReq.range).toBe('12-24');
    }).toPass({ timeout: 5000 });
  });
});
