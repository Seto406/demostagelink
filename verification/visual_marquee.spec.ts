import { test, expect } from '@playwright/test';

test('Marquee stays sticky on scroll', async ({ page }) => {
  // Mock Supabase Auth to simulate unauthenticated user
  await page.route('**/auth/v1/session', async route => {
    await route.fulfill({ status: 200, body: JSON.stringify(null) });
  });
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({ status: 200, body: JSON.stringify(null) });
  });

  await page.goto('http://localhost:8080/');

  // Wait for load - BrandedLoader should disappear
  await page.waitForSelector('text=Loading...', { state: 'detached', timeout: 10000 });

  console.log('Current URL:', await page.url());

  // Now we should be on landing page
  const heading = page.getByRole('heading', { name: /The Stage/i });
  await expect(heading).toBeVisible();

  // Marquee text
  const marqueeText = page.locator('text=Ang Huling El Bimbo').first();
  await expect(marqueeText).toBeVisible({ timeout: 10000 });

  // Wrapper class
  const wrapper = page.locator('div.fixed.bottom-0');
  await expect(wrapper).toBeVisible();

  await page.screenshot({ path: 'verification/marquee_top.png' });

  // Scroll
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(1000);

  await expect(wrapper).toBeInViewport();
  await page.screenshot({ path: 'verification/marquee_scrolled.png' });
});
