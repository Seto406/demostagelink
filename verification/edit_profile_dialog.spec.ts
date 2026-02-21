import { test, expect } from '@playwright/test';

test('Edit Profile Dialog handles unsaved changes correctly', async ({ page }) => {
  // Mock Supabase Profile Request
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'test-profile-id',
        user_id: 'test-user-id',
        role: 'audience',
        username: 'TestUser',
        group_name: null,
        description: null,
        founded_year: null,
        niche: null,
        map_screenshot_url: null,
        created_at: new Date().toISOString(),
        rank: null,
        xp: 0,
        avatar_url: null,
        facebook_url: null,
        instagram_url: null,
        address: null,
        university: null,
        producer_role: null
      }])
    });
  });

  // Mock other requests to return empty arrays
  await page.route('**/rest/v1/tickets*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/follows*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/reviews*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });


  // 1. Mock Authentication
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightTest = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PlaywrightProfile = {
        id: 'test-profile-id',
        user_id: 'test-user-id',
        role: 'audience',
        username: 'TestUser',
        group_name: null,
        description: null,
        founded_year: null,
        niche: null,
        map_screenshot_url: null,
        created_at: new Date().toISOString(),
        rank: null,
        xp: 0,
        avatar_url: null,
        facebook_url: null,
        instagram_url: null,
        address: null,
        university: null,
        producer_role: null
    };
  });

  // 2. Navigate to Profile
  await page.goto('/profile');

  // 3. Open Edit Profile Dialog
  const editButton = page.getByRole('button', { name: /Edit Profile/i });
  await expect(editButton).toBeVisible();
  await editButton.click();

  // 4. Verify Dialog is open
  const dialog = page.getByRole('dialog', { name: 'Personal Settings' });
  await expect(dialog).toBeVisible();

  // 5. Change a field (Username)
  const usernameInput = page.getByLabel('Username / Display Name');
  await expect(usernameInput).toBeVisible();

  // Get initial value
  const initialValue = await usernameInput.inputValue();
  const newValue = initialValue + '_edited';

  await usernameInput.fill(newValue);

  // 6. Try to close via "Cancel" button
  const cancelButton = page.getByRole('button', { name: 'Cancel' });
  await cancelButton.click();

  // 7. Verify Alert Dialog appears
  const alertDialog = page.getByRole('alertdialog');
  await expect(alertDialog).toBeVisible();
  await expect(page.getByText('Discard unsaved changes?')).toBeVisible();

  // Wait a bit for animation
  await page.waitForTimeout(1000);
  // Take screenshot of the alert
  await page.screenshot({ path: 'verification/alert_screenshot.png' });

  // 8. Click "Keep Editing"
  const keepEditingButton = page.getByRole('button', { name: 'Keep Editing' });
  await keepEditingButton.click();

  // 9. Verify Alert is gone and Dialog is still there
  await expect(alertDialog).not.toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(usernameInput).toHaveValue(newValue);

  // 10. Try to close via Escape key
  await page.keyboard.press('Escape');

  // 11. Verify Alert Dialog appears again
  await expect(alertDialog).toBeVisible();

  // 12. Click "Discard Changes"
  const discardButton = page.getByRole('button', { name: 'Discard Changes' });
  await discardButton.click();

  // 13. Verify everything is closed
  await expect(alertDialog).not.toBeVisible();
  await expect(dialog).not.toBeVisible();

  // 14. Re-open and verify value is reset
  await editButton.click();
  await expect(dialog).toBeVisible();
  await expect(usernameInput).toHaveValue(initialValue);
});
