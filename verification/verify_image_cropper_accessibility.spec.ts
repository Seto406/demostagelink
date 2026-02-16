import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Image Cropper Accessibility', () => {
    test.beforeEach(({ page }) => {
        // Debug logging
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[vite]') && !text.includes('Download the React')) {
                console.log(`[Browser] ${text}`);
            }
        });
    });

    const mockProducerUser: User = {
        id: 'producer-user-id',
        email: 'producer@example.com',
        user_metadata: { full_name: 'Producer User', avatar_url: null },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockProducerSession: Session = {
        access_token: 'mock-producer-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockProducerUser
    };

    // Valid 1x1 transparent PNG
    const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    const setupMocks = async (page: Page) => {
        // Initialize global variables
        await page.addInitScript((data) => {
            const win = window as unknown as CustomWindow;
            win.PlaywrightTest = true;
            win.PlaywrightUser = data.currentUser;
            window.localStorage.setItem('stagelink_tour_seen_producer-user-id', 'true');
        }, { currentUser: mockProducerUser });

        // Mock Auth
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducerSession) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducerUser) });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
            const url = route.request().url();
            if (url.includes('id=eq')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([{
                        id: mockProducerUser.id,
                        user_id: mockProducerUser.id,
                        group_name: 'Test Productions',
                        role: 'producer',
                        avatar_url: null,
                        niche: 'local'
                    }])
                });
            } else {
                 await route.fulfill({ status: 200, body: '[]' });
            }
        });

        // Mock Shows - Empty list initially
        await page.route('**/rest/v1/shows*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'Content-Range': '0-0/1' },
                body: JSON.stringify([])
            });
        });

        // Mock other endpoints
        await page.route('**/rest/v1/notifications*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/rest/v1/producer_requests*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/functions/v1/check-subscription*', async r => r.fulfill({ body: JSON.stringify({ isPro: false }) }));
    };

    test('Image Cropper has accessible controls', async ({ page }) => {
        await setupMocks(page);
        await page.goto('/dashboard');

        // Open Add Show Modal
        await page.locator('#add-show-button').click();
        await expect(page.getByRole('heading', { name: 'Add New Show' })).toBeVisible();

        // Upload Poster to trigger Cropper
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles({
            name: 'poster.png',
            mimeType: 'image/png',
            buffer: validPngBuffer
        });

        // Wait for Cropper Modal
        // Note: Without accessible description, checking for aria-describedby might fail or be skipped here.
        // We focus on finding the sliders by their accessible names.

        const cropperDialog = page.getByText('Adjust Image');
        await expect(cropperDialog).toBeVisible({ timeout: 10000 });

        // Check Sliders Accessibility
        const sliders = page.getByRole('slider');
        await expect(sliders).toHaveCount(2);

        const zoomSlider = sliders.nth(0);
        const rotateSlider = sliders.nth(1);

        // Check if sliders have accessible names
        // We expect them to be labelled by "Zoom" and "Rotate"
        // This assertion will fail if aria-label or aria-labelledby is missing
        await expect(zoomSlider).toHaveAccessibleName('Zoom');
        await expect(rotateSlider).toHaveAccessibleName('Rotate');

        // Take screenshot for visual verification
        await page.screenshot({ path: 'verification/image_cropper_accessibility.png' });
    });
});
