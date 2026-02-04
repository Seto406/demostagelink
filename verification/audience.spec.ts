import { test, expect } from '@playwright/test';

test.describe('Audience Experience', () => {
  const showId = 'show-123';
  const producerId = 'producer-123';

  test.beforeEach(async ({ page }) => {
    // Mock Auth - No Session
    await page.route('**/auth/v1/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null })
      });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: null })
        });
    });

    // Unified REST Mock
    await page.route('**/rest/v1/**', async route => {
        const url = route.request().url();

        if (url.includes('/shows')) {
             if (url.includes(`id=eq.${showId}`)) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: showId,
                        title: 'Test Show Title',
                        description: 'This is a test show description.',
                        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                        venue: 'Test Venue',
                        city: 'Manila',
                        ticket_link: 'https://example.com/tickets',
                        poster_url: null,
                        niche: 'local',
                        status: 'approved',
                        created_at: new Date().toISOString(),
                        genre: 'Drama',
                        director: 'Test Director',
                        duration: '2 hours',
                        tags: ['drama', 'original'],
                        cast_members: ['Actor 1', 'Actor 2'],
                        price: 500,
                        profiles: {
                            id: producerId,
                            group_name: 'Test Producer Group',
                            description: 'A test group',
                            founded_year: 2020,
                            niche: 'local'
                        }
                    }])
                });
            } else {
                // List Response
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: showId,
                        title: 'Test Show Title',
                        description: 'This is a test show description.',
                        date: new Date(Date.now() + 86400000).toISOString(),
                        venue: 'Test Venue',
                        city: 'Manila',
                        niche: 'local',
                        genre: 'Drama',
                        ticket_link: 'https://example.com/tickets',
                        poster_url: null,
                        profiles: {
                            id: producerId,
                            group_name: 'Test Producer Group',
                            avatar_url: null
                        }
                    }])
                });
            }
        } else if (url.includes('/reviews')) {
             await route.fulfill({
                status: 200,
                headers: { 'Content-Range': '0-0/0' },
                contentType: 'application/json',
                body: JSON.stringify([])
             });
        } else {
            await route.continue();
        }
    });
  });

  test('Shows List renders correctly', async ({ page }) => {
    await page.goto('/shows');

    // Wait for loader to disappear
    await expect(page.locator('text=Loading...')).toBeHidden({ timeout: 15000 });

    // Check Title
    await expect(page.getByRole('heading', { name: 'All Productions' })).toBeVisible({ timeout: 15000 });

    // Check Show Card
    await expect(page.getByText('Test Show Title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Test Producer Group')).toBeVisible();

    // Check City Filter (verifies cities were extracted)
    await expect(page.getByRole('button', { name: 'Manila' })).toBeVisible();
  });

  test('Show Details page renders correctly', async ({ page }) => {
    await page.goto(`/show/${showId}`);

    // Wait for loader
    await expect(page.locator('text=Loading production details...')).toBeHidden();

    // Check Title
    await expect(page.getByRole('heading', { name: 'Test Show Title' })).toBeVisible({ timeout: 15000 });

    // Check Details
    await expect(page.getByText('Test Venue')).toBeVisible();
    await expect(page.getByText('Test Director')).toBeVisible();

    // Check Ticket Button (External Link)
    // Logic: show.price > 0 ? "External Site" : "Get Tickets"
    await expect(page.getByRole('button', { name: 'External Site' })).toBeVisible();

    // Check "Log in to Review" section
    await expect(page.getByRole('button', { name: 'Log in to Review' })).toBeVisible();
  });
});
