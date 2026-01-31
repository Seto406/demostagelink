from playwright.sync_api import sync_playwright

def verify_theme(page):
    # Enable light mode manually by adding the class if needed, or toggling
    # Assuming default is dark. Let's force light mode first.
    page.goto("http://localhost:8080/")

    # Take screenshot of Showcase section in default (likely Dark)
    page.locator("#showcase").scroll_into_view_if_needed()
    page.screenshot(path="verification/showcase_default.png")

    # Toggle to Light Mode
    # Assuming there's a theme toggle button. If not, we force the class.
    # Checking for theme toggle in Navbar...
    # If not found, we use JS to force it.
    page.evaluate("document.documentElement.classList.add('light')")
    page.evaluate("document.documentElement.classList.remove('dark')")

    # Wait for transition
    page.wait_for_timeout(1000)

    # Take screenshot in Light Mode
    page.screenshot(path="verification/showcase_light.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_theme(page)
    browser.close()
