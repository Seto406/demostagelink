from playwright.sync_api import Page, expect, sync_playwright

def verify_pagination(page: Page):
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

    try:
        # 1. Go to admin panel
        page.goto("http://localhost:3000/admin")

        # 2. Wait for loading to finish (mocked data takes 500ms)
        # Check for a row
        page.wait_for_selector("table tbody tr")

        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # 3. Check if pagination exists
        # Pagination nav
        pagination = page.get_by_role("navigation", name="pagination")
        expect(pagination).to_be_visible()

        # Check for "Next" button using text
        next_btn = page.get_by_text("Next", exact=True)
        expect(next_btn).to_be_visible()

        # Check for Page 1 being active
        expect(page.get_by_text("1", exact=True)).to_have_attribute("aria-current", "page")

        # 4. Click next page
        next_btn.click()

        # Wait for loading again? Since it's mocked with timeout, yes.
        page.wait_for_timeout(1000)

        # Check if page 2 is active
        expect(page.get_by_text("2", exact=True)).to_have_attribute("aria-current", "page")

        # 5. Screenshot
        page.screenshot(path="/home/jules/verification/pagination.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="/home/jules/verification/debug_error.png")
        raise e

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Increase height to ensure elements are in viewport or rendered
        page = browser.new_page(viewport={"width": 1280, "height": 1000})
        try:
            verify_pagination(page)
        finally:
            browser.close()
