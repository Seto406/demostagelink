import { test, expect } from '@playwright/test';

test.describe('Payment Flow Verification', () => {
  test('Success page shows success state when payment is paid', async ({ page }) => {
    // Mock verify-paymongo-payment response
    await page.route('**/functions/v1/verify-paymongo-payment', async (route) => {
      // console.log('Mock hit for verify-paymongo-payment');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'paid', message: 'Payment successful! Your subscription is now active.' }),
      });
    });

    await page.goto('/payment/success');

    // Check for success message (Heading)
    await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible();
    await expect(page.getByText('Payment successful! Your subscription is now active.')).toBeVisible();
  });

  test('Success page shows failed state when payment is failed', async ({ page }) => {
    // Mock verify-paymongo-payment response
    await page.route('**/functions/v1/verify-paymongo-payment', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Verification failed' }),
      });
    });

    await page.goto('/payment/success');

    await expect(page.getByRole('heading', { name: 'Verification Failed' })).toBeVisible();
  });

  test('Success page shows pending state (Future Enhancement)', async ({ page }) => {
    await page.route('**/functions/v1/verify-paymongo-payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'pending', message: 'Payment is processing' }),
      });
    });

    await page.goto('/payment/success');

    await expect(page.getByRole('heading', { name: 'Payment Processing' })).toBeVisible();
  });

  test('Cancel page renders correctly', async ({ page }) => {
    await page.goto('/payment/cancel');
    await expect(page.getByRole('heading', { name: 'Payment Cancelled' })).toBeVisible();
  });
});
