import { test, expect } from '@playwright/test';

const PRODUCER_USER = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'stagelinkjules@gmail.com',
  user_metadata: { full_name: 'Jules Producer' },
  role: 'authenticated',
  app_metadata: { provider: 'email' }
};

test('Verify University Dropdown UI', async ({ page }) => {
    // Mock Producer Login
    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-token',
          user: user
        }
      }));
      window.localStorage.setItem(`stagelink_tour_seen_${user.id}`, 'true');
      (window as any).PlaywrightTest = true;
      (window as any).PlaywrightUser = user;
    }, { user: PRODUCER_USER });

    // Mock Profile
    await page.route('**/rest/v1/profiles*', async route => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'producer-profile-id',
                user_id: PRODUCER_USER.id,
                role: 'producer',
                group_name: 'Jules Group',
                niche: 'local',
                university: null
            })
        });
    });

    // Mock Shows/Storage/Follows to prevent errors
    await page.route('**/rest/v1/shows*', async route => route.fulfill({ status: 200, body: JSON.stringify([]) }));
    await page.route('**/rest/v1/follows*', async route => route.fulfill({ status: 200, body: JSON.stringify([]) }));
    await page.route('**/storage/**', async route => route.fulfill({ status: 200, body: JSON.stringify({ Key: 'k' }) }));

    await page.goto('/dashboard');
    await page.getByLabel('Profile').click();

    // Select Niche: University
    await page.click('text=Local/Community-based');
    await page.getByRole('option', { name: 'University Theater Group' }).click();

    // Wait for University Dropdown
    await expect(page.getByText('University Affiliation')).toBeVisible();

    // Open University Dropdown
    await page.click('text=Select University');

    // Take Screenshot showing dropdown options
    await page.screenshot({ path: 'verification/university_dropdown.png', fullPage: true });
});
