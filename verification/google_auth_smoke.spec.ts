import { test, expect } from '@playwright/test';

test.describe('Google Auth & Environment Smoke Tests', () => {

  test('Google Sign-In button triggers correct Supabase OAuth flow', async ({ page }) => {
    // Prevent actual redirect to Google/Supabase to keep test local and fast
    await page.route('**/auth/v1/authorize?provider=google*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'http://localhost/dummy' })
      });
    });

    await page.goto('/login');

    const googleBtn = page.getByRole('button', { name: 'Google' });
    await expect(googleBtn).toBeVisible();

    // Expect a request to the authorize endpoint with provider=google
    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/auth/v1/authorize') &&
      request.url().includes('provider=google')
    );

    await googleBtn.click();
    const request = await requestPromise;

    // Verify Project ID in URL (validates VITE_SUPABASE_URL is correct)
    // Project ID: dssbduklgbmxezpjpuen
    expect(request.url()).toContain('dssbduklgbmxezpjpuen');
    console.log('Google Auth Request URL verified:', request.url());
  });

  test('Supabase Client is initialized with correct API Keys', async ({ page }) => {
    // This test verifies VITE_SUPABASE_PUBLISHABLE_KEY is loaded by triggering a request that requires it.
    // We use a dummy login attempt because it forces the client to send the 'apikey' header.
    await page.goto('/login');

    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/auth/v1/token') &&
      request.method() === 'POST'
    );

    await page.fill('input[type="email"]', 'check_keys@example.com');
    await page.fill('input[type="password"]', 'DummyPass123!');

    // Click the Log In button
    await page.getByRole('button', { name: 'Log In' }).click();

    const request = await requestPromise;
    const headers = request.headers();
    const apiKey = headers['apikey'];

    console.log('API Key Header found:', apiKey);

    // Validate Key Presence
    expect(apiKey).toBeDefined();

    // Validate Key Format
    // This project uses a custom key format starting with 'sb_publishable_'
    expect(apiKey).toContain('sb_publishable_');
  });

});
