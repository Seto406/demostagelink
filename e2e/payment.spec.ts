import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const hasRealValue = (value?: string) => {
  if (!value) return false;
  return !value.startsWith('your_') && !value.includes('your-project-ref');
};

test.describe('Payment E2E Flow', () => {
  let showId;
  let supabase;

  test.beforeAll(async () => {
    if (!hasRealValue(SUPABASE_URL) || !hasRealValue(SUPABASE_ANON_KEY)) {
      test.skip(true, 'Skipping payment E2E: missing Supabase env configuration');
      return;
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Fetch a valid show with price > 0 (paid shows allow guest checkout)
    const { data: shows } = await supabase.from('shows').select('id').gt('price', 0).limit(1);
    if (shows && shows.length > 0) {
      showId = shows[0].id;
    }
  });

  test('Guest user can initiate checkout and handle redirect', async ({ page }) => {
    if (!showId) test.skip('No paid show found in DB');

    // 1. Navigate to Show Page
    await page.goto(`/show/${showId}`); // CORRECTED PATH

    // 2. Click Buy Tickets
    // Expect a "Buy Tickets" primary CTA.
    console.log(`Navigating to show: ${showId}`);
    // Wait for network idle to ensure content is loaded
    await page.waitForLoadState('networkidle');

    const buyButton = page.locator('button').filter({ hasText: /Buy Tickets|Get Free Ticket/i }).first();

    // Check if visible with a timeout
    try {
        await expect(buyButton).toBeVisible({ timeout: 5000 });
        await buyButton.click();
    } catch (e) {
        // Log page content for debugging
        console.log('Buy button not found. Page content snippet:', await page.content().then(c => c.substring(0, 500)));
        // Fail explicitly
        throw new Error('Buy Tickets button not found on page.');
    }

    // 3. Allow either legacy checkout page or direct external handoff so the test
    // remains backward-compatible while ticket flow wiring is finalized.
    await page.waitForTimeout(1000);
    const currentUrl = page.url();

    if (/\/checkout\//i.test(currentUrl)) {
      await expect(page).toHaveURL(/\/checkout\//);
      return;
    }

    // 4. Otherwise, best-effort check for external handoff route/provider.
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/external-redirect|paymongo/i);
  });
});
