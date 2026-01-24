from playwright.sync_api import sync_playwright

def verify_baseline():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8080...")
            page.goto("http://localhost:8080", timeout=60000)
            print("Page loaded.")

            # Wait for some time to ensure animation might be visible or loaded
            page.wait_for_timeout(2000)

            print("Taking screenshot...")
            page.screenshot(path="verification/baseline.png")
            print("Screenshot saved to verification/baseline.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_baseline()
