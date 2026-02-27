from playwright.sync_api import sync_playwright

def verify_ticket_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport to test truncation
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        print("Navigating to dashboard (shows ticket cards)...")
        try:
            # We use the dashboard because it likely has ticket cards or we can navigate to shows
            page.goto("http://localhost:3000/shows")
            page.wait_for_load_state("networkidle")

            # Take screenshot of Ticket Cards on Mobile
            print("Taking screenshot of Ticket Cards (Mobile View)...")
            page.screenshot(path="verification/ticket_cards_mobile.png", full_page=True)

            # Check for truncation classes
            cards = page.locator(".line-clamp-1")
            count = cards.count()
            print(f"Found {count} elements with line-clamp-1 class.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ticket_ui()
