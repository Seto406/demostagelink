from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock Shows Response
    mock_shows = '''[
        {
            "id": "1",
            "title": "Mock Show",
            "description": "A great mock show description.",
            "date": "2024-12-01",
            "venue": "Mock Venue",
            "city": "Makati",
            "status": "approved",
            "niche": "local",
            "genre": "Musical",
            "ticket_link": "https://example.com",
            "poster_url": null,
            "profiles": {
                "id": "p1",
                "group_name": "Mock Group",
                "avatar_url": null,
                "description": "Group Desc",
                "founded_year": 2020,
                "niche": "local"
            }
        }
    ]'''

    page.route("**/rest/v1/shows*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=mock_shows
    ))

    # Visit Shows Page
    print("Navigating to /shows...")
    page.goto("http://localhost:8080/shows")

    # Verify Content visible
    expect(page.get_by_text("Mock Show")).to_be_visible()

    # Take screenshot to verify no weird visual artifacts from removed blur
    page.screenshot(path="verification/shows_clean_transition.png")

    # Navigate to Detail Page (to trigger transition)
    print("Clicking card to trigger transition...")
    page.click("text=Mock Show")

    # Verify details loaded
    expect(page.get_by_role("button", name="Get Tickets")).to_be_visible()

    # Take screenshot of details page
    page.screenshot(path="verification/details_clean_transition.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
