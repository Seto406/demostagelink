from playwright.sync_api import sync_playwright
import os

def run():
    os.makedirs("/home/jules/verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()

        print("Navigating to http://localhost:8080...")
        try:
            page.goto("http://localhost:8080")
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        print("Waiting for content...")
        try:
            # Wait for "The Stage Is Yours" text to be visible (CinematicLanding)
            page.wait_for_selector("text=The Stage Is Yours", state="visible", timeout=30000)

            # Wait for Marquee to be visible (it has text starting with ★)
            page.wait_for_selector("text=★", state="visible", timeout=10000)

            # Additional wait to ensure animations settle slightly (though they are continuous)
            page.wait_for_timeout(2000)

            # Take screenshot
            page.screenshot(path="/home/jules/verification/verification.png")
            print("Screenshot saved to /home/jules/verification/verification.png")
        except Exception as e:
            print(f"Error waiting for content: {e}")
            page.screenshot(path="/home/jules/verification/error.png")

        browser.close()

if __name__ == "__main__":
    run()
