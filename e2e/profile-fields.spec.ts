import { test, expect } from '@playwright/test';

test('Verify Profile Description and Website URL', async ({ page }) => {
  const mockUserId = '00000000-0000-0000-0000-000000000001';
  const mockProfileId = '00000000-0000-0000-0000-000000000002';
  const mockDescription = 'This is a test bio description.';
  const mockWebsiteUrl = 'https://my-portfolio.com';

  // 1. Inject mock user into AuthContext (so we are "logged in")
  await page.addInitScript(({ mockUserId, mockProfileId, mockDescription, mockWebsiteUrl }) => {
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
      website_url: mockWebsiteUrl,
      created_at: new Date().toISOString(),
    };
  }, { mockUserId, mockProfileId, mockDescription, mockWebsiteUrl });

  // 2. Intercept Supabase request for the profile data
  // Profile.tsx fetches with .eq("id", profileId).maybeSingle()
  // This typically makes a request to /rest/v1/profiles?id=eq.UUID&select=*
  await page.route('**/rest/v1/profiles?*', async route => {
    const url = route.request().url();
    console.log('Intercepted profile request:', url);

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
            website_url: mockWebsiteUrl,
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
  // Since we injected the user, /profile (without ID) should load the "current user's" profile
  // which uses the mock ID we provided.
  console.log('Navigating to /profile...');
  await page.goto('/profile');

  // 4. Assertions
  console.log('Checking for description visibility...');
  await expect(page.getByText(mockDescription)).toBeVisible({ timeout: 10000 });

  console.log('Checking for website link visibility...');
  // The text displayed should be without protocol: "my-portfolio.com"
  const expectedLinkText = 'my-portfolio.com';
  // Use a more specific locator if possible, or verify text content
  await expect(page.getByRole('link', { name: expectedLinkText })).toBeVisible();

  const link = page.getByRole('link', { name: expectedLinkText });
  await expect(link).toHaveAttribute('href', mockWebsiteUrl);

  // 5. Screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'verification/verification.png', fullPage: true });
});
