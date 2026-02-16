import { test, expect } from '@playwright/test';
import * as path from 'path';

declare global {
  interface Window {
    PlaywrightTest: boolean;
    PlaywrightUser: any;
    PlaywrightProfile: any;
  }
}

test.describe('Profile Divorce Verification', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      avatar_url: 'https://placehold.co/100x100?text=Personal', // Use a real placeholder image
    },
  };

  const mockProfile = {
    id: 'test-profile-id',
    user_id: 'test-user-id',
    role: 'producer',
    username: 'PersonalUser',
    group_name: 'TheaterGroup',
    avatar_url: 'https://placehold.co/100x100?text=Personal',
    group_logo_url: 'https://placehold.co/100x100?text=Group',
    created_at: new Date().toISOString(),
    has_completed_tour: true,
  };

  test.beforeEach(async ({ page }) => {
    // 1. Mock Network Requests

    // Mock Health Check (RPC)
    await page.route('**/rest/v1/rpc/get_service_health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true)
      });
    });

    // Mock Profile Fetch
    await page.route('**/rest/v1/profiles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfile)
      });
    });

    // Mock Tickets (Passes)
    await page.route('**/rest/v1/tickets?*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock Follows
    await page.route('**/rest/v1/follows?*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock Reviews
    await page.route('**/rest/v1/reviews?*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock Shows (for Dashboard)
    await page.route('**/rest/v1/shows?*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock Analytics (get_analytics_summary)
    await page.route('**/rest/v1/rpc/get_analytics_summary', async route => {
         await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({ views: 0, clicks: 0, ctr: 0, chartData: [] })
         });
    });

    // 2. Inject mock auth data before navigation
    await page.addInitScript(({ mockUser, mockProfile }) => {
      window.PlaywrightTest = true;
      window.PlaywrightUser = mockUser;
      window.PlaywrightProfile = mockProfile;
    }, { mockUser, mockProfile });
  });

  test('Profile page displays username instead of group name', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('h1.font-serif').first()).not.toContainText('System Updating');
    const heading = page.locator('h1.font-serif').first();
    await expect(heading).toContainText('PersonalUser');
    await expect(heading).not.toContainText('TheaterGroup');

    await page.screenshot({ path: 'verification/profile_page.png' });
  });

  test('Edit Profile dialog is titled "Personal Settings"', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1.font-serif').first()).not.toContainText('System Updating');

    await page.click('button:has-text("Edit Profile")');

    const dialogTitle = page.locator('div[role="dialog"] h2');
    await expect(dialogTitle).toContainText('Personal Settings');

    await page.screenshot({ path: 'verification/edit_profile_dialog.png' });
  });

  test('Dashboard group logo uses group_logo_url, not avatar_url', async ({ page }) => {
    await page.goto('/dashboard?tab=profile');
    await expect(page.locator('h1').first()).not.toContainText('System Updating');
    await page.waitForSelector('text=Group Information');

    const logoImage = page.locator('img[alt="Group Logo preview"]');
    await expect(logoImage).toBeVisible();
    // Check using contains because placehold.co might redirect or change params slightly?
    // Actually full URL check is fine if consistent.
    await expect(logoImage).toHaveAttribute('src', 'https://placehold.co/100x100?text=Group');
    await expect(logoImage).not.toHaveAttribute('src', 'https://placehold.co/100x100?text=Personal');

    await page.screenshot({ path: 'verification/dashboard_group_logo.png' });
  });
});
