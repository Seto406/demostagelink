import { test, expect } from '@playwright/test';

test.describe('User Registration Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Supabase Auth Signup
    await page.route('**/auth/v1/signup*', async (route) => {
      // Return a success response simulating email confirmation required
      await route.fulfill({
        status: 200,
        json: {
          user: {
            id: 'new-user-id-123',
            email: 'newuser@example.com',
            role: 'authenticated',
            aud: 'authenticated',
            user_metadata: { role: 'audience' }
          },
          session: null, // Session is null because email confirmation is required
        },
      });
    });

    // 2. Mock Supabase Auth Session (start as logged out)
    await page.route('**/auth/v1/session*', async (route) => {
       await route.fulfill({ status: 200, json: null });
    });

    // 3. Mock Supabase Auth User (start as logged out)
    await page.route('**/auth/v1/user*', async (route) => {
       await route.fulfill({ status: 401, json: { error: "unauthorized" } });
    });

    // 4. Inject PlaywrightTest flag to disable AuthContext loading state
    await page.addInitScript(() => {
      const win = window as any;
      win.PlaywrightTest = true;
      // Do NOT set PlaywrightUser, so it defaults to null (logged out)
    });
  });

  test('New user can sign up as Audience Member', async ({ page }) => {
    await page.goto('/login');

    // Wait for the "Welcome Back" screen (default login mode)
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Click "Sign up" to switch mode
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Now verifies "Join StageLink" selection screen
    await expect(page.getByRole('heading', { name: 'Join StageLink' })).toBeVisible();

    // Click "I'm an Audience Member"
    // The button contains this text and an emoji. partial match is fine or getByRole with name.
    await page.getByRole('button', { name: "I'm an Audience Member" }).click();

    // Verify form title "Audience Sign Up"
    await expect(page.getByRole('heading', { name: 'Audience Sign Up' })).toBeVisible();

    // Fill form
    await page.getByLabel('First Name').fill('Test User');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');

    // Check Consent
    // Targeting by ID as the label is complex with links
    await page.locator('#consent').check();

    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify redirection to /verify-email and presence of page heading
    // Redirection confirms that signUp succeeded
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.getByRole('heading', { name: 'Check Your Email' })).toBeVisible();
  });
});
