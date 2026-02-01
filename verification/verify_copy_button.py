from playwright.sync_api import Page, expect, sync_playwright
import json

def test_copy_button(page: Page):
    # Mock Supabase response
    show_data = {
        "id": "123",
        "title": "Test Show",
        "description": "A test description",
        "date": "2025-12-25",
        "venue": "Test Venue",
        "city": "Manila",
        "status": "approved",
        "poster_url": None,
        "profiles": {
            "id": "producer1",
            "group_name": "Test Group",
            "founded_year": 2020,
            "niche": "local"
        }
    }

    # Intercept the request
    def handle_route(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(show_data)
        )

    page.route("**/rest/v1/shows?*", handle_route)

    # Go to the page
    page.goto("http://localhost:8080/show/123")

    # Wait for the button to appear. There are two.
    # Top one has "Share" text. Bottom one has "Copy Link".

    # Test the bottom "Copy Link" button first as it's clearer
    copy_link_btn = page.get_by_role("button", name="Copy Link")
    expect(copy_link_btn).to_be_visible()

    # Click it
    copy_link_btn.click()

    # Assert it changes to "Copied!"
    expect(page.get_by_text("Copied!")).to_be_visible()

    # Also check the Check icon is present (optional, but good visual check)
    # The button text itself changes, so getting by role button with name "Copied!" might work
    copied_btn = page.get_by_role("button", name="Copied!")
    expect(copied_btn).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/copy_button_verified.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant clipboard permissions
        context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        page = context.new_page()
        try:
            test_copy_button(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
