import { test, expect } from '@playwright/test';

test.describe('User Registration Failure Path', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Log all requests
    page.on('request', request => console.log('REQUEST:', request.url()));

    // 1. Mock Supabase Auth Signup to FAIL
    // Using a broader pattern to ensure match
    await page.route('**/auth/v1/signup*', async (route) => {
      console.log('!!! INTERCEPTED SIGNUP REQUEST !!!');
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          msg: "User already registered", // Trying 'msg' as common Supabase error field
          code: 400
        })
      });
    });

    // 2. Mock Supabase Auth Session (start as logged out)
    await page.route('**/auth/v1/session*', async (route) => {
       await route.fulfill({ status: 200, json: { session: null } });
    });

    // 3. Mock Supabase Auth User (start as logged out)
    await page.route('**/auth/v1/user*', async (route) => {
       await route.fulfill({ status: 401, json: { error: "unauthorized" } });
    });

    // 4. Inject PlaywrightTest flag
    await page.addInitScript(() => {
      const win = window as any;
      win.PlaywrightTest = true;
    });
  });

  test('User gets an error toast when signup fails', async ({ page }) => {
    await page.goto('/login');

    // Wait for the "Welcome Back" screen
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Click "Sign up"
    await page.getByRole('button', { name: 'Sign up' }).click();

    // "Join StageLink" selection screen
    await expect(page.getByRole('heading', { name: 'Join StageLink' })).toBeVisible();

    // Click "I'm an Audience Member"
    await page.getByRole('button', { name: "I'm an Audience Member" }).click();

    // Fill form
    await page.getByLabel('Email').fill('existinguser@example.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.locator('#consent').check();

    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify Toast appears with status code
    await expect(page.getByText(/User already registered \(Status: 400\)/)).toBeVisible({ timeout: 10000 });
  });
});
