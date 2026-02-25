import time
import json
from playwright.sync_api import sync_playwright

def verify_hype_message():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock the Supabase response for shows
        def handle_shows_route(route):
            print(f"Intercepted request: {route.request.url}")

            mock_shows = [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "title": "Hyped Show",
                    "description": "This show has a hype message.",
                    "date": "2027-01-01",
                    "venue": "Test Venue",
                    "city": "Test City",
                    "niche": "local",
                    "status": "approved",
                    "poster_url": None,
                    "production_status": "upcoming",
                    "is_premium": True,
                    "seo_metadata": {
                        "hype_message": "Selling Fast! 🔥"
                    },
                    "producer_id": {
                        "id": "00000000-0000-0000-0000-000000000000",
                        "group_name": "Hyped Group",
                        "avatar_url": None
                    }
                },
                {
                    "id": "22222222-2222-2222-2222-222222222222",
                    "title": "Regular Show",
                    "description": "This show has NO hype message.",
                    "date": "2027-02-01",
                    "venue": "Test Venue 2",
                    "city": "Test City",
                    "niche": "university",
                    "status": "approved",
                    "poster_url": None,
                    "production_status": "upcoming",
                    "is_premium": False,
                    "seo_metadata": {
                         "hype_message": ""
                    },
                    "producer_id": {
                        "id": "00000000-0000-0000-0000-000000000000",
                        "group_name": "Regular Group",
                        "avatar_url": None
                    }
                }
            ]

            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(mock_shows)
            )

        # Intercept the request.
        # Match any request that contains /rest/v1/shows
        page.route("**/rest/v1/shows?*", handle_shows_route)

        print("Navigating to /shows...")
        try:
            # Note: Assuming default Vite port 5173
            page.goto("http://localhost:8080/shows", timeout=60000)

            # Wait for the shows to load
            print("Waiting for show cards...")
            try:
                page.wait_for_selector("text=Hyped Show", timeout=10000)
            except:
                print("Timeout waiting for 'Hyped Show'. Taking screenshot of what we have.")
                page.screenshot(path="verification/timeout_debug.png")
                # Continue to see if we can find anything else or just fail gracefully

            # Wait a bit for animations
            time.sleep(2)

            # Check if the hype message is visible
            print("Checking for hype message...")
            hype_badge = page.get_by_text("Selling Fast! 🔥")
            if hype_badge.is_visible():
                print("SUCCESS: Hype message is visible.")
            else:
                print("FAILURE: Hype message is NOT visible.")

            # Check that the other show does NOT have a hype message (or the old static one)
            old_badge = page.get_by_text("12 People Reserved Recently")
            if old_badge.count() > 0:
                 print("FAILURE: Old static badge is still visible!")
            else:
                 print("SUCCESS: Old static badge is gone.")

            # Take screenshot
            screenshot_path = "verification/hype_message_verification.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_hype_message()
