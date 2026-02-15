from playwright.sync_api import sync_playwright
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock health check
    def handle_health(route):
        import datetime
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"status": "ok", "timestamp": datetime.datetime.now().isoformat()})
        )

    page.route("**/rest/v1/rpc/get_service_health", handle_health)

    # Mock city counts RPC
    def handle_city_counts(route):
        data = [
            {"city": "Mandaluyong", "count": 10},
            {"city": "Taguig", "count": 20},
            {"city": "Manila", "count": 30},
            {"city": "Quezon City", "count": 40},
            {"city": "Makati", "count": 50}
        ]
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(data)
        )

    page.route("**/rest/v1/rpc/get_city_show_counts", handle_city_counts)

    # Navigate to the test route
    try:
        page.goto("http://localhost:8080/test-city-browser")

        # Wait for content to appear
        page.wait_for_selector("text=10 shows", timeout=10000)
        page.wait_for_selector("text=20 shows", timeout=10000)

        # Screenshot
        page.screenshot(path="verification/city_browser_verification.png", full_page=True)
        print("Verification successful, screenshot saved.")
    except Exception as e:
        print(f"Verification failed: {e}")
        page.screenshot(path="verification/error.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
