from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to homepage...")
        page.goto("http://localhost:8080/")

        print("Waiting for title...")
        page.wait_for_selector("title", state="attached")
        print("Page title:", page.title())

        print("Navigating to /dashboard...")
        page.goto("http://localhost:8080/dashboard")

        # Take screenshot before wait
        page.screenshot(path="verification/dashboard_initial.png")

        print("Waiting for redirect or text...")
        # Maybe it doesn't redirect to /login immediately but stays on loading?
        try:
            page.wait_for_url("**/login", timeout=10000)
            print("Redirected to login.")
        except Exception as e:
            print(f"Timeout waiting for redirect: {e}")
            page.screenshot(path="verification/dashboard_timeout.png")

        browser.close()

if __name__ == "__main__":
    run()
