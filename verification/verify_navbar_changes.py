from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to ensure desktop nav is visible
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 1. Check About Page
        print("Navigating to About page...")
        page.goto("http://localhost:8080/about")
        page.wait_for_load_state("networkidle")

        # Take screenshot of the top of the page (Navbar area)
        page.screenshot(path="verification/about_navbar.png", clip={"x": 0, "y": 0, "width": 1280, "height": 200})
        print("Screenshot saved to verification/about_navbar.png")

        # 2. Check Landing Page
        print("Navigating to Landing page...")
        page.goto("http://localhost:8080/")
        page.wait_for_load_state("networkidle")

        # Take screenshot of the top of the page (Navbar area)
        page.screenshot(path="verification/landing_navbar.png", clip={"x": 0, "y": 0, "width": 1280, "height": 200})
        print("Screenshot saved to verification/landing_navbar.png")

        browser.close()

if __name__ == "__main__":
    run()
