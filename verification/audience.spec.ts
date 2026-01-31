import { test, expect } from '@playwright/test';

test.describe('Audience Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Robust Mocking for Shows
    await page.route('**/rest/v1/shows?*', async (route) => {
      const url = new URL(route.request().url());
      const idParam = url.searchParams.get('id');

      const mockShow1 = {
        id: '1',
        title: 'Mock Show 1',
        description: 'A great mock show',
        date: '2026-05-20T19:00:00',
        venue: 'Mock Venue',
        city: 'Manila',
        niche: 'local',
        genre: 'Drama',
        ticket_link: 'https://example.com/tickets',
        poster_url: 'https://via.placeholder.com/300',
        status: 'approved',
        producer_id: 'prod1',
        profiles: {
          id: 'prod1',
          group_name: 'Mock Group 1',
          description: 'Desc',
          founded_year: 2020,
          niche: 'local',
          avatar_url: 'https://via.placeholder.com/50'
        }
      };

      const mockShow2 = {
        id: '2',
        title: 'Mock Show 2',
        description: 'Another mock show',
        date: '2026-06-15T20:00:00',
        venue: 'Grand Theater',
        city: 'Quezon City',
        niche: 'university',
        genre: 'Musical',
        ticket_link: 'https://example.com/tickets2',
        poster_url: 'https://via.placeholder.com/300',
        status: 'approved',
        producer_id: 'prod2',
        profiles: {
          id: 'prod2',
          group_name: 'Mock Group 2',
          description: 'Desc 2',
          founded_year: 2021,
          niche: 'university',
          avatar_url: 'https://via.placeholder.com/50'
        }
      };

      if (idParam === 'eq.1') {
        // Detail view
        await route.fulfill({ json: [mockShow1] });
      } else {
        // List view
        await route.fulfill({ json: [mockShow1, mockShow2] });
      }
    });
  });

  test('Landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/StageLink/);
    await expect(page.getByText('Recent Productions')).toBeVisible();
  });

  test('Shows page displays list', async ({ page }) => {
    await page.goto('/shows');
    await expect(page.getByText('Mock Show 1')).toBeVisible();
    await expect(page.getByText('Mock Show 2')).toBeVisible();
  });

  test('Navigate to Show Details', async ({ page }) => {
    await page.goto('/shows');
    await page.getByText('Mock Show 1').click();

    // Check details on the new page
    await expect(page.getByRole('heading', { name: 'Mock Show 1' })).toBeVisible();
    await expect(page.getByText('A great mock show')).toBeVisible();
    await expect(page.getByText('Mock Venue')).toBeVisible();
  });
});
