import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720}) # Explicitly set desktop size
        page = context.new_page()

        # Check About page
        print("Checking About page...")
        page.goto("http://localhost:8080/about")
        page.wait_for_load_state("networkidle")

        # Check count of fixed navbars
        fixed_navs = page.locator("nav.fixed")
        count = fixed_navs.count()
        print(f"Number of fixed navbars: {count}")

        for i in range(count):
            nav = fixed_navs.nth(i)
            # Print class and maybe some text or id to identify
            print(f"Navbar {i+1}:")
            print(f"  Classes: {nav.get_attribute('class')}")
            # print first 100 chars of text
            print(f"  Text: {nav.text_content()[:100]}...")

        if count > 1:
             print("FAILURE: Multiple fixed navbars found on About page.")
        else:
             print("SUCCESS: Single fixed navbar found on About page.")

        # Also check Landing Page
        print("\nChecking Landing page...")
        page.goto("http://localhost:8080/")
        page.wait_for_load_state("networkidle")

        fixed_navs_landing = page.locator("nav.fixed")
        count_landing = fixed_navs_landing.count()
        print(f"Number of fixed navbars on Landing Page: {count_landing}")

        for i in range(count_landing):
             nav = fixed_navs_landing.nth(i)
             print(f"Navbar {i+1}:")
             print(f"  Classes: {nav.get_attribute('class')}")
             print(f"  Text: {nav.text_content()[:100]}...")

        browser.close()

if __name__ == "__main__":
    run()
