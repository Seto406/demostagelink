import { test, expect } from '@playwright/test';

test.describe('Show Details Ticketing Pivot', () => {
  const showId = 'test-show-123';
  const showData = {
    id: showId,
    title: 'The Ticketing Pivot Musical',
    description: 'A grand production about shifting business models.',
    date: '2025-12-25T19:00:00Z',
    venue: 'Grand Theater',
    city: 'Manila',
    price: 1500, // 1500 PHP
    ticket_link: 'https://tickets.example.com',
    poster_url: 'https://example.com/poster.jpg',
    status: 'approved',
    niche: 'local',
    producer_id: 'producer-123',
    cast_members: [],
    tags: [],
    profiles: {
      id: 'producer-123',
      group_name: 'Pivot Productions',
      username: 'pivotprod',
      founded_year: 2024,
      niche: 'local'
    }
  };

  test.beforeEach(async ({ page }) => {
    // Add testing backdoor to avoid auth loading timeout
    await page.addInitScript(() => {
        window.PlaywrightTest = true;
    });

    // Mock Supabase Auth (Guest)
    await page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    // Mock Show Details
    // Match both singular show requests and potential others
    await page.route(`**/rest/v1/shows*`, async (route) => {
      const url = route.request().url();
      if (url.includes(`id=eq.${showId}`)) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Content-Range': '0-0/1' },
            body: JSON.stringify([showData]) // Return array as REST API does
          });
      } else {
          await route.continue();
      }
    });
  });

  test('should render show details with "Get Tickets" button and no video player on /shows/:id', async ({ page }) => {
    // Navigate to the PLURAL route to verify the alias
    await page.goto(`/shows/${showId}`);

    // 1. Verify Title
    await expect(page.getByRole('heading', { name: showData.title })).toBeVisible({ timeout: 10000 });

    // 2. Verify "Get Tickets" Button
    // The button might have price in text, e.g., "Get Tickets (₱1500)"
    const ticketBtn = page.getByRole('button', { name: /Get Tickets/i });
    await expect(ticketBtn).toBeVisible();
    await expect(ticketBtn).toHaveText(/Get Tickets \(₱1500\)/);

    // 3. Verify Poster
    // Look for an image with alt text matching title
    const poster = page.getByAltText(showData.title);
    await expect(poster).toBeVisible();

    // 4. Verify Description
    await expect(page.getByText(showData.description)).toBeVisible();

    // 5. Verify Absence of Video Player
    const videoTag = page.locator('video');
    await expect(videoTag).toHaveCount(0);

    // Also check for "Watch Now" text just in case
    await expect(page.getByText('Watch Now')).toHaveCount(0);
  });

  test('should render show details on singular /show/:id', async ({ page }) => {
      await page.goto(`/show/${showId}`);
      await expect(page.getByRole('heading', { name: showData.title })).toBeVisible({ timeout: 10000 });
  });
});
