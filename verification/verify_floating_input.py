
from playwright.sync_api import sync_playwright, expect
import re

def verify_floating_input():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to login page
        print("Navigating to login page...")
        page.goto("http://localhost:8080/login")

        # Wait for the email input to be visible
        print("Waiting for email input...")
        email_input = page.locator("input#email")
        expect(email_input).to_be_visible()

        # Check if the label exists and points to the input
        print("Checking label association...")
        label = page.locator("label[for='email']")
        expect(label).to_be_visible()
        # The text includes "*" because it is required
        expect(label).to_have_text("Email*")

        # Check input value (should be empty initially)
        expect(email_input).to_have_value("")

        # Type something to verify interaction
        print("typing into input...")
        email_input.fill("test@example.com")
        expect(email_input).to_have_value("test@example.com")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/floating_input.png")

        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    verify_floating_input()
