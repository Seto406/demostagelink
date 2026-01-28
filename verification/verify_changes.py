from playwright.sync_api import sync_playwright, expect
import re

def verify(page):
    # 1. Login Page Check
    print("Navigating to Login page...")
    page.goto("http://localhost:8080/login")

    # Check for Data Consent checkbox in Signup mode
    print("Switching to Signup mode...")
    signup_link = page.get_by_role("button", name="Sign up")
    signup_link.click()
    page.wait_for_timeout(1000)

    print("Selecting Audience type...")
    audience_btn = page.get_by_text("I'm an Audience Member")
    audience_btn.click()

    print("Checking for Data Consent checkbox...")
    checkbox = page.locator("button[role='checkbox']")

    page.screenshot(path="verification/login_consent.png")

    if checkbox.is_visible():
        print("Checkbox found!")
    else:
        print("Checkbox NOT found!")

    # 2. Footer & Legal Links Check
    print("Navigating to Home page to check Footer...")
    page.goto("http://localhost:8080/")

    privacy_link = page.get_by_role("link", name="Privacy Policy")
    terms_link = page.get_by_role("link", name="Terms of Service")

    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(500)

    if privacy_link.is_visible() and terms_link.is_visible():
        print("Legal links found in footer.")
    else:
        print("Legal links NOT found.")

    page.screenshot(path="verification/footer.png")

    # Navigate to Privacy
    print("Navigating to Privacy Policy...")
    privacy_link.click()
    page.wait_for_timeout(2000) # Wait for SPA nav

    expect(page).to_have_url(re.compile(".*privacy"))
    page.screenshot(path="verification/privacy_page.png")
    print("Privacy page verified.")

    # Navigate to Terms
    print("Navigating to Terms...")
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(500)

    terms_link_2 = page.get_by_role("link", name="Terms of Service")
    terms_link_2.click()
    page.wait_for_timeout(2000)

    expect(page).to_have_url(re.compile(".*terms"))
    page.screenshot(path="verification/terms_page.png")
    print("Terms page verified.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
