from playwright.sync_api import sync_playwright, expect
import time

def verify_fix():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock Auth
        page.add_init_script("""
            window.PlaywrightTest = true;
            window.PlaywrightUser = { id: 'test-user', email: 'test@example.com' };
            window.PlaywrightProfile = {
                id: 'test-user',
                username: 'Test User',
                role: 'producer',
                avatar_url: null,
                group_name: 'Test Group',
                group_logo_url: null
            };
        """)

        # Navigate to Feed
        print("Navigating to /feed...")
        page.goto("http://localhost:8080/feed")

        # 1. Check if System Updating loop is gone
        # If it was looping, the page would reload. We can wait a bit and check URL or content.
        print("Waiting for page load...")
        page.wait_for_timeout(5000) # Wait 5 seconds to ensure no reload loop

        # Check if we are still on feed or dashboard (if redirected)
        # But SystemStability reloads the current page. If it was active, it might reload.
        # We can check if "System Updating" text is NOT present (if it had a UI component).
        # But the loop was a reload loop.

        # 2. Check overflow-x: hidden on body
        print("Checking body overflow-x...")
        overflow_x = page.eval_on_selector("body", "el => getComputedStyle(el).overflowX")
        print(f"Body overflow-x: {overflow_x}")
        if overflow_x != "hidden":
            print("FAILED: Body overflow-x is not hidden")
        else:
            print("PASSED: Body overflow-x is hidden")

        # 3. Check Feed Layout
        # We need to find the container that had space-y-6 and now has grid
        # The container is the parent of feed items.
        # We can look for the div with class "grid grid-cols-1 gap-6 w-full"
        # Or checking if such element exists.
        print("Checking feed layout...")
        # Wait for some content if possible. Mocked data might not load if Supabase is not mocked.
        # But the layout structure should be there.

        # Since Supabase is not mocked for data fetching in this script, the feed might be empty or loading.
        # The UserFeed component renders:
        # {loadingShows && shows.length === 0 ? (...) : ( <div className="grid ..."> ... </div> )}

        # If loading, we see BrandedLoader.
        # We can inspect the code by checking if the class exists in the DOM *if* we can get past loading.
        # To get past loading, we need to mock the useInfiniteQuery.
        # But Playwright can't easily mock React Query hooks from outside.
        # However, we can intercept the network request to Supabase and return mock data.

        # Mock Supabase request for shows
        page.route("**/rest/v1/shows*", lambda route: route.fulfill(
            status=200,
            body='[{"id": "1", "title": "Test Show", "status": "approved", "producer_id": {"group_name": "G", "id": "p1"}}]'
        ))

        # Mock Supabase request for profiles (producer)
        page.route("**/rest/v1/profiles*", lambda route: route.fulfill(
            status=200,
            body='[]'
        ))

        # Reload to apply network mocks
        page.reload()
        page.wait_for_timeout(2000)

        # Now we should see the grid
        grid = page.locator(".grid.grid-cols-1.gap-6.w-full")
        if grid.count() > 0:
            print("PASSED: Feed grid layout found")
        else:
            print("FAILED: Feed grid layout NOT found")
            # Take screenshot of what we see
            page.screenshot(path="verification/failed_layout.png")
            print("Screenshot saved to verification/failed_layout.png")

        # Take screenshot of the feed
        page.screenshot(path="verification/feed_layout.png")
        print("Screenshot saved to verification/feed_layout.png")

        browser.close()

if __name__ == "__main__":
    verify_fix()
