import { test, expect } from '@playwright/test';

test.describe('Scroll To Top Component', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Session (Unauthenticated)
        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
        });

        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
        });
    });

    test('should appear when scrolled down and scroll to top when clicked', async ({ page }) => {
        // Navigate to Landing Page
        await page.goto('/');

        // Ensure page is loaded (wait for hero text)
        await expect(page.getByRole('heading', { name: 'The Stage Is Yours.' })).toBeVisible();

        // Initially, the button should NOT be visible
        const scrollBtn = page.getByTestId('scroll-to-top-btn');
        await expect(scrollBtn).toBeHidden();

        // Scroll down to trigger visibility (> 400px)
        await page.evaluate(() => window.scrollTo(0, 1000));

        // Wait for button to appear (animation)
        await expect(scrollBtn).toBeVisible();

        // Check Accessibility: ARIA Label
        await expect(scrollBtn).toHaveAttribute('aria-label', 'Scroll to top');

        // Check UX: Tooltip
        await scrollBtn.hover();
        const tooltip = page.getByRole('tooltip');
        // Wait for tooltip (radix ui tooltips have a delay)
        // Check if tooltip content is visible
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText('Scroll to top');

        // Check Functionality: Click to Scroll Top
        await scrollBtn.click();

        // Wait for smooth scroll to finish (approximate check)
        // We can poll the scrollY position
        await expect.poll(async () => {
            return await page.evaluate(() => window.scrollY);
        }, {
            timeout: 5000,
            intervals: [250]
        }).toBeLessThan(10); // Close to 0
    });
});
