import { test, expect } from '@playwright/test';

test.describe('Settings Page - Become a Producer Visibility', () => {

  test('Admin should NOT see "Become a Producer"', async ({ page }) => {
    const adminUser = {
      id: 'admin-user',
      email: 'admin@example.com',
      user_metadata: { full_name: 'Admin User' }
    };

    const adminProfile = {
      id: 'profile-admin',
      user_id: 'admin-user',
      role: 'admin',
      username: 'admin',
      created_at: new Date().toISOString()
    };

    // Mock network requests for profile
    await page.route('**/rest/v1/profiles*', async route => {
      const url = route.request().url();
      if (url.includes('user_id=eq.admin-user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([adminProfile])
        });
      } else {
        await route.continue();
      }
    });

    // Mock producer requests check
    await page.route('**/rest/v1/producer_requests*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Inject Playwright backdoor
    await page.addInitScript((user) => {
      window.PlaywrightTest = true;
      window.PlaywrightUser = user;
    }, adminUser);

    await page.goto('http://localhost:8080/settings');

    // Wait for profile to load (username field should be populated)
    await expect(page.getByLabel('Username / Display Name')).toHaveValue('admin');

    // Check "Become a Producer" section
    await expect(page.getByText('Become a Producer')).not.toBeVisible();
    await expect(page.getByText('Request Producer Access')).not.toBeVisible();
  });

  test('Audience should see "Become a Producer"', async ({ page }) => {
    const audienceUser = {
      id: 'audience-user',
      email: 'audience@example.com',
      user_metadata: { full_name: 'Audience User' }
    };

    const audienceProfile = {
      id: 'profile-audience',
      user_id: 'audience-user',
      role: 'audience',
      username: 'audience',
      created_at: new Date().toISOString()
    };

    // Mock network requests for profile
    await page.route('**/rest/v1/profiles*', async route => {
      const url = route.request().url();
      if (url.includes('user_id=eq.audience-user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([audienceProfile])
        });
      } else {
        await route.continue();
      }
    });

    // Mock producer requests check
    await page.route('**/rest/v1/producer_requests*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Inject Playwright backdoor
    await page.addInitScript((user) => {
      window.PlaywrightTest = true;
      window.PlaywrightUser = user;
    }, audienceUser);

    await page.goto('http://localhost:8080/settings');

    // Wait for profile to load
    await expect(page.getByLabel('Username / Display Name')).toHaveValue('audience');

    // Check "Become a Producer" section
    await expect(page.getByText('Become a Producer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request Producer Access' })).toBeVisible();

    // Screenshot for verification
    await page.screenshot({ path: 'verification/audience_settings.png' });
  });

  test('Producer should NOT see "Become a Producer"', async ({ page }) => {
    const producerUser = {
      id: 'producer-user',
      email: 'producer@example.com',
      user_metadata: { full_name: 'Producer User' }
    };

    const producerProfile = {
      id: 'profile-producer',
      user_id: 'producer-user',
      role: 'producer',
      username: 'producer',
      created_at: new Date().toISOString()
    };

    // Mock network requests for profile
    await page.route('**/rest/v1/profiles*', async route => {
      const url = route.request().url();
      if (url.includes('user_id=eq.producer-user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([producerProfile])
        });
      } else {
        await route.continue();
      }
    });

    // Mock producer requests check
    await page.route('**/rest/v1/producer_requests*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    // Inject Playwright backdoor
    await page.addInitScript((user) => {
      window.PlaywrightTest = true;
      window.PlaywrightUser = user;
    }, producerUser);

    await page.goto('http://localhost:8080/settings');

    // Wait for profile to load
    await expect(page.getByLabel('Username / Display Name')).toHaveValue('producer');

    // Check "Become a Producer" section
    await expect(page.getByText('Become a Producer')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Request Producer Access' })).not.toBeVisible();
  });

});
