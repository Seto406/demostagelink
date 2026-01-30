from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        print("Navigating to login page...")
        page.goto("http://localhost:8080/login")

        # Wait for page to load
        page.wait_for_selector('h1:has-text("Welcome Back")')

        print("Checking for accessible password toggle...")
        # Check for password toggle button aria-label
        password_toggle = page.locator('button[aria-label="Toggle password visibility"]')
        expect(password_toggle).to_be_visible()
        print("✅ Password toggle has aria-label")

        print("Checking for Google icon aria-hidden...")
        # Check for Google icon aria-hidden wrapper
        google_btn = page.locator('button:has-text("Google")')
        google_icon_wrapper = google_btn.locator('span[aria-hidden="true"]')
        expect(google_icon_wrapper).to_be_visible()
        print("✅ Google icon is hidden from screen readers")

        print("Checking for required field asterisk...")
        # Check for asterisk in Email label
        # The label for Email should contain the asterisk
        email_label = page.locator('label:has-text("Email")')
        asterisk = email_label.locator('.text-destructive')
        expect(asterisk).to_have_text("*")
        print("✅ Email label has visual required indicator")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/login_a11y.png")
        print("Screenshot saved to verification/login_a11y.png")

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        page.screenshot(path="verification/login_a11y_failed.png")
        raise e
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
