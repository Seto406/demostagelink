from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 3000}) # Large height to capture full page
    page = context.new_page()

    try:
        page.goto("http://localhost:8080", timeout=60000)
        page.wait_for_load_state("networkidle")
    except Exception as e:
        print(f"Error loading page: {e}")
        browser.close()
        return

    # 1. Check Navbar (Unauthenticated)
    print("Checking Navbar...")
    # Should NOT have "Shows" or "Directory" links in center nav
    # Use specific locator for navbar to avoid footer
    navbar = page.locator("nav").first

    # Check if "Shows" link exists in navbar
    # Note: "Shows" might exist in mobile menu if hidden, but we are desktop size
    # Let's check if the text "Shows" is visible in the header nav

    # We expect centerNavLinks to be empty, so no "Shows" or "Directory" visible in the header center
    # "Enter the Stage" button should be visible
    enter_stage_btn = page.get_by_role("button", name="Enter the Stage")
    if enter_stage_btn.is_visible():
        print("PASS: 'Enter the Stage' button is visible.")
    else:
        print("FAIL: 'Enter the Stage' button is NOT visible.")

    # 2. Check Features Section
    print("Checking Features Section...")
    # Scroll to features
    # Locate by ID
    page.evaluate("document.getElementById('features').scrollIntoView()")
    page.wait_for_timeout(1000) # Wait for animation

    # Check for "Favorites" title (h3)
    favorites_title = page.get_by_role("heading", name="Favorites", exact=True)
    if favorites_title.is_visible():
        print("PASS: 'Favorites' title is visible.")
    else:
        print("FAIL: 'Favorites' title is NOT visible.")

    # 3. Check Pricing Section
    print("Checking Pricing Section...")
    page.evaluate("document.getElementById('pricing').scrollIntoView()")
    page.wait_for_timeout(1000)

    # Check Free Plan text
    # It's a list item text.
    audience_favorites = page.get_by_text("Audience favorites", exact=True)
    old_text = page.get_by_text("Audience favorites & watchlist")

    if audience_favorites.is_visible():
        print("PASS: 'Audience favorites' is visible.")
    else:
        print("FAIL: 'Audience favorites' is NOT visible.")

    if not old_text.is_visible():
        print("PASS: Old text 'Audience favorites & watchlist' is NOT visible.")
    else:
        print("FAIL: Old text is still visible.")

    # Check Pro Producer Plan features
    notifications = page.get_by_text("In-app & Email notifications")
    if notifications.is_visible():
         print("PASS: 'In-app & Email notifications' is visible.")
    else:
         print("FAIL: 'In-app & Email notifications' is NOT visible.")

    # Check removed features are gone
    priority = page.get_by_text("Priority search placement")
    featured = page.get_by_text("Featured productions badge")

    if not priority.is_visible() and not featured.is_visible():
        print("PASS: Removed features are gone.")
    else:
        print("FAIL: Removed features are still visible.")

    # Check CTA "Contact Us"
    contact_us = page.get_by_role("button", name="Contact Us")
    if contact_us.is_visible():
        print("PASS: 'Contact Us' button is visible.")
    else:
        print("FAIL: 'Contact Us' button is NOT visible.")

    # Take Screenshot
    page.screenshot(path="verification_landing_changes.png", full_page=True)
    print("Screenshot saved to verification_landing_changes.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
