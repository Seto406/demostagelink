from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to ensure desktop nav is visible
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # Check Landing Page Pricing Section
        print("Navigating to Landing page...")
        page.goto("http://localhost:8080/#pricing")
        page.wait_for_load_state("networkidle")

        # Take screenshot of the pricing section
        # Locate the pricing section (it has id="pricing")
        pricing_section = page.locator("#pricing")

        # Ensure it's visible
        pricing_section.scroll_into_view_if_needed()

        # Check text content for restored features
        text = pricing_section.text_content()

        if "Priority search placement" in text:
             print("SUCCESS: 'Priority search placement' found.")
        else:
             print("FAILURE: 'Priority search placement' NOT found.")

        if "Featured productions badge" in text:
             print("SUCCESS: 'Featured productions badge' found.")
        else:
             print("FAILURE: 'Featured productions badge' NOT found.")

        if "SMS notifications" in text or "In-app, Email & SMS notifications" in text:
             print("SUCCESS: SMS notifications text found.")
        else:
             print("FAILURE: SMS notifications text NOT found.")

        # Screenshot
        page.screenshot(path="verification/pricing_restored.png", clip={"x": 0, "y": 0, "width": 1280, "height": 1000}) # approximate height, or use element screenshot
        pricing_section.screenshot(path="verification/pricing_section_restored.png")
        print("Screenshots saved.")

        browser.close()

if __name__ == "__main__":
    run()
