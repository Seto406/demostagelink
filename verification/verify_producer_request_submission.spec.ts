import { test, expect } from '@playwright/test';

test.describe('Producer Request Submission', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'audience@example.com',
    user_metadata: { full_name: 'Test Audience' },
    app_metadata: { provider: 'email' },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString()
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser
  };

  test.beforeEach(async ({ page }) => {
    // Mock Auth using the backdoor
    await page.addInitScript((data) => {
      const win = window as any;
      win.PlaywrightTest = true;
      win.PlaywrightUser = data.mockUser;
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(data.mockSession));
    }, { mockUser, mockSession });

    // Mock Session/User endpoints (fallback)
    await page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({ status: 200, json: mockSession });
    });

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ status: 200, json: mockUser });
    });

    // Mock Profile (Audience Role)
    await page.route('**/rest/v1/profiles*', async (route) => {
      if (route.request().method() === 'GET') {
        // Return array as Supabase might default to list if Accept header isn't strict,
        // or client handles single item array.
        // But for .maybeSingle(), usually sending array [obj] works fine in mocks.
        await route.fulfill({
          status: 200,
          json: [{
            id: 'profile-123',
            user_id: 'test-user-id',
            role: 'audience',
            username: 'audience_user',
            avatar_url: null,
            group_name: null
          }]
        });
      } else {
        await route.continue();
      }
    });

    // Mock existing producer requests (none initially)
    await page.route('**/rest/v1/producer_requests*', async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
             await route.fulfill({
                status: 200,
                json: [] // No existing request
            });
        } else if (method === 'POST') {
             // Let the test case handle the interception/assertion
             await route.continue();
        } else {
             await route.continue();
        }
    });
  });

  test('Audience member can submit a producer request', async ({ page }) => {
    // Intercept the POST request to verify payload and simulate success
    let interceptedRequestPayload: any = null;
    await page.route('**/rest/v1/producer_requests', async (route) => {
      if (route.request().method() === 'POST') {
        interceptedRequestPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201, // Created
          json: { id: 'new-request-id', status: 'pending' }
        });
      } else {
        await route.continue(); // Fallback to setup mock if GET
      }
    });

    await page.goto('/settings');

    // Wait for "Become a Producer" section
    await expect(page.getByText('Become a Producer')).toBeVisible({ timeout: 10000 });

    // Click "Request Producer Access"
    await page.getByRole('button', { name: 'Request Producer Access' }).click();

    // Verify Modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Request Producer Access' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Theater Group Name *').fill('My Awesome Theater');
    await page.getByLabel('Portfolio/Social Link *').fill('https://facebook.com/awesome-theater');

    // Submit
    await page.getByRole('button', { name: 'Submit Request' }).click();

    // Verify Success Toast
    await expect(page.getByText('Request Submitted')).toBeVisible();
    await expect(page.getByText('Your request to become a producer has been submitted for review.')).toBeVisible();

    // Verify Request Payload
    expect(interceptedRequestPayload).toBeTruthy();
    expect(interceptedRequestPayload).toMatchObject({
      user_id: 'test-user-id',
      group_name: 'My Awesome Theater',
      portfolio_link: 'https://facebook.com/awesome-theater'
    });

    // Verify UI updates (Pending status)
    await expect(page.getByText('Request Status: Pending')).toBeVisible();
  });
});
