import { test, expect } from '@playwright/test';

// Mock Users
const ADMIN_USER = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'connect.stagelink@gmail.com',
  user_metadata: { full_name: 'StageLink Admin' },
  role: 'authenticated',
  app_metadata: { provider: 'email' }
};

const PRODUCER_USER = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'stagelinkjules@gmail.com',
  user_metadata: { full_name: 'Jules Producer' },
  role: 'authenticated',
  app_metadata: { provider: 'email' }
};

test.describe('Content Seeding & Flow Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/rpc/get_service_health', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
        });
    });

    // Mock Analytics Summary
    await page.route('**/rpc/get_analytics_summary', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                views: 100,
                clicks: 10,
                ctr: 10.0,
                chartData: []
            })
        });
    });

    // Mock Subscription Check
    await page.route('**/functions/v1/check-subscription', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ isPro: false })
        });
    });
  });

  test('1. Admin Invite', async ({ page }) => {
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

    // Mock Profile Fetch for Admin Role
    await page.route('**/rest/v1/profiles*', async route => {
        const method = route.request().method();
        if (method === 'GET') {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: ADMIN_USER.id,
                    user_id: ADMIN_USER.id,
                    role: 'admin',
                    group_name: 'Admin Group'
                })
            });
        } else {
            await route.continue();
        }
    });

    // Mock Invitation API (Edge Function)
    await page.route('**/functions/v1/invite-user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: "Invitation sent successfully" })
        });
    });

    // Mock Fetch Invitations (to verify row appears)
     await page.route('**/rest/v1/invitations*', async route => {
        if (route.request().method() === 'GET') {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'invite-123',
                    email: 'stagelinkjules@gmail.com',
                    first_name: 'Jules',
                    status: 'pending',
                    invited_at: new Date().toISOString()
                }])
            });
        } else {
             await route.continue();
        }
    });

    // Mock Stats
    await page.route('**/rpc/get_admin_dashboard_stats', async route => {
        await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
                 totalUsers: 10,
                 totalShows: 5,
                 activeProducers: 2,
                 pendingRequests: 0,
                 deletedShows: 0,
                 pendingShows: 0,
                 approvedShows: 0,
                 rejectedShows: 0
             })
        });
    });

    // Mock Producer Requests
    await page.route('**/rest/v1/producer_requests*', async route => {
      await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
      });
    });

    // Mock Shows Count for dashboard
    await page.route('**/rest/v1/shows*', async route => {
      await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/0' },
          body: JSON.stringify([])
      });
    });


    await page.goto('/admin');

    // Check Invitation Hub is present
    // Click Invitations tab (3rd button in sidebar)
    await page.locator('aside nav button').nth(2).click();
    await expect(page.getByText('The Invitation Hub')).toBeVisible();

    // Fill Invite Form
    await page.getByPlaceholder('First Name').fill('Jules');
    await page.getByPlaceholder('email@example.com').fill('stagelinkjules@gmail.com');
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    // Verify Toast
    await expect(page.getByText('Invitation Sent').first()).toBeVisible();
    await expect(page.getByText('Successfully invited Jules').first()).toBeVisible();

    // Verify Row in Table
    await expect(page.getByRole('cell', { name: 'stagelinkjules@gmail.com' })).toBeVisible();
  });

  test('2. Producer Content Seeding', async ({ page }) => {
    page.on('console', msg => console.log('Producer Console:', msg.text()));
    // Mock Producer Login
    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-token',
          user: user
        }
      }));
      // Disable Tour
      window.localStorage.setItem(`stagelink_tour_seen_${user.id}`, 'true');

      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
    }, { user: PRODUCER_USER });

    // Mock Profile Fetch for Producer Role (initially local niche)
    let profileData = {
        id: 'producer-profile-id',
        user_id: PRODUCER_USER.id,
        role: 'producer',
        group_name: 'Jules Group',
        niche: 'local',
        university: null
    };

    await page.route('**/rest/v1/profiles*', async route => {
         const method = route.request().method();
         if (method === 'GET') {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(profileData)
            });
         } else if (method === 'PATCH') {
             const postData = route.request().postDataJSON();
             profileData = { ...profileData, ...postData }; // Update local mock state
             await route.fulfill({ status: 200, body: JSON.stringify(profileData) });
         } else {
             await route.continue();
         }
    });

     // Mock Shows (Start empty, allow insert)
    let shows: any[] = [];
    await page.route('**/rest/v1/shows*', async route => {
        const method = route.request().method();
        console.log('Producer Shows Request:', method, route.request().url());
        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(shows)
            });
        } else if (method === 'POST') {
             const postData = route.request().postDataJSON();
             const newShow = { ...postData, id: `show-${Date.now()}` };
             shows.unshift(newShow); // Add to beginning
             await route.fulfill({ status: 201, body: JSON.stringify(newShow) });
        } else {
            await route.continue();
        }
    });

    // Mock Storage Upload (for posters)
    await page.route('**/storage/v1/object/**', async route => {
        console.log('Storage Request:', route.request().method(), route.request().url());
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ Key: 'mock-key', publicUrl: 'https://via.placeholder.com/300x450' })
        });
    });

    // Mock Follows count
    await page.route('**/rest/v1/follows*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': '0-0/0' },
            body: JSON.stringify([])
        });
    });


    await page.goto('/dashboard');
    await page.getByLabel('Profile').click();

    // Verify University Dropdown Logic
    // Initially Local/Community-based
    await page.click('text=Local/Community-based');
    await page.getByRole('option', { name: 'University Theater Group' }).click();

    // Now "University Affiliation" dropdown should appear.
    await expect(page.getByText('University Affiliation')).toBeVisible();

    // Select UP
    await page.click('text=Select University');
    await page.getByRole('option', { name: 'University of the Philippines (UP)' }).click();

    // Save Profile
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Profile updated successfully').first()).toBeVisible();

    // Go to Shows tab
    await page.getByLabel('My Productions').click();

    // Create 3 Shows
    const createShow = async (title: string) => {
        await page.getByRole('button', { name: 'Add Show' }).first().click(); // Or Add New Show
        await page.fill('#showTitle', title);
        await page.fill('#showDate', '2026-05-01');

        // Select Venue
        await page.click('button:has-text("Select venue")', { force: true });
        await page.click('div[role="option"]:has-text("Samsung Performing Arts Theater")', { force: true });

        // Select City (default is empty, required)
        await page.click('text=Select city');
        await page.getByRole('option', { name: 'Manila' }).click();

        await page.setInputFiles('input[type="file"]', {
            name: 'poster.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64')
        });

        await page.getByRole('button', { name: 'Save Crop' }).click();
        await expect(page.getByText('Adjust Image')).toBeHidden();

        await page.getByRole('button', { name: 'Submit Show' }).click();
        // Wait for modal to close or success modal to appear
        await expect(page.getByText('Thank You! Your Submission Is Under Review')).toBeVisible();
        await page.getByRole('button', { name: 'Got it' }).click();
    };

    await createShow('Ang Huling El Bimbo');
    await createShow('Mula Sa Buwan');
    await createShow('Rak of Aegis');

    // Verify 3 shows in list
    await page.getByText('My Productions').click();
    await expect(page.getByText('Ang Huling El Bimbo')).toBeVisible();
    await expect(page.getByText('Mula Sa Buwan')).toBeVisible();
    await expect(page.getByText('Rak of Aegis')).toBeVisible();
  });

  test('3. Admin Approval', async ({ page }) => {
    page.on('console', msg => console.log('Admin Console:', msg.text()));
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

    // Mock Pending Shows (The 3 shows created)
    let pendingShows = [
        { id: '1', title: 'Ang Huling El Bimbo', status: 'pending', producer_id: PRODUCER_USER.id, created_at: new Date().toISOString(), profiles: { group_name: 'Jules Group' }, poster_url: 'https://via.placeholder.com/300' },
        { id: '2', title: 'Mula Sa Buwan', status: 'pending', producer_id: PRODUCER_USER.id, created_at: new Date().toISOString(), profiles: { group_name: 'Jules Group' }, poster_url: 'https://via.placeholder.com/300' },
        { id: '3', title: 'Rak of Aegis', status: 'pending', producer_id: PRODUCER_USER.id, created_at: new Date().toISOString(), profiles: { group_name: 'Jules Group' }, poster_url: 'https://via.placeholder.com/300' }
    ];

    await page.route('**/rest/v1/shows*', async route => {
         const method = route.request().method();
         if (method === 'GET') {
             // Filter deleted
             const url = route.request().url();
             console.log('Admin Panel Show Request:', url);
             if (url.includes('deleted_at=is.null')) {
                // Return shows
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'content-range': pendingShows.length > 0 ? `0-${pendingShows.length - 1}/${pendingShows.length}` : '*/0' },
                    body: JSON.stringify(pendingShows)
                });
             } else {
                 await route.continue();
             }
         } else if (method === 'PATCH') {
             // Update status
             const url = route.request().url();
             const id = url.split('id=eq.')[1];
             if (id) {
                 pendingShows = pendingShows.filter(s => s.id !== id);
             }
             await route.fulfill({ status: 200 });
         } else {
             await route.continue();
         }
    });

    // Mock Notification
    await page.route('**/functions/v1/send-show-notification', async route => {
        await route.fulfill({ status: 200 });
    });

    // Mock Stats
    await page.route('**/rpc/get_admin_dashboard_stats', async route => {
        await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
                 totalUsers: 10,
                 totalShows: 3,
                 activeProducers: 2,
                 pendingRequests: 0,
                 deletedShows: 0,
                 pendingShows: pendingShows.length,
                 approvedShows: 0,
                 rejectedShows: 0
             })
        });
    });

    // Mock Users Fetch (Consolidated)
    await page.route('**/rest/v1/profiles?*', async route => {
        const url = route.request().url();
        console.log('Admin Profile Request:', url);

        // Handle Auth/Profile Check
        if (url.includes('user_id=eq.' + ADMIN_USER.id)) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: ADMIN_USER.id,
                    user_id: ADMIN_USER.id,
                    role: 'admin',
                    group_name: 'Admin Group'
                })
            });
            return;
        }

        // Handle List Fetch
        if (route.request().method() === 'GET' && !url.includes('single')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'content-range': '0-0/0' },
                body: JSON.stringify([])
            });
            return;
        }

        await route.continue();
    });

    // Mock Producer Requests
    await page.route('**/rest/v1/producer_requests*', async route => {
      await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
      });
    });


    await page.goto('/admin');

    // Wait for shows to load
    await page.waitForResponse(resp => resp.url().includes('/shows') && resp.status() === 200);

    // Check Pending Shows
    await expect(page.getByText('Ang Huling El Bimbo')).toBeVisible();
    await expect(page.getByText('Mula Sa Buwan')).toBeVisible();
    await expect(page.getByText('Rak of Aegis')).toBeVisible();

    // Approve All
    // Approve first
    await page.getByTitle('Approve').first().click();
    await page.getByRole('button', { name: 'Approve' }).click(); // Confirm dialog
    await expect(page.getByText('Production Approved').first()).toBeVisible();

    // 2 left
    await page.getByTitle('Approve').first().click();
    await page.getByRole('button', { name: 'Approve' }).click();

    // 1 left
    await page.getByTitle('Approve').first().click();
    await page.getByRole('button', { name: 'Approve' }).click();

    // Verify list is empty
    await expect(page.getByText('All caught up!')).toBeVisible();
  });
});
