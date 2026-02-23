from playwright.sync_api import sync_playwright
import time
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()

    # Inject user and profile data via init script
    context.add_init_script("""
        window.PlaywrightTest = true;
        window.PlaywrightUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { avatar_url: 'https://github.com/shadcn.png' }
        };
        window.PlaywrightProfile = {
            id: 'test-profile-id',
            user_id: 'test-user-id',
            username: 'Test User',
            avatar_url: 'https://github.com/shadcn.png',
            role: 'audience',
            created_at: new Date().toISOString()
        };
    """)

    page = context.new_page()

    # Intercept profiles request
    def handle_profiles(route):
        print(f"Intercepted profile request: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{
                "id": "test-profile-id",
                "user_id": "test-user-id",
                "username": "Test User",
                "avatar_url": "https://github.com/shadcn.png",
                "role": "audience",
                "created_at": "2023-01-01T00:00:00Z",
                # "xp": 1000, "rank": "Veteran" # Mocking response WITHOUT XP to match DB schema (though UI shouldn't care if extra fields exist, but let's be safe)
            }])
        )

    # Intercept follows request (count)
    def handle_follows(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            headers={"content-range": "0-0/0"}, # For count
            body=json.dumps([])
        )

    # Intercept tickets request
    def handle_tickets(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([])
        )

    # Intercept reviews request
    def handle_reviews(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([])
        )

    page.route("**/rest/v1/profiles*", handle_profiles)
    page.route("**/rest/v1/follows*", handle_follows)
    page.route("**/rest/v1/tickets*", handle_tickets)
    page.route("**/rest/v1/reviews*", handle_reviews)

    # Capture console messages
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    # page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    try:
        print("Navigating to profile page...")
        page.goto("http://localhost:8080/profile")

        # Wait for profile content to load
        print("Waiting for profile content...")
        try:
            page.wait_for_selector("text=Test User", timeout=10000)
            print("Profile loaded successfully.")
        except Exception as e:
            print(f"Failed to load profile: {e}")
            page.screenshot(path="verification/error_profile_load.png")
            browser.close()
            return

        # Check for XP / Level text
        content = page.content()

        has_xp = "XP" in content
        has_level = "Level" in content

        if has_xp:
            print("WARNING: 'XP' text found on page.")
        else:
            print("SUCCESS: 'XP' text NOT found.")

        if has_level:
             print("WARNING: 'Level' text found on page.")
        else:
             print("SUCCESS: 'Level' text NOT found.")

        # Take screenshot
        page.screenshot(path="verification/profile_no_xp.png", full_page=True)
        print("Screenshot saved to verification/profile_no_xp.png")

    except Exception as e:
        print(f"Error during verification: {e}")
        page.screenshot(path="verification/error_script.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
