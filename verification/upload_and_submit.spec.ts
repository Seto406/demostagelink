
import { test, expect, Page } from '@playwright/test';
import { User, Session, CustomWindow } from './test-types';

test.describe('Upload and Submit Verification', () => {
    test.beforeEach(({ page }) => {
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('[vite]') && !text.includes('Download the React')) {
                console.log(`[Browser] ${text}`);
            }
        });

        // Debug: Log all network requests to identify URL patterns
        page.on('request', request => {
            if (request.url().includes('storage/v1')) {
                console.log(`[Network] Request: ${request.method()} ${request.url()}`);
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
            const method = route.request().method();

            if (method === 'PATCH') {
                console.log('[Mock] Profile Update Intercepted');
                await route.fulfill({ status: 200, body: JSON.stringify({}) });
                return;
            }

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

        // Mock Storage Upload (Posters) - Using glob ** for recursive match
        await page.route('**/storage/v1/object/posters/**', async (route) => {
            const method = route.request().method();
            console.log(`[Mock] Hit Poster Storage Route: ${method} ${route.request().url()}`);

            if (method === 'POST') {
                console.log('[Mock] Storage Upload (Posters) Intercepted');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ Key: 'posters/producer-user-id/mock-poster.jpg' })
                });
            } else {
                 await route.continue();
            }
        });

         // Mock Storage Upload (Avatars) - Using glob ** for recursive match
        await page.route('**/storage/v1/object/avatars/**', async (route) => {
             const method = route.request().method();
             console.log(`[Mock] Hit Avatar Storage Route: ${method} ${route.request().url()}`);

            if (method === 'POST') {
                console.log('[Mock] Storage Upload (Avatars) Intercepted');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ Key: 'avatars/producer-user-id/mock-avatar.jpg' })
                });
            } else {
                await route.continue();
            }
        });

        // Mock Shows
        await page.route('**/rest/v1/shows*', async (route) => {
            const method = route.request().method();
            if (method === 'POST') {
                const postData = route.request().postDataJSON();
                console.log('[Mock] Show Insert:', postData);

                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'new-show-id', ...postData, status: 'pending' })
                });
            } else {
                // GET requests
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': '0-0/1' },
                    body: JSON.stringify([])
                });
            }
        });

        // Mock other endpoints
        await page.route('**/rest/v1/notifications*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/rest/v1/producer_requests*', async r => r.fulfill({ body: '[]' }));
        await page.route('**/functions/v1/check-subscription*', async r => r.fulfill({ body: JSON.stringify({ isPro: false }) }));
    };

    test('Producer can upload poster and submit show', async ({ page }) => {
        await setupMocks(page);
        await page.goto('/dashboard');

        // Open Add Show Modal
        await page.locator('#add-show-button').click();
        await expect(page.getByRole('heading', { name: 'Add New Show' })).toBeVisible();

        // Fill Basic Info
        await page.fill('#showTitle', 'Poster Upload Test');
        await page.fill('#showDate', '2026-11-01');
        await page.fill('#showVenue', 'Grand Theater');

        // Select City
        await page.locator('button').filter({ hasText: 'Select city' }).click();
        await page.getByRole('option', { name: 'Makati' }).click();

        // Upload Poster
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles({
            name: 'poster.png',
            mimeType: 'image/png',
            buffer: validPngBuffer
        });

        // Handle Cropper Modal
        const cropperDialog = page.getByText('Adjust Image');
        // Wait for image to load inside cropper might take a split second
        await expect(cropperDialog).toBeVisible({ timeout: 10000 });

        // Click "Save Crop"
        await page.getByRole('button', { name: 'Save Crop' }).click();

        // Wait for cropper to close and preview to appear
        await expect(cropperDialog).toBeHidden();
        await expect(page.locator('img[alt="Poster preview"]')).toBeVisible();

        // Submit
        const submitButton = page.getByRole('button', { name: /Submit Show/i });
        await submitButton.click();

        // Verify Success Modal
        await expect(page.getByRole('heading', { name: /Thank You/i })).toBeVisible();
    });

    test('Producer can upload avatar in Profile', async ({ page }) => {
        await setupMocks(page);
        await page.goto('/dashboard');

        // Switch to Profile Tab
        await page.getByRole('button', { name: 'Profile' }).click();

        // Verify we are on profile tab
        await expect(page.getByRole('heading', { name: 'Group Information' })).toBeVisible();

        // Upload Avatar
        const avatarInput = page.locator('input[accept*="image/jpeg"]').first();
        await avatarInput.setInputFiles({
            name: 'avatar.png',
            mimeType: 'image/png',
            buffer: validPngBuffer
        });

        // Check if preview updates
        await expect(page.locator('img[alt="Avatar preview"]')).toBeVisible();

        // Click Save Profile
        const saveButton = page.getByRole('button', { name: 'Save Profile' });
        await saveButton.click();

        // Verify Success Toast or behavior
        await expect(page.getByText('Profile updated successfully!', { exact: true })).toBeVisible();
    });
});
