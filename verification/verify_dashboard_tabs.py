from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Disable tour
        page.add_init_script("""
            localStorage.setItem('stagelink_tour_seen_test-producer-id', 'true');
        """)

        # Mock authentication
        page.add_init_script("""
            window.PlaywrightTest = true;
            window.PlaywrightUser = {
                id: "test-producer-id",
                email: "producer@example.com",
                role: "producer",
                app_metadata: { provider: "email" },
                user_metadata: { role: "producer" },
                aud: "authenticated",
                created_at: "2023-01-01T00:00:00Z"
            };
        """)

        # Mock RPC calls
        page.route("**/rest/v1/rpc/get_service_health", lambda route: route.fulfill(
            status=200,
            body='{"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}'
        ))

        # Mock other RPCs/Tables to avoid errors
        page.route("**/rest/v1/shows*", lambda route: route.fulfill(status=200, body='[]'))

        # Mock profile fetching
        def handle_profile(route):
            print(f"Handling profile request: {route.request.url}")
            route.fulfill(status=200, body='[{"id": "test-producer-id", "role": "producer", "group_name": "Test Group", "created_at": "2023-01-01T00:00:00Z"}]')

        page.route("**/rest/v1/profiles*", handle_profile)

        print("Navigating to dashboard...")
        page.goto("http://localhost:8080/dashboard")

        # Wait for dashboard to load
        print("Waiting for Dashboard text...")
        try:
            # We look for "Total Productions" which is on the dashboard tab
            page.wait_for_selector("text=Total Productions", timeout=10000)
        except:
            print("Timed out waiting for Dashboard. Taking screenshot...")
            page.screenshot(path="verification/timeout.png")
            raise

        # Take screenshot of Dashboard tab
        page.screenshot(path="verification/dashboard_tab.png")
        print("Screenshot 1 taken.")

        # Click on "My Productions" tab using JS to bypass detachment issues
        print("Clicking My Productions...")
        page.evaluate("document.querySelector('button[aria-label=\"My Productions\"]').click()")

        # Wait a bit for "transition"
        # Verify content changed
        print("Waiting for Your Shows...")
        page.wait_for_selector("text=Your Shows")

        page.screenshot(path="verification/shows_tab.png")
        print("Screenshot 2 taken.")

        browser.close()

if __name__ == "__main__":
    run()
