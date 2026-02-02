import { Page } from '@playwright/test';

export const mockSupabaseAuth = async (page: Page, role: 'producer' | 'audience' = 'producer') => {
  const userId = 'user123';
  const email = 'user@example.com';
  const projectId = 'dssbduklgbmxezpjpuen';

  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: email,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // A minimal valid JWT structure (header.payload.signature)
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64').replace(/=/g, '');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
    role: 'authenticated'
  })).toString('base64').replace(/=/g, '');
  const signature = "signature";
  const fakeJwt = `${header}.${payload}.${signature}`;

  const session = {
    access_token: fakeJwt,
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'fake-refresh-token',
    user: user,
  };

  // Set localStorage item for Supabase
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: `sb-${projectId}-auth-token`, value: session });

  // Mock all Supabase Auth requests
  await page.route('**/auth/v1/user', async (route) => {
    console.log('Mocking /auth/v1/user');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    console.log('Mocking /auth/v1/token');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });

  // Mock Profile endpoint
  await page.route('**/rest/v1/profiles?*', async (route) => {
    console.log('Mocking /rest/v1/profiles');
    const profile = {
      id: 'profile123',
      user_id: userId,
      role: role,
      group_name: 'Test Group',
      description: 'A test group description',
      founded_year: 2020,
      niche: 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
      map_screenshot_url: null,
      username: 'testuser',
      rank: 'Newbie',
      xp: 0
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([profile]),
    });
  });
};
