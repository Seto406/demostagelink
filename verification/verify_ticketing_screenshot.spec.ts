import { test, expect } from '@playwright/test';

test.describe('Visual Verification', () => {
  const showId = 'test-show-visual';
  const showData = {
    id: showId,
    title: 'Visual Verification Show',
    description: 'Verifying the ticketing UI.',
    date: '2025-12-25T19:00:00Z',
    venue: 'Visual Theater',
    city: 'Manila',
    price: 1500,
    ticket_link: 'https://tickets.example.com',
    poster_url: null, // Use fallback or null
    status: 'approved',
    niche: 'local',
    producer_id: 'producer-visual',
    cast_members: [],
    tags: [],
    profiles: {
      id: 'producer-visual',
      group_name: 'Visual Productions',
      username: 'visualprod',
      founded_year: 2024,
      niche: 'local'
    }
  };

  test('capture screenshot of show details', async ({ page }) => {
    // Add backdoor
    await page.addInitScript(() => {
        window.PlaywrightTest = true;
    });

    // Mock Auth
    await page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    // Mock Show
    await page.route(`**/rest/v1/shows*`, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Content-Range': '0-0/1' },
            body: JSON.stringify([showData])
          });
    });

    // Mock Profile
    await page.route(`**/rest/v1/profiles*`, async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto(`/shows/${showId}`);

    // Wait for content
    await expect(page.getByRole('heading', { name: showData.title })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Tickets/i })).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'verification/ticketing_pivot.png', fullPage: true });
  });
});
