from playwright.sync_api import sync_playwright

def inspect_ticket_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/shows")
        page.wait_for_load_state("networkidle")

        # Get the first ticket card's HTML
        # Assuming the card structure, let's look for h3 with font-serif
        try:
            # Wait for at least one card
            page.wait_for_selector("h3.font-serif", timeout=5000)

            # Get the first title element
            title_el = page.locator("h3.font-serif").first
            print("Title classes:", title_el.get_attribute("class"))

            # Get the group name (p tag following it)
            group_el = page.locator("h3.font-serif + p").first
            print("Group classes:", group_el.get_attribute("class"))

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    inspect_ticket_html()
