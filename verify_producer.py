from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8080/test-producer")
            page.goto("http://localhost:8080/test-producer")

            # Wait for the heading "Past Productions" to be visible
            print("Waiting for content to load...")
            try:
                page.wait_for_selector("text=Past Productions", timeout=10000)
            except Exception as e:
                print(f"Error waiting for selector: {e}")
                print(page.content()) # Print content for debugging
                page.screenshot(path="/home/jules/verification/error.png")
                return

            # Wait a bit for images to load if necessary
            time.sleep(2)

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/producer-profile.png", full_page=True)
            print("Screenshot saved to /home/jules/verification/producer-profile.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
