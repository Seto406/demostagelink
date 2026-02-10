import { test, expect } from '@playwright/test';

test('Google Login sends correct prompt parameters', async ({ page }) => {
    // Navigate to login page
    // Ensure we are not logged in (clearing storage just in case)
    await page.addInitScript(() => {
        window.localStorage.clear();
    });

    await page.goto('/login');

    // Wait for the button to appear
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();

    // Monitor for navigation or request to Supabase OAuth authorization
    // The request usually contains provider=google
    // Use a simpler predicate to debug if needed
    const authRequestPromise = page.waitForRequest(request =>
        request.url().includes('/auth/v1/authorize') &&
        request.url().includes('provider=google')
    );

    // Click the Google login button
    await page.getByRole('button', { name: /Google/i }).click();

    // Wait for the request with a timeout just in case
    try {
        const request = await authRequestPromise;
        const url = new URL(request.url());

        // Check for query parameters
        const prompt = url.searchParams.get('prompt');
        console.log('Prompt parameter:', prompt);

        // The prompt parameter should be 'consent select_account'
        expect(prompt).toBe('consent select_account');
    } catch (e) {
        console.error('Request interception failed or timeout:', e);
        throw e;
    }
});
