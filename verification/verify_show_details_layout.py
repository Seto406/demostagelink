from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a large viewport to see the grid layout clearly
        page = browser.new_page(viewport={"width": 1400, "height": 1200})

        # Navigate to the show details page
        # Using the demo show ID found in src/data/dummyShows.ts
        page.goto("http://localhost:8080/shows/demo-msb")

        # Wait for the content to load
        expect(page.get_by_role("heading", name="Mula sa Buwan")).to_be_visible(timeout=10000)

        # Take a screenshot of the Hero Section and Main Content
        page.screenshot(path="verification/show_details_layout.png", full_page=True)

        print("Screenshot taken at verification/show_details_layout.png")
        browser.close()

if __name__ == "__main__":
    run()
