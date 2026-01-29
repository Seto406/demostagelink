import re
import json
from playwright.sync_api import sync_playwright, expect

SUPABASE_URL = "https://jfttjnoxveekouqcznis.supabase.co"
BASE_URL = "http://localhost:8080"
# LocalStorage key
AUTH_KEY = "sb-jfttjnoxveekouqcznis-auth-token"

def mock_supabase(page, role="audience"):
    # Mock User
    user_id = "test-user-id"
    user_data = {
        "id": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "email": f"test_{role}@example.com",
        "email_confirmed_at": "2023-01-01T00:00:00Z",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "identities": [],
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
    }

    # Mock Profile
    profile_data = {
        "id": "test-profile-id",
        "user_id": user_id,
        "role": role,
        "created_at": "2026-01-01T00:00:00Z",
        # Producer specific fields
        "group_name": "Test Theater Group",
        "description": "A test theater group",
        "founded_year": 2020,
        "niche": "local",
    }

    # Mock Shows
    shows_data = [
        {
            "id": "show-1",
            "title": "The Phantom of Testing",
            "description": "A hauntingly good test.",
            "date": "2026-03-15T19:00:00",
            "venue": "Test Theater",
            "city": "Manila",
            "niche": "local",
            "ticket_link": "http://example.com",
            "poster_url": "https://placehold.co/400x600/800000/FFF?text=Phantom",
            "status": "approved",
            "production_status": "ongoing",
            "producer_id": "test-profile-id",
            "created_at": "2026-01-10T00:00:00Z"
        },
        {
            "id": "show-2",
            "title": "Les Miserables Tests",
            "description": "Do you hear the people sing?",
            "date": "2026-04-01T14:00:00",
            "venue": "Grand Stage",
            "city": "Quezon City",
            "niche": "university",
            "status": "pending",
            "production_status": "ongoing",
            "producer_id": "test-profile-id",
            "created_at": "2026-01-20T00:00:00Z"
        }
    ]

    session_data = {
        "access_token": "fake-jwt-token",
        "refresh_token": "fake-refresh-token",
        "expires_in": 3600,
        "expires_at": 9999999999,
        "user": user_data
    }

    def handle_request(route):
        url = route.request.url
        # print(f"Mocking Supabase: {url}")

        if "auth/v1/user" in url:
            route.fulfill(json=user_data)
        elif "auth/v1/token" in url:
            route.fulfill(json=session_data)
        elif "rest/v1/profiles" in url:
            route.fulfill(json=[profile_data]) # Return list as select returns list
        elif "rest/v1/shows" in url:
            route.fulfill(json=shows_data)
        elif "rest/v1/favorites" in url:
            route.fulfill(json=[])
        elif "rest/v1/analytics_events" in url:
            route.fulfill(json=[])
        elif "storage/v1/object" in url:
            route.fulfill(json={"Key": "mock/key"})
        else:
            # print(f"Unhandled Supabase Mock: {url}")
            route.fulfill(status=200, json={})

    # Catch ALL Supabase requests
    page.route(re.compile(r".*supabase\.co.*"), handle_request)

    # Inject LocalStorage
    page.goto(BASE_URL)
    page.evaluate(f"""
        localStorage.setItem('{AUTH_KEY}', JSON.stringify({json.dumps(session_data)}));
    """)

def test_signup_flow(page):
    print("Testing Signup Flow...")
    page.goto(f"{BASE_URL}/login")

    # Expect Login page
    expect(page.get_by_text("Welcome Back")).to_be_visible()

    # Switch to Signup
    page.get_by_text("Sign up").click()

    # Verify User Type Selection
    expect(page.get_by_text("Join StageLink")).to_be_visible()
    page.get_by_text("I'm an Audience Member").click()

    # Verify Signup Form
    expect(page.get_by_text("Audience Sign Up")).to_be_visible()

    # Fill Form
    # Using ID locators because FloatingInput label is not associated with input via htmlFor
    page.locator("#email").fill("newuser@example.com")

    # Weak Password
    page.locator("#password").fill("weak")

    # Good Password
    page.locator("#password").fill("StrongP@ss1")
    page.locator("#confirmPassword").fill("StrongP@ss1")

    # Try Submit without Consent
    # Button should be disabled
    expect(page.get_by_role("button", name="Create Account")).to_be_disabled()

    # Check Consent
    page.get_by_role("checkbox").check()

    # Submit
    # Mock signup response
    def handle_signup(route):
        route.fulfill(json={"id": "new-user-id", "aud": "authenticated", "role": "authenticated", "email": "newuser@example.com"})

    page.route(re.compile(r".*/auth/v1/signup"), handle_signup)

    page.get_by_role("button", name="Create Account").click()

    # Expect navigation to /verify-email
    expect(page).to_have_url(f"{BASE_URL}/verify-email")

    page.screenshot(path="verification/signup_flow.png")
    print("Signup Flow Verified.")

def test_producer_dashboard(page):
    print("Testing Producer Dashboard...")

    # Debug Console
    page.on("console", lambda msg: print(f"Dashboard Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Dashboard Error: {err}"))
    page.on("requestfailed", lambda req: print(f"Request Failed: {req.url} {req.failure}"))

    # Clear storage first to ensure clean state
    page.goto(BASE_URL)
    page.evaluate("localStorage.clear()")

    mock_supabase(page, role="producer")

    # Go to Dashboard
    page.goto(f"{BASE_URL}/dashboard")

    # Verify Dashboard Loaded
    try:
        expect(page).to_have_url(f"{BASE_URL}/dashboard", timeout=5000)
        expect(page.get_by_text("Dashboard")).to_be_visible()
        expect(page.get_by_text("Total Productions")).to_be_visible()
    except Exception as e:
        print(f"Dashboard Load Failed. Current URL: {page.url}")
        print(f"Page Title: {page.title()}")
        # print(f"Page Content: {page.content()}")
        raise e

    # Verify Tour Guide
    # TourGuide.tsx waits for elements #dashboard-stats, etc.
    try:
        expect(page.get_by_text("Welcome to StageLink!")).to_be_visible(timeout=5000)
        print("Tour started successfully.")
        page.screenshot(path="verification/producer_tour_start.png")

        # Click Skip
        if page.get_by_label("Skip Tour").is_visible():
            page.get_by_label("Skip Tour").click()
        elif page.get_by_text("Skip Tour").is_visible():
            page.get_by_text("Skip Tour").click()

    except Exception as e:
        print(f"Tour did not appear: {e}")

    # Test Add Show
    page.locator("#add-show-button").first.click()
    expect(page.get_by_text("Add New Show")).to_be_visible() # Dialog title

    page.screenshot(path="verification/producer_add_show_modal.png")
    print("Producer Dashboard Verified.")

def test_audience_feed(page):
    print("Testing Audience Feed...")
    page.goto(BASE_URL)
    page.evaluate("localStorage.clear()")

    mock_supabase(page, role="audience")

    page.goto(f"{BASE_URL}/feed")

    # Verify Feed
    # Should see "The Phantom of Testing" from our mock.
    expect(page.get_by_text("The Phantom of Testing")).to_be_visible()

    page.screenshot(path="verification/audience_feed.png")
    print("Audience Feed Verified.")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    try:
        test_signup_flow(page)
        test_producer_dashboard(page)
        test_audience_feed(page)
    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()
