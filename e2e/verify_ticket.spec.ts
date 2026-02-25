import { test, expect } from '@playwright/test';

test('verify ticket appearance and download', async ({ page }) => {
  // Mock the verify-paymongo-payment edge function
  await page.route('**/functions/v1/verify-paymongo-payment', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'paid',
        type: 'ticket',
        message: 'Payment verified',
        ticket: {
          id: 'ticket-12345',
          status: 'confirmed',
          shows: {
            id: 'show-123',
            title: 'Test Show Title for Verification',
            date: '2023-12-25T19:00:00Z',
            venue: 'Test Venue',
            city: 'Test City',
            poster_url: 'https://placehold.co/400x600/png',
            price: 500,
            reservation_fee: 50,
            profiles: {
              group_name: 'Test Theater Group',
              niche: 'Theater'
            }
          }
        }
      })
    });
  });

  await page.goto('/payment/success?ref=test-ref');

  // Wait for ticket to appear
  const ticket = page.locator('.bg-card.border.rounded-xl.overflow-hidden.shadow-lg');
  await expect(ticket).toBeVisible();

  // Wait a bit for layout to settle
  await page.waitForTimeout(1000);

  // Take screenshot of the ticket
  await ticket.screenshot({ path: 'verification/ticket_screenshot.png' });

  // Also try to download to verify no crash
  const downloadTrigger = page.locator('.absolute.top-2.right-2 button');
  await downloadTrigger.click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Download Image').click();
  const download = await downloadPromise;
  console.log('Download initiated:', download.suggestedFilename());
});
