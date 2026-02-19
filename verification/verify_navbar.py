import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:8080/")
        try:
            page.goto("http://localhost:8080/", timeout=10000)
        except Exception as e:
            print(f"Failed to navigate: {e}")
            browser.close()
            return

        # Wait for the header to be visible
        try:
            page.wait_for_selector("header", timeout=5000)
            print("Header found.")
        except Exception as e:
            print(f"Header not found: {e}")

        # Take screenshot of the header area
        page.screenshot(path="verification/landing_page.png")
        print("Screenshot saved to verification/landing_page.png")

        # Verify no "Login" button in the header action area
        header = page.locator("header")

        # Check if Login button exists
        login_btn = header.get_by_role("button", name="Login")

        if login_btn.count() > 0 and login_btn.is_visible():
            print("FAILURE: Login button is visible in header!")
        else:
            print("SUCCESS: Login button is not visible in header.")

        # Check if "Explore Shows" button exists (it should be there)
        explore_btn = header.get_by_role("button", name="Explore Shows")
        if explore_btn.count() > 0:
            print("INFO: Explore Shows button is present.")
        else:
            print("INFO: Explore Shows button is NOT present.")

        browser.close()

if __name__ == "__main__":
    run()
