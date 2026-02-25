import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Check About page
        print("Checking About page...")
        page.goto("http://localhost:8080/about")
        page.wait_for_load_state("networkidle")

        # Verify Navbar elements for unauthenticated user
        # Specifically look inside <nav> tag

        # Locate the navbar. Assuming it's the first nav or one with specific classes.
        # Navbar.tsx uses <nav className="fixed ...">
        navbar = page.locator("nav").first

        if navbar.count() == 0:
             print("FAILURE: Navbar not found on About page.")
        else:
             print("Navbar found.")
             nav_text = navbar.text_content()

             if "Directory" in nav_text:
                 print("FAILURE: 'Directory' found in Navbar on About page.")
             else:
                 print("SUCCESS: 'Directory' NOT found in Navbar.")

             if "Shows" in nav_text:
                  # "Explore Shows" might be there if using LandingNavbar, but we expect App Navbar
                  # App Navbar has "Enter the Stage".
                  # If "Shows" is present, check context.
                  if "Explore Shows" in nav_text:
                       print("WARNING: 'Explore Shows' found (LandingNavbar?).")
                  else:
                       print("FAILURE: 'Shows' found in Navbar on About page.")
             else:
                  print("SUCCESS: 'Shows' NOT found in Navbar.")

        # Check for "Enter the Stage" button in Navbar
        if navbar.locator("button:has-text('Enter the Stage')").count() > 0:
            print("SUCCESS: 'Enter the Stage' button found in Navbar.")
        else:
            print("FAILURE: 'Enter the Stage' button NOT found in Navbar.")

        # Check for duplicated navbar
        # We expect only ONE fixed navbar at the top
        navs = page.locator("nav.fixed").count()
        print(f"Number of fixed navbars: {navs}")
        if navs > 1:
             print("FAILURE: Multiple fixed navbars found on About page.")
        else:
             print("SUCCESS: Single fixed navbar found on About page.")

        # Check Landing Page for navbar duplication
        print("Checking Landing page...")
        page.goto("http://localhost:8080/")
        page.wait_for_load_state("networkidle")

        # Landing page uses LandingNavbar.
        # AppLayout Navbar should be absent.
        # LandingNavbar has text "Features", "Pricing", "FAQ", "About".
        # App Navbar has "Enter the Stage".

        landing_nav = page.locator("nav").first
        landing_nav_text = landing_nav.text_content()

        if "Enter the Stage" in landing_nav_text:
             print("FAILURE: App Navbar ('Enter the Stage') found on Landing Page.")
        else:
             print("SUCCESS: App Navbar not found on Landing Page (checked text).")

        # Check count of fixed navbars on Landing Page
        landing_navs = page.locator("nav.fixed").count()
        print(f"Number of fixed navbars on Landing Page: {landing_navs}")
        if landing_navs > 1:
             print("FAILURE: Multiple fixed navbars found on Landing Page.")
        else:
             print("SUCCESS: Single fixed navbar found on Landing Page.")

        browser.close()

if __name__ == "__main__":
    run()
