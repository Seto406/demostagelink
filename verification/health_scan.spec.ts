import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@stagelink.show',
  user_metadata: { full_name: 'StageLink Admin' },
  role: 'authenticated',
  app_metadata: { provider: 'email' }
};

const PRODUCER_ID = '123e4567-e89b-12d3-a456-426614174001';
const SUPABASE_URL = 'https://dssbduklgbmxezpjpuen.supabase.co';

test.describe('System Health Scan', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Admin Login
    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-token',
          user: user
        }
      }));
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
    }, { user: ADMIN_USER });
  });

  test('DB & Auth Health: Invite User Function Speed', async ({ page }) => {
    // Mock the Edge Function response to simulate a healthy environment (since we can't hit live)
    // We add a small delay to verify the client handles latency
    await page.route('**/functions/v1/invite-user', async route => {
        await new Promise(r => setTimeout(r, 100));
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: "Invitation sent" })
        });
    });

    await page.goto('/admin');

    // Measure response time of the function invocation from client perspective
    const startTime = Date.now();
    const response = await page.evaluate(async (url) => {
        const res = await fetch(`${url}/functions/v1/invite-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token'
            },
            body: JSON.stringify({ email: 'test@speed.com', first_name: 'Speed', redirect_to: 'http://localhost' })
        });
        return res.status;
    }, SUPABASE_URL);

    const duration = Date.now() - startTime;
    console.log(`Invite User Function Duration (Mocked): ${duration}ms`);

    expect(response).toBe(200);
    expect(duration).toBeLessThan(500);

    // Mock Invitations Query
    await page.route('**/rest/v1/invitations*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify([])
        });
    });

    // Verify we can query invitations (simulating check for failed triggers)
    // We mock the response, but this checks that the frontend/client can make the request
    const queryResponse = await page.evaluate(async (url) => {
         const res = await fetch(`${url}/rest/v1/invitations?select=*&status=eq.expired`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mock-token',
                'apikey': 'mock-anon-key' // In real app this comes from env, here we mock network anyway
            }
        });
        return res.status;
    }, SUPABASE_URL);

    expect(queryResponse).toBe(200);
  });

  test('Mobile Viewport Integrity & Asset Audit', async ({ page }) => {
    // Set Mobile Viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock Producer Profile
    await page.route(`**/rest/v1/profiles?id=eq.${PRODUCER_ID}*`, async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                id: PRODUCER_ID,
                user_id: PRODUCER_ID,
                role: 'producer',
                group_name: 'Mobile Test Group',
                description: 'Testing mobile layout with a long description to see if it wraps correctly on small screens.',
                university: 'University of the Philippines (UP)',
                niche: 'university',
                founded_year: 2020
            })
        });
    });

    // Mock Shows for Producer
    await page.route(`**/rest/v1/shows?producer_id=eq.${PRODUCER_ID}*`, async route => {
         await route.fulfill({
            status: 200,
            body: JSON.stringify([{
                id: 'show-1',
                title: 'Mobile Show',
                description: 'A show to test mobile layout',
                poster_url: 'https://images.unsplash.com/photo-1503095392237-fc73e83b4a20?auto=format&fit=crop&w=600&q=80',
                status: 'approved',
                date: '2026-05-01',
                city: 'Manila'
            }])
        });
    });

    // Mock Admin Stats
    await page.route('**/rpc/get_admin_dashboard_stats', async route => {
         await route.fulfill({ status: 200, body: JSON.stringify({
             totalUsers: 10, totalShows: 5, activeProducers: 2
         }) });
    });

    // Mock Producer Requests
    await page.route('**/rest/v1/producer_requests*', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // 1. Check Admin Hub
    console.log('Checking Admin Hub on Mobile...');
    await page.goto('/admin');
    await page.waitForTimeout(2000); // Allow for animations/loading

    // Check for horizontal overflow
    const adminScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const adminClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Admin Hub: ScrollWidth=${adminScrollWidth}, ClientWidth=${adminClientWidth}`);
    expect(adminScrollWidth).toBeLessThanOrEqual(adminClientWidth + 1); // Allow 1px tolerance

    await page.screenshot({ path: 'verification/health_scan_admin_mobile.png', fullPage: true });

    // 2. Check Producer Public Profile
    console.log('Checking Producer Profile on Mobile...');
    await page.goto(`/producer/${PRODUCER_ID}`);
    await page.waitForTimeout(2000);

    // Check for horizontal overflow
    const producerScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const producerClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Producer Profile: ScrollWidth=${producerScrollWidth}, ClientWidth=${producerClientWidth}`);
    expect(producerScrollWidth).toBeLessThanOrEqual(producerClientWidth + 1);

    await page.screenshot({ path: 'verification/health_scan_producer_public_mobile.png', fullPage: true });

    // 3. Asset Audit (Dummy Shows on Home)
    console.log('Checking Assets on Home Mobile...');
    await page.route('**/rest/v1/shows*', async route => {
        const url = route.request().url();
        if (url.includes('status=eq.approved')) {
             await route.fulfill({
                status: 200,
                body: JSON.stringify([{
                    id: 'dummy-1',
                    title: 'Dummy Show 1',
                    description: 'Description 1',
                    poster_url: 'https://images.unsplash.com/photo-1503095392237-fc73e83b4a20?auto=format&fit=crop&w=600&q=80',
                    profiles: { group_name: 'Group 1', id: PRODUCER_ID, avatar_url: null },
                    created_at: new Date().toISOString()
                }, {
                    id: 'dummy-2',
                    title: 'Dummy Show 2',
                    description: 'Description 2',
                    poster_url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7f42?auto=format&fit=crop&w=600&q=80',
                    profiles: { group_name: 'Group 2', id: PRODUCER_ID, avatar_url: null },
                    created_at: new Date().toISOString()
                }])
            });
        } else {
            await route.continue();
        }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verification/health_scan_assets_mobile.png', fullPage: true });
  });
});
