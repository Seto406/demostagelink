import { test, expect } from '@playwright/test';

test('Marquee and ScrollToTop do not overlap', async ({ page }) => {
  // Mock Supabase Auth to simulate unauthenticated user
  // Providing a valid empty session structure helps the client resolve quickly
  await page.route('**/auth/v1/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null, session: null })
    });
  });

  await page.route('**/auth/v1/user', async route => {
     await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null })
    });
  });

  await page.goto('http://localhost:8080/');

  // Wait for load - BrandedLoader should disappear
  // Use expect().not.toBeVisible() which is more robust than waitForSelector detached
  const loader = page.getByText('Loading...', { exact: false });
  await expect(loader).not.toBeVisible({ timeout: 15000 });

  // Scroll down to trigger ScrollToTop visibility (> 400px)
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000); // Wait for animation

  // Locate components
  const marqueeWrapper = page.locator('div.fixed.bottom-0');
  const scrollButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-up') });

  await expect(marqueeWrapper).toBeVisible();
  await expect(scrollButton).toBeVisible();

  // Get bounding boxes to verify positions
  const marqueeBox = await marqueeWrapper.boundingBox();
  const scrollBox = await scrollButton.boundingBox();

  console.log('Marquee Box:', marqueeBox);
  console.log('Scroll Box:', scrollBox);

  if (marqueeBox && scrollBox) {
      const bottomOfScrollButton = scrollBox.y + scrollBox.height;
      const topOfMarquee = marqueeBox.y;

      console.log(`Bottom of Scroll Button: ${bottomOfScrollButton}`);
      console.log(`Top of Marquee: ${topOfMarquee}`);

      // Ensure scroll button is above marquee
      expect(bottomOfScrollButton).toBeLessThan(topOfMarquee);
  }

  await page.screenshot({ path: 'verification/marquee_overlap_check.png' });
});
