from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to homepage...")
            page.goto("http://localhost:8080/")

            # Wait for something characteristic to load, e.g., the title or a heading
            page.wait_for_selector("h1", timeout=10000)

            print("Page loaded successfully. Taking screenshot...")
            page.screenshot(path="verification/homepage.png")
            print("Screenshot saved to verification/homepage.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
