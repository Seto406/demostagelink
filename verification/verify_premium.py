from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock Shows Response
    # The query string might vary, so we use a wildcard.
    # The response needs to match the structure expected by the frontend.
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

    # Check for Favorite Button
    print("Checking for Favorite Button...")
    # Wait for the card to load
    expect(page.get_by_text("Mock Show")).to_be_visible()

    fav_btn = page.get_by_label("Add to favorites").first
    expect(fav_btn).to_be_visible()

    # Take screenshot of Shows page with button
    page.screenshot(path="verification/shows_page.png")

    # Click it (expect Login toast)
    print("Clicking Favorite Button...")
    fav_btn.click()
    try:
        expect(page.get_by_text("Login Required")).to_be_visible()
        print("Login Required toast appeared.")
    except:
        print("Toast did not appear or took too long.")
        page.screenshot(path="verification/debug_toast_fail.png")


    # Mock Empty Response for Empty State verification
    # When searching, it refetches.
    page.route("**/rest/v1/shows*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[]'
    ))

    print("Testing Empty State...")
    page.get_by_placeholder("Search productions").fill("NonExistentShow")
    # Trigger search/filter
    page.wait_for_timeout(1000) # Wait for debounce

    # Expect Premium Empty State
    expect(page.get_by_text("No Productions Found")).to_be_visible()
    expect(page.get_by_role("button", name="Clear All Filters")).to_be_visible()
    page.screenshot(path="verification/empty_state.png")

    # Visit Show Details
    print("Navigating to Show Details...")
    # Mock specific show details response.
    # The frontend fetches the single show by ID.
    # Note: Supabase single fetch often uses Accept header: application/vnd.pgrst.object+json
    # or expects an array if .maybeSingle() is used but sometimes returns object.
    # The code uses .maybeSingle(), which returns an object or null.

    mock_show_details = '''
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
            "created_at": "2024-01-01",
            "director": "John Doe",
            "duration": "2h",
            "tags": ["Drama"],
            "cast_members": ["Actor A"],
            "profiles": {
                "id": "p1",
                "group_name": "Mock Group",
                "description": "Group Desc",
                "founded_year": 2020,
                "niche": "local"
            }
        }
    '''

    page.route("**/rest/v1/shows?*id=eq.1*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=mock_show_details
    ))

    page.goto("http://localhost:8080/show/1")

    # Check for Share Button
    print("Checking for Share Button...")
    share_btn = page.get_by_role("button", name="Share")
    expect(share_btn).to_be_visible()

    # Click Share
    share_btn.click()
    expect(page.get_by_text("Link copied to clipboard!")).to_be_visible()

    page.screenshot(path="verification/details_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
