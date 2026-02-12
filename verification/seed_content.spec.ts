
import { test, expect } from '@playwright/test';

test.describe('End-to-End Content Seeding Flow', () => {
  // Mock Data Store
  let shows = [];
  let invitations = [];

  test('Full Lifecycle: Invite -> Create -> Approve', async ({ page }) => {
    // --- STEP 1: ADMIN INVITE ---
    console.log('--- Step 1: Admin Invite ---');

    // Mock Admin Auth
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'connect.stagelink@gmail.com',
          user_metadata: { role: 'admin' }
        })
      });
    });

    // Mock Admin Profile
    await page.route('**/rest/v1/profiles*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'admin-id',
            role: 'admin',
            email: 'connect.stagelink@gmail.com'
          })
        });
      }
    });

    // Mock Invitations
    await page.route('**/functions/v1/invite-user', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Inject Admin Session
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-dssbduklgbmxezpjpuen-auth-token', JSON.stringify({
        access_token: 'fake-jwt',
        refresh_token: 'fake-refresh',
        user: { id: 'admin-id', role: 'authenticated', email: 'connect.stagelink@gmail.com' }
      }));
      window.PlaywrightTest = true;
      window.PlaywrightUser = { id: 'admin-id', role: 'admin', email: 'connect.stagelink@gmail.com' };
    });

    await page.goto('/admin');

    // Navigate to Invitations
    await page.locator('button:has(svg.lucide-mail)').click();
    await expect(page.locator('text=Invitation Hub')).toBeVisible();

    // Invite User
    await page.fill('input[type="email"]', 'jules.test@stagelink.show');
    await page.click('button:has-text("Send Invitation")');

    // Verify Success (Toast or UI update)
    // The UI likely shows a toast or adds to list. Since we mocked the function, it should succeed.
    // We can assume success if no error.

    // --- STEP 2: PRODUCER CREATE CONTENT ---
    console.log('--- Step 2: Producer Create Content ---');

    // Clear previous mocks/state for new user context
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Mock Producer Auth
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'producer-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'jules.test@stagelink.show',
          user_metadata: { role: 'producer' }
        })
      });
    });

    // Mock Producer Profile
    await page.route('**/rest/v1/profiles*', async route => {
       await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'producer-id',
            role: 'producer',
            group_name: 'Jules Theater Co',
            email: 'jules.test@stagelink.show'
          })
       });
    });

    // Mock Shows (GET) - Initially empty
    await page.route('**/rest/v1/shows*', async route => {
        if (route.request().method() === 'POST') {
            const postData = route.request().postDataJSON();
            shows.push({ ...postData, id: 'new-show-id', status: 'pending' });
            await route.fulfill({ status: 201, body: JSON.stringify(null) }); // Insert returns null usually unless select
        } else if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                body: JSON.stringify(shows)
            });
        } else {
            await route.continue();
        }
    });

    // Mock Storage Upload
    await page.route('**/storage/v1/object/show-posters/*', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({ Key: 'path/to/image.jpg' })
        });
    });

    // Inject Producer Session
    await page.addInitScript(() => {
        // Disable Tour Guide globally (and specifically for user)
        window.localStorage.setItem('stagelink_tour_seen_producer-id', 'true');

        window.localStorage.setItem('sb-dssbduklgbmxezpjpuen-auth-token', JSON.stringify({
            access_token: 'fake-jwt-producer',
            refresh_token: 'fake-refresh-producer',
            user: { id: 'producer-id', role: 'authenticated', email: 'jules.test@stagelink.show' }
        }));

        window.PlaywrightTest = true;
        window.PlaywrightUser = { id: 'producer-id', role: 'producer', email: 'jules.test@stagelink.show' };
    });

    await page.goto('/dashboard');

    // Debug: Check LocalStorage
    const lsTour = await page.evaluate(() => localStorage.getItem('stagelink_tour_seen_producer-id'));
    console.log('LocalStorage Tour Flag:', lsTour);

    // Handle Tour Guide if it appears (fail-safe)
    try {
        const skipTourButton = page.locator('button[aria-label="Skip Tour"]');
        if (await skipTourButton.isVisible({ timeout: 2000 })) {
            console.log('Tour Guide detected. Skipping...');
            await skipTourButton.click();
        }
    } catch (e) {
        // Ignore timeout
    }

    // Click Add Show
    // Wait for button to be visible. Use ID if available, or text.
    await page.click('#add-show-button', { force: true });

    // Fill Form
    await page.fill('#showTitle', 'New Test Musical');
    await page.fill('#showDescription', 'A test musical description.');
    await page.fill('#showDate', '2025-12-01');
    await page.fill('#showVenue', 'Test Venue');

    // Select City (Select trigger)
    await page.click('button:has-text("Select city")', { force: true });
    await page.click('div[role="option"]:has-text("Makati")', { force: true });

    // Select Type - Default is Local, so we skip

    // Skip Poster Upload to avoid Cropper complexity

    // Submit
    await page.click('button:has-text("Submit Show")', { force: true });

    // Assert Success Modal
    await expect(page.locator('text=Thank You! Your Submission Is Under Review')).toBeVisible();

    // Close Modal
    await page.click('button:has-text("Got it")');

    // Navigate to "My Productions" tab to see the list
    await page.click('button[aria-label="My Productions"]');

    // Verify it appears in list (mocked GET should return it now)
    await expect(page.locator('text=New Test Musical')).toBeVisible();
    await expect(page.locator('text=UNDER REVIEW')).toBeVisible();


    // --- STEP 3: ADMIN APPROVE ---
    console.log('--- Step 3: Admin Approve ---');

    // Clear Producer session
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Re-Inject Admin Session (Same as Step 1)
    await page.addInitScript(() => {
        window.localStorage.setItem('sb-dssbduklgbmxezpjpuen-auth-token', JSON.stringify({
            access_token: 'fake-jwt',
            refresh_token: 'fake-refresh',
            user: { id: 'admin-id', role: 'authenticated', email: 'connect.stagelink@gmail.com' }
        }));
        window.PlaywrightTest = true;
        window.PlaywrightUser = { id: 'admin-id', role: 'admin', email: 'connect.stagelink@gmail.com' };
    });

    // Mock Shows for Admin (GET)
    // Admin sees pending shows.
    await page.route('**/rest/v1/shows*', async route => {
        const url = route.request().url();
        if (route.request().method() === 'PATCH') {
            // Update status
             await route.fulfill({ status: 200, body: JSON.stringify(null) });
             // Update local mock store
             if (shows.length > 0) shows[0].status = 'approved';
        } else if (route.request().method() === 'GET') {
             // AdminPanel fetches with specific filters.
             // We can just return the current state of 'shows'.
             // The query likely includes `count=exact`.
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(shows) // Return the pending show
            });
        }
    });

    // Also mock RPC 'get_admin_dashboard_stats'
    await page.route('**/rpc/get_admin_dashboard_stats', async route => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                total_users: 10,
                total_shows: 1,
                pending_shows: 1, // matches our state
                active_producers: 5
            })
        });
    });

    await page.goto('/admin');

    // Should be on 'shows' tab by default
    // Check for "New Test Musical"
    await expect(page.locator('text=New Test Musical')).toBeVisible();

    // Click Approve (Green check button)
    await page.click('button[title="Approve"]', { force: true });

    // Confirm in Dialog
    await expect(page.locator('text=Approve Show')).toBeVisible();
    await page.click('button:has-text("Approve")', { force: true });

    // Verify it disappears from Pending (optimistic update)
    await expect(page.locator('text=New Test Musical')).toBeHidden();
    // Wait, if it moves to Approved tab?
    // The default view is "Show Approvals" (pending).
    // So it should disappear from the list.

    console.log('--- Lifecycle Verified ---');
  });
});
