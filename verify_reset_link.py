from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_reset_link(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:8080/")

    print("Waiting for loader...")
    # Expect the loader text we put in App.tsx
    expect(page.get_by_text("Testing Reset Link... Please wait 10s")).to_be_visible()

    print("Waiting 11 seconds for the reset link to appear...")
    # The timeout in BrandedLoader is 10s.
    # We can use page.wait_for_timeout or Python's time.sleep
    # Better to wait for the element to appear with a timeout > 10s

    reset_button = page.get_by_text("Taking too long? Click here to reset cache")

    # We expect it to appear after ~10s. Default expect timeout is 5s, so we need to increase it.
    expect(reset_button).to_be_visible(timeout=15000)

    print("Reset link appeared!")

    # Take screenshot
    page.screenshot(path="verification_reset_link.png")
    print("Screenshot saved to verification_reset_link.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_reset_link(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_failed.png")
        finally:
            browser.close()
