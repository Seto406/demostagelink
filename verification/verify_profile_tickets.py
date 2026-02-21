from playwright.sync_api import sync_playwright, Page, expect
import json
import time

MOCK_PROFILE = {
    "id": "test-user-id",
    "username": "TestAudience",
    "role": "audience",
    "created_at": "2023-01-01T00:00:00.000Z",
    "avatar_url": None,
    "xp": 100,
    "niche": "drama"
}

MOCK_TICKET = {
    "id": "ticket-123",
    "show_id": "show-456",
    "status": "confirmed",
    "shows": {
        "id": "show-456",
        "title": "The Phantom of the Opera",
        "poster_url": "https://placehold.co/400x600?text=Phantom",
        "date": "2024-12-25T20:00:00.000Z",
        "venue": "Her Majesty's Theatre",
        "city": "London",
        "price": 100,
        "reservation_fee": 20,
        "seo_metadata": {"payment_instructions": "Pay at door."},
        "profiles": {
            "group_name": "West End Productions"
        }
    }
}

def inject_auth(page: Page):
    page.add_init_script("""
        window.PlaywrightTest = true;
        window.PlaywrightUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z'
        };
        window.PlaywrightProfile = {
            id: 'test-user-id',
            username: 'TestAudience',
            role: 'audience'
        };
    """)

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # Mock Supabase Requests
        def handle_route(route):
            url = route.request.url
            if "/rest/v1/profiles" in url:
                route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_PROFILE))
            elif "/rest/v1/tickets" in url:
                # Scenario 1: Return one confirmed ticket
                route.fulfill(status=200, content_type="application/json", body=json.dumps([MOCK_TICKET]))
            elif "/rest/v1/follows" in url or "/rest/v1/reviews" in url:
                route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
            else:
                route.continue_()

        page.route("**/*", handle_route)

        inject_auth(page)

        print("Navigating to profile page...")
        page.goto("http://localhost:8080/profile/test-user-id")

        # Wait for profile to load
        print("Waiting for profile content...")
        expect(page.get_by_text("TestAudience")).to_be_visible(timeout=10000)

        # Verify "My Passes" tab is active and ticket is visible
        print("Verifying ticket presence...")
        expect(page.get_by_text("The Phantom of the Opera")).to_be_visible()
        expect(page.get_by_text("Confirmed", exact=True)).to_be_visible()

        # Screenshot populated state
        page.screenshot(path="verification/profile_with_tickets.png")
        print("Screenshot saved: verification/profile_with_tickets.png")

        # Now test Empty State
        print("Testing empty state...")

        # Reload page with empty tickets mock
        def handle_empty_route(route):
            url = route.request.url
            if "/rest/v1/profiles" in url:
                route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_PROFILE))
            elif "/rest/v1/tickets" in url:
                route.fulfill(status=200, content_type="application/json", body=json.dumps([])) # Empty list
            elif "/rest/v1/follows" in url or "/rest/v1/reviews" in url:
                route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
            else:
                route.continue_()

        page.unroute("**/*")
        page.route("**/*", handle_empty_route)

        page.reload()
        expect(page.get_by_text("TestAudience")).to_be_visible(timeout=10000)

        # Verify Empty State
        print("Verifying empty state...")
        expect(page.get_by_text("No passes yet")).to_be_visible()
        expect(page.get_by_text("Explore shows to secure your seat!")).to_be_visible()
        expect(page.get_by_role("button", name="Browse Shows")).to_be_visible()

        page.screenshot(path="verification/profile_empty_state.png")
        print("Screenshot saved: verification/profile_empty_state.png")

        browser.close()

if __name__ == "__main__":
    run_test()
