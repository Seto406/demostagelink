import { test, expect, Page } from '@playwright/test';

test.describe('Image Cropper Accessibility', () => {

    // Minimal mock setup to get us to the dashboard
    const mockProducerUser = {
        id: 'producer-user-id',
        email: 'producer@example.com',
        user_metadata: { full_name: 'Producer User' },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockProducerSession = {
        access_token: 'mock-producer-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockProducerUser
    };

    const setupMocks = async (page: Page) => {
         await page.addInitScript((data) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.currentUser;
            window.localStorage.setItem('stagelink_tour_seen_producer-user-id', 'true');
        }, { currentUser: mockProducerUser });

        await page.route('**/auth/v1/session', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducerSession) }));
        await page.route('**/auth/v1/user', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducerUser) }));

        // Mock profile to be a producer
        await page.route('**/rest/v1/profiles*', async route => {
            if (route.request().url().includes('id=eq')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: mockProducerUser.id,
                        user_id: mockProducerUser.id,
                        role: 'producer',
                        group_name: 'Test Group',
                        created_at: new Date().toISOString()
                    }])
                });
            } else {
                await route.fulfill({ status: 200, body: '[]' });
            }
        });

        // Mock Health Check
        await page.route('**/rpc/get_service_health', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify('active')
            });
        });

        // Mock other calls to avoid errors
        await page.route('**/rest/v1/shows*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/rest/v1/notifications*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/functions/v1/check-subscription*', async r => r.fulfill({ body: JSON.stringify({ isPro: false }) }));
    };

    test('Zoom and Rotate sliders should have aria-labels', async ({ page }) => {
        await setupMocks(page);
        await page.goto('/dashboard');

        // Check where we are
        await expect(page).toHaveURL(/\/dashboard/);

        // Wait for loading to finish (Loader should disappear)
        await expect(page.getByText('Loading dashboard...')).toBeHidden();

        // Verify Dashboard Header
        await expect(page.locator('h1')).toHaveText('Dashboard');

        // Verify Quick Actions
        await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();

        // Try to click the button
        await page.locator('#add-show-button').click();

        // Upload Poster to trigger Cropper
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles({
            name: 'poster.png',
            mimeType: 'image/png',
            buffer: buffer
        });

        // Wait for Cropper Dialog
        await expect(page.getByText('Adjust Image')).toBeVisible();

        const sliders = page.locator('[role="slider"]');
        await expect(sliders).toHaveCount(2);

        const zoomSlider = sliders.first();
        const rotateSlider = sliders.nth(1);

        // This assertion is expected to FAIL before the fix
        await expect(zoomSlider).toHaveAttribute('aria-label', 'Zoom', { timeout: 1000 });
        await expect(rotateSlider).toHaveAttribute('aria-label', 'Rotate', { timeout: 1000 });
    });
});
