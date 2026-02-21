from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Test Desktop View
        print("Testing Desktop View...")
        page.set_viewport_size({"width": 1280, "height": 720})
        page.goto("http://localhost:8080")
        page.wait_for_selector("nav")

        # Verify Logo Image has aria-hidden
        logo_imgs = page.locator("nav img[alt='']")
        count = logo_imgs.count()
        print(f"Found {count} logo images with alt=''")

        # Check if any have aria-hidden='true'
        for i in range(count):
            attr = logo_imgs.nth(i).get_attribute("aria-hidden")
            print(f"Logo {i} aria-hidden: {attr}")
            if attr != "true":
                print("FAILURE: Logo image missing aria-hidden='true'")

        # Test Mobile View
        print("\nTesting Mobile View...")
        page.set_viewport_size({"width": 375, "height": 667})

        # Find mobile menu toggle button
        # There might be two, but on mobile one is hidden.
        # The visible one should be the one we interact with.
        toggle_btn = page.locator("button[aria-label='Toggle menu']").first

        # Check initial state
        expanded = toggle_btn.get_attribute("aria-expanded")
        controls = toggle_btn.get_attribute("aria-controls")
        print(f"Toggle Button Initial: aria-expanded={expanded}, aria-controls={controls}")

        if expanded != "false":
            print("FAILURE: Initial aria-expanded should be 'false'")

        # Click to open
        toggle_btn.click()
        page.wait_for_timeout(500) # Wait for animation/render

        # Check state after click
        expanded_after = toggle_btn.get_attribute("aria-expanded")
        print(f"Toggle Button After Click: aria-expanded={expanded_after}")

        if expanded_after != "true":
            print("FAILURE: aria-expanded should be 'true' after click")

        # Verify Mobile Menu Container
        mobile_menu = page.locator("#mobile-menu")
        if mobile_menu.is_visible():
            print("Mobile menu is visible")
            role = mobile_menu.get_attribute("role")
            label = mobile_menu.get_attribute("aria-label")
            modal = mobile_menu.get_attribute("aria-modal")

            print(f"Mobile Menu Attributes: role={role}, aria-label={label}, aria-modal={modal}")

            if role != "dialog":
                print("FAILURE: Mobile menu missing role='dialog'")
            if label != "Mobile menu":
                print("FAILURE: Mobile menu missing aria-label='Mobile menu'")
            if modal != "true":
                print("FAILURE: Mobile menu missing aria-modal='true'")
        else:
            print("FAILURE: Mobile menu not found or not visible")

        # Take screenshot
        page.screenshot(path="verification_mobile_menu.png")
        print("Screenshot saved to verification_mobile_menu.png")

        browser.close()

if __name__ == "__main__":
    run()
