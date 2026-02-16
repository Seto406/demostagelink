from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "http://localhost:8082/reset-password?type=recovery"
        print(f"Navigating to {url}")
        page.goto(url)

        # Inject mock user (using evaluate to set window props, but add_init_script for persistence across reload)
        # However, for SPA, we can set localStorage before reload?

        # We need to set AuthContext state. AuthContext reads from localStorage or session?
        # My AuthContext implementation checks window.PlaywrightTest.

        page.add_init_script("""
            window.PlaywrightTest = true;
            window.PlaywrightUser = {
              id: 'test-user-id',
              email: 'test@example.com',
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            };
        """)

        # Reload to ensure AuthContext picks it up
        page.reload()

        print("Waiting for 'Set New Password' text...")
        try:
            page.wait_for_selector("text=Set New Password", timeout=10000)
            print("Found 'Set New Password'")
        except Exception as e:
            print(f"Error waiting for selector: {e}")
            page.screenshot(path="verification/error_screenshot.png")
            return

        page.screenshot(path="verification/reset_password_ui.png")
        print("Screenshot saved to verification/reset_password_ui.png")

        browser.close()

if __name__ == "__main__":
    run()
