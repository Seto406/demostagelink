import os
from playwright.sync_api import sync_playwright, expect

def test_about_page_content(page):
    # Mock the health check RPC to ensure the app loads
    page.route("**/rest/v1/rpc/get_service_health", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}'
    ))

    # Also mock it without rest/v1 just in case
    page.route("**/rpc/get_service_health", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}'
    ))

    # Go to the About page
    print("Navigating to About page...")
    page.goto("http://localhost:8080/about")

    # Wait for the main content to load
    # "Our Mission" is a section that should exist
    print("Waiting for 'Our Mission'...")
    expect(page.get_by_text("Our Mission")).to_be_visible(timeout=10000)

    # Assert that "What's Available Now" is NOT visible
    print("Verifying 'What's Available Now' is gone...")
    expect(page.get_by_text("What's Available Now")).not_to_be_visible()

    # Also assert "Phase 1" is not visible just to be sure
    expect(page.get_by_text("Phase 1", exact=True)).not_to_be_visible()
    # Note: "Phase 1" might be part of a sentence, so exact=True might not match if it was partial text,
    # but get_by_text by default is fuzzy.
    # The original text was 'StageLink is currently in Phase 1'.
    # get_by_text("Phase 1") would match if it's visible.

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/about_page_verification.png", full_page=True)

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_about_page_content(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            # Take a screenshot on failure too for debugging
            try:
                page.screenshot(path="verification/verification_failed.png")
            except:
                pass
            exit(1)
        finally:
            browser.close()
