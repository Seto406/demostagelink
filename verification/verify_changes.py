from playwright.sync_api import Page, expect, sync_playwright

def verify_changes(page: Page):
    # Navigate to home page
    page.goto("http://localhost:8080/")

    # Wait for the root element to load
    expect(page.locator("#root")).to_be_visible()

    # Navigate to About page to trigger transition
    page.goto("http://localhost:8080/about")
    # Wait for heading
    expect(page.get_by_role("heading", name="About StageLink")).to_be_visible()

    # Take screenshot of About page
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_changes(page)
        finally:
            browser.close()
