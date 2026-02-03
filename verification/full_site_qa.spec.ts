import { test, expect } from '@playwright/test';

// Define public pages and expected content
const publicPages = [
  { path: '/', title: 'StageLink', heading: 'StageLink' },
  { path: '/about', title: 'About', heading: 'About StageLink' },
  { path: '/privacy', title: 'Privacy', heading: 'Privacy Policy' },
  { path: '/terms', title: 'Terms', heading: 'Terms of Service' },
  { path: '/shows', title: 'Shows', heading: 'Shows' },
  { path: '/directory', title: 'Directory', heading: 'Directory' },
];

test.describe('Full Site QA - Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`Browser Console Error: ${msg.text()}`);
    });

    // Log failed requests
    page.on('requestfailed', request => {
      // Filter out some expected failures or noise if needed
      if (request.url().includes('supabase')) return; // Ignore supabase failures as we mock partially
      console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.route('**/auth/v1/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null })
      });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: null })
        });
      });
  });

  // Helper to wait for any loader
  const waitForLoaders = async (page) => {
      const textLoaders = [
          page.locator('text=Loading StageLink...'),
          page.locator('text=Loading...'),
          page.locator('text=Loading dashboard...')
      ];

      for (const loader of textLoaders) {
          // Use first() to avoid strict mode violation if multiple match text
          if (await loader.count() > 0 && await loader.first().isVisible()) {
              await loader.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
          }
      }

      const imgLoaders = page.getByAltText('Loading...');
      const count = await imgLoaders.count();
      for (let i = 0; i < count; i++) {
          const loader = imgLoaders.nth(i);
          if (await loader.isVisible()) {
              await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
          }
      }
  };

  // Test Case 1: Public Pages Smoke Test
  for (const pageInfo of publicPages) {
    test(`Public Page: ${pageInfo.path} loads correctly`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await waitForLoaders(page);

      await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

      if (pageInfo.path === '/privacy') {
        await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
      } else if (pageInfo.path === '/terms') {
        await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
      } else if (pageInfo.path === '/about') {
         await expect(page.getByText('About StageLink')).toBeVisible();
      }
    });
  }

  // Test Case 2: 404 Handling
  test('404 Page handles non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await expect(page.getByText('Page not found', { exact: false })).toBeVisible();
  });

  // Test Case 3: Protected Routes Redirection
  const protectedRedirectRoutes = [
    '/dashboard',
    '/feed',
    '/settings',
    '/favorites',
  ];

  for (const route of protectedRedirectRoutes) {
    test(`Protected Route: ${route} redirects to login`, async ({ page }) => {
      await page.goto(route);

      await waitForLoaders(page);

      // Wait for URL change
      await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });

      await waitForLoaders(page);

      // Verify Login page content
      await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    });
  }

  // Test Case 3b: Protected Routes with Custom Unauth Content
  test('Notifications Page shows login prompt', async ({ page }) => {
      await page.goto('/notifications');
      await waitForLoaders(page);
      await expect(page.getByText('Please log in to view notifications')).toBeVisible();
  });

  test('Profile Page shows not found for unauthenticated access to /profile', async ({ page }) => {
      await page.goto('/profile');
      await waitForLoaders(page);
      await expect(page.getByText('Profile not found')).toBeVisible();
  });

  // Test Case 4: Login Page Verification
  test('Login Page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await waitForLoaders(page);

    try {
        await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log('Login page content not found. Dumping body text:');
        const bodyText = await page.locator('body').innerText();
        console.log(bodyText.substring(0, 500));
        throw e;
    }

    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    await expect(page.getByText("Sign up", { exact: true })).toBeVisible();
  });

  // Test Case 5: Mobile Navigation
  test('Mobile Navigation is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForLoaders(page);
    await page.waitForTimeout(1000);

    const bottomNav = page.locator('nav').filter({ hasText: 'Home' }).last();
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByText('Home')).toBeVisible();
  });
});
