from playwright.sync_api import sync_playwright, Page, expect
import time

def verify_feed_buttons(page: Page):
    print("Setting up test...")
    # Mock user session
    page.add_init_script("""
        window.PlaywrightTest = true;
        window.PlaywrightUser = {
            id: 'mock-user-id',
            email: 'test@example.com',
            role: 'authenticated',
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString()
        };
        window.PlaywrightProfile = {
            id: 'mock-profile-id',
            user_id: 'mock-user-id',
            username: 'testuser',
            role: 'audience',
            has_completed_onboarding: true,
            group_name: null,
            avatar_url: null
        };
    """)

    # Mock Shows
    def handle_shows(route):
        print("Handling shows request...")
        route.fulfill(
            status=200,
            content_type="application/json",
            body="""[
                {
                    "id": "mock-show-1",
                    "title": "Mock Show Title",
                    "description": "This is a mock show description to verify the button layout.",
                    "date": "2024-03-15",
                    "venue": "Mock Venue",
                    "city": "Mock City",
                    "poster_url": null,
                    "created_at": "2024-02-26T12:00:00Z",
                    "price": 500,
                    "status": "approved",
                    "is_premium": true,
                    "producer_id": {
                        "id": "mock-producer-id",
                        "group_name": "Mock Producer Group",
                        "avatar_url": null,
                        "group_logo_url": null
                    },
                    "show_likes": [{"count": 42}]
                }
            ]"""
        )

    # Mock Posts
    def handle_posts(route):
        print("Handling posts request...")
        route.fulfill(
            status=200,
            content_type="application/json",
            body="[]"
        )

    # Mock Like Count
    def handle_likes(route):
        print("Handling likes request...")
        route.fulfill(
            status=200,
            content_type="application/json",
            headers={"Content-Range": "0-0/42"},
            body='[{"count": 42}]'
        )

    # Intercept requests
    page.route("**/rest/v1/shows*", handle_shows)
    page.route("**/rest/v1/posts*", handle_posts)
    page.route("**/rest/v1/show_likes*", handle_likes)

    # Also intercept other requests that might fail
    page.route("**/rest/v1/profiles*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/rest/v1/producer_requests*", lambda route: route.fulfill(status=200, body="[]"))

    # Intercept auth/session requests to prevent real calls
    page.route("**/auth/v1/session", lambda route: route.fulfill(status=200, body='{"access_token": "mock", "expires_in": 3600, "refresh_token": "mock", "user": {"id": "mock-user-id"}}'))


    # Go to feed
    print("Navigating to feed...")
    page.goto("http://localhost:3000/feed")

    # Wait for the show card to appear
    print("Waiting for show card...")
    try:
        page.wait_for_selector("text=Mock Show Title", timeout=15000)
    except Exception as e:
        print(f"Timeout waiting for selector: {e}")
        # Take screenshot for debugging
        page.screenshot(path="verification/timeout.png")
        raise e

    # Wait a bit for layout to settle
    time.sleep(1)

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/verification.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a consistent viewport size
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        try:
            verify_feed_buttons(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
        finally:
            browser.close()
