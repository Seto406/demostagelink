import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Verify Checkout Modal on Show Details Page
    print("Navigating to show page...")
    page.goto("http://localhost:8080/show/demo-msb")

    # Wait for page to load
    page.wait_for_selector("h1")
    print("Page loaded.")

    # Click Reserve Now
    print("Clicking Reserve Now...")
    page.get_by_role("button", name="Reserve Now").click()

    # Wait for modal
    page.wait_for_selector("text=Order Summary")
    print("Modal opened.")

    # Verify disclaimer
    expect(page.get_by_text("You are paying a")).to_be_visible()
    expect(page.get_by_text("reservation fee now to secure your seat")).to_be_visible()

    # Verify price breakdown - use more specific selectors to avoid duplicates
    # "Seat Commitment" row
    seat_commitment_row = page.locator("div", has_text="Seat Commitment").first
    expect(seat_commitment_row).to_contain_text("₱25.00")

    # "Remaining Balance" row
    balance_row = page.locator("div", has_text="Remaining Balance").first
    expect(balance_row).to_contain_text("₱1,475.00")

    # Take screenshot of modal
    if not os.path.exists("verification"):
        os.makedirs("verification")
    page.screenshot(path="verification/checkout_modal.png")
    print("Screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
