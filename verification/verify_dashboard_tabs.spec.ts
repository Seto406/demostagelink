import { test, expect, Page } from '@playwright/test';

test.describe('Dashboard Tabs', () => {
    const mockProducerUser = {
        id: 'producer-user-id',
        email: 'producer@example.com',
        user_metadata: { full_name: 'Producer User', avatar_url: null },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated'
    };

    const mockProfile = {
        id: 'profile-id',
        user_id: 'producer-user-id',
        role: 'producer',
        group_name: 'Test Group',
        has_completed_tour: true // Important to skip tour
    };

    const setupMocks = async (page: Page) => {
        // Mock Auth Context initialization
        await page.addInitScript((data) => {
            window.localStorage.setItem('sb-project-auth-token', JSON.stringify({
                access_token: 'mock-token',
                user: data.user
            }));
            // @ts-ignore
            window.PlaywrightTest = true;
            // @ts-ignore
            window.PlaywrightUser = data.user;
            // @ts-ignore
            window.PlaywrightProfile = data.profile;
        }, { user: mockProducerUser, profile: mockProfile });

        // Mock Supabase Auth
        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({ json: mockProducerUser });
        });

        await page.route('**/auth/v1/session', async (route) => {
            await route.fulfill({
                json: {
                    access_token: 'mock-token',
                    user: mockProducerUser
                }
            });
        });

        // Mock Profiles
        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({ json: mockProfile });
        });

        // Mock Shows
        await page.route('**/rest/v1/shows*', async (route) => {
            const shows = [
                {
                    id: 'show-1',
                    title: 'Ongoing Show',
                    status: 'approved',
                    production_status: 'ongoing',
                    created_at: new Date().toISOString(),
                    producer_id: 'producer-user-id',
                    deleted_at: null
                },
                {
                    id: 'show-2',
                    title: 'Archived Show',
                    status: 'archived',
                    production_status: 'ongoing',
                    created_at: new Date(Date.now() - 100000).toISOString(),
                    producer_id: 'producer-user-id',
                    deleted_at: new Date().toISOString()
                }
            ];
            await route.fulfill({ json: shows });
        });

        // Mock Service Health to bypass HealthCheckGate
        await page.route('**/rpc/get_service_health', async (route) => {
            await route.fulfill({
                json: { status: 'ok', timestamp: new Date().toISOString() }
            });
        });
    };

    test('should display Ongoing and Archived tabs correctly', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await setupMocks(page);
        await page.goto('/dashboard');
        // Wait for dashboard stats to be visible (confirms load)
        await expect(page.locator('#dashboard-stats')).toBeVisible({ timeout: 10000 });

        // Navigate to "My Productions" tab
        // Sidebar might be collapsed, use aria-label
        const myProductionsBtn = page.getByLabel('My Productions');
        await expect(myProductionsBtn).toBeVisible();
        await myProductionsBtn.click();

        // Verify "Ongoing" and "Archived" buttons exist
        const ongoingBtn = page.getByRole('button', { name: 'Ongoing', exact: true });
        const archivedBtn = page.getByRole('button', { name: 'Archived', exact: true });

        await expect(ongoingBtn).toBeVisible();
        await expect(archivedBtn).toBeVisible();

        // By default, Ongoing should be active (primary color) and Archived inactive
        // We can check classes or just check content.

        // "Ongoing Show" should be visible
        await expect(page.getByText('Ongoing Show')).toBeVisible();
        // "Archived Show" should NOT be visible
        await expect(page.getByText('Archived Show')).not.toBeVisible();

        // Click "Archived"
        await archivedBtn.click();

        // "Archived Show" should be visible
        await expect(page.getByText('Archived Show')).toBeVisible();
        // "Ongoing Show" should NOT be visible
        await expect(page.getByText('Ongoing Show')).not.toBeVisible();

        // Click "Ongoing" again
        await ongoingBtn.click();
        await expect(page.getByText('Ongoing Show')).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'verification/dashboard_tabs.png' });
    });
});
