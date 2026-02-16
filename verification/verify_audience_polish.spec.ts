import { test, expect } from '@playwright/test';

test.describe('Audience Polish Verification', () => {
  const TEST_SHOW_ID = 'test-show-123';

  test.beforeEach(async ({ page }) => {
    // 1. Mock Service Health
    await page.route('**/rpc/get_service_health', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      });
    });

    // 2. Mock Auth Session (Network)
    await page.route('**/auth/v1/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user-id', email: 'test@example.com' }
        })
      });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'test-user-id', email: 'test@example.com' })
        });
    });

    // Mock Profile
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                id: 'test-user-id',
                username: 'TestUser',
                role: 'audience',
                avatar_url: null
            })
        });
    });

    // 3. Mock Show Details
    await page.route(`**/rest/v1/shows?select=*&id=eq.${TEST_SHOW_ID}*`, async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: TEST_SHOW_ID,
          title: 'Test Show for Verification',
          description: 'This is a test show description.',
          date: new Date().toISOString(),
          venue: 'Test Venue',
          city: 'Test City',
          price: 500,
          status: 'approved',
          producer_id: 'producer-id',
          profiles: {
            group_name: 'Test Producer Group',
            username: 'testproducer',
            niche: 'local'
          }
        })
      });
    });

    // Mock Tickets (for Profile page)
    await page.route('**/rest/v1/tickets*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify([])
        });
    });

    // Mock Follows
    await page.route('**/rest/v1/follows*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify([])
        });
    });

    // Mock Reviews
    await page.route('**/rest/v1/reviews*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify([])
        });
    });

    // 4. Set LocalStorage for Auth
    await page.addInitScript(() => {
        // Inject Playwright flags for AuthContext
        (window as any).PlaywrightTest = true;
        (window as any).PlaywrightUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' }
        };

        window.localStorage.setItem('sb-fithrswzswxqbdhmqqac-auth-token', JSON.stringify({
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: 'bearer',
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            }
        }));
    });
  });

  test('Verify Venue Info Link Removal and Navbar Ticket Icon', async ({ page }) => {
    // Navigate to Show Details
    await page.goto(`/show/${TEST_SHOW_ID}`);

    // Wait for content to load
    await expect(page.getByText('Test Show for Verification')).toBeVisible();

    // 1. Verify "Add to Google Calendar" link is GONE from Venue Info
    // It used to be in Venue Information section.
    // "Venue Information" header should be visible
    await expect(page.getByText('Venue Information')).toBeVisible();

    // The link text should NOT be visible
    await expect(page.getByText('Add to Google Calendar')).not.toBeVisible();

    // Take screenshot of Show Details
    await page.screenshot({ path: 'verification/show_details_clean.png', fullPage: true });

    // 2. Verify Ticket Icon in Navbar
    // Look for the ticket icon button in the navbar.
    // We added aria-label="My Passes"
    const ticketButton = page.getByLabel('My Passes');
    await expect(ticketButton).toBeVisible();

    // Click it
    await ticketButton.click();

    // 3. Verify Navigation to Profile
    await expect(page).toHaveURL(/\/profile/);

    // Wait for Profile to load "My Passes" tab (default)
    await expect(page.getByRole('tab', { name: 'My Passes' })).toHaveAttribute('data-state', 'active');

    // Take screenshot of Profile
    await page.screenshot({ path: 'verification/profile_passes.png' });
  });
});
