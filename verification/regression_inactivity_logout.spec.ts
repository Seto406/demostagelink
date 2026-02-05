import { test, expect } from '@playwright/test';

test.describe('Inactivity Timer Regression Test', () => {
  test.beforeEach(async ({ page }) => {
    // Mock User endpoint (Supabase will call this to validate the token from hash)
    const now = new Date().toISOString();
    const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        last_sign_in_at: now,
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: now,
        app_metadata: { provider: 'email' }
    };

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
              id: user.id,
              aud: user.aud,
              role: user.role,
              email: user.email,
              email_confirmed_at: now,
              phone: '',
              last_sign_in_at: user.last_sign_in_at,
              app_metadata: user.app_metadata,
              user_metadata: user.user_metadata,
              identities: [],
              created_at: user.created_at,
              updated_at: now
          })
        });
    });

    // Also mock session just in case
    await page.route('**/auth/v1/session', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh',
                user: user
            })
         });
    });

    // Mock Profiles
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'profile-123',
                user_id: 'test-user-123',
                role: 'audience',
                username: 'testuser'
            }])
        });
    });
  });

  test('should not log out user on fresh login via email link despite stale local storage', async ({ page }) => {
    // Inject stale local storage (31 minutes ago)
    const thirtyOneMinutesAgo = Date.now() - (31 * 60 * 1000);
    await page.addInitScript((val) => {
        localStorage.setItem('stagelink_last_activity', val);
    }, thirtyOneMinutesAgo.toString());

    // Generate Fake JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
        sub: "test-user-123",
        exp: Math.floor(Date.now()/1000) + 3600,
        email: "test@example.com",
        aud: "authenticated",
        role: "authenticated"
    }));
    const signature = "fake-sig";
    const fakeJwt = `${header}.${payload}.${signature}`;

    // Navigate with hash to simulate email verification link
    const hash = `access_token=${fakeJwt}&refresh_token=fake-refresh&expires_in=3600&token_type=bearer&type=signup`;
    await page.goto(`/verify-email#${hash}`);

    // Wait a bit to ensure IdleTimer would have triggered
    await page.waitForTimeout(5000);

    // Check for toast
    const toast = page.getByText('You have been signed out due to inactivity.');

    // Ensure toast is hidden (Fix verification)
    await expect(toast).toBeHidden();

    // Ensure we are not on login page
    await expect(page).not.toHaveURL(/\/login/);
  });
});
