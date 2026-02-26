import { test, expect } from '@playwright/test';

test('Verify Profile Description and Multiple Website URLs', async ({ page }) => {
  const mockUserId = '00000000-0000-0000-0000-000000000001';
  const mockProfileId = '00000000-0000-0000-0000-000000000002';
  const mockDescription = 'This is a test bio description with multiple links.';
  const mockWebsiteUrls = [
      'https://portfolio-1.com',
      'https://portfolio-2.com',
      'https://portfolio-3.com'
  ];

  // 1. Inject mock user into AuthContext (so we are "logged in")
  await page.addInitScript(({ mockUserId, mockProfileId, mockDescription, mockWebsiteUrls }) => {
    (window as any).PlaywrightTest = true;
    (window as any).PlaywrightUser = {
      id: mockUserId,
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    (window as any).PlaywrightProfile = {
      id: mockProfileId,
      user_id: mockUserId,
      username: 'TestUser',
      role: 'audience',
      description: mockDescription,
      website_urls: mockWebsiteUrls,
      created_at: new Date().toISOString(),
    };
  }, { mockUserId, mockProfileId, mockDescription, mockWebsiteUrls });

  // 2. Intercept Supabase request for the profile data
  await page.route('**/rest/v1/profiles?*', async route => {
    const url = route.request().url();

    if (url.includes(`id=eq.${mockProfileId}`) || url.includes(`id=eq.${mockUserId}`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
            id: mockProfileId,
            user_id: mockUserId,
            username: 'TestUser',
            role: 'audience',
            description: mockDescription,
            website_urls: mockWebsiteUrls,
            created_at: new Date().toISOString(),
            avatar_url: null,
            group_name: null,
            niche: null,
            producer_role: null
        }])
      });
    } else {
      await route.continue();
    }
  });

  // Mock other dependent requests to ensure page loads cleanly
  await page.route('**/rest/v1/tickets?*', async route => route.fulfill({ status: 200, body: '[]' }));
  await page.route('**/rest/v1/follows?*', async route => route.fulfill({
      status: 200,
      body: '[]',
      headers: { 'Content-Range': '0-0/0' }
  }));
  await page.route('**/rest/v1/group_members?*', async route => route.fulfill({ status: 200, body: '[]' }));
  await page.route('**/rest/v1/reviews?*', async route => route.fulfill({ status: 200, body: '[]' }));

  // 3. Go to profile
  console.log('Navigating to /profile...');
  await page.goto('/profile');

  // 4. Assertions
  console.log('Checking for description visibility...');
  await expect(page.getByText(mockDescription)).toBeVisible({ timeout: 10000 });

  console.log('Checking for multiple website links...');
  for (const url of mockWebsiteUrls) {
      const displayUrl = url.replace('https://', '');
      const link = page.getByRole('link', { name: displayUrl });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', url);
  }

  // 5. Screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'verification/verification_multi_links.png', fullPage: true });
});
