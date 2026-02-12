from playwright.sync_api import sync_playwright
import json
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock User
    user = {
        "id": "test-producer-id",
        "email": "producer@test.com",
        "role": "authenticated",
        "aud": "authenticated",
        "app_metadata": { "provider": "email" },
        "user_metadata": { "full_name": "Test Producer" }
    }

    # Inject Auth
    auth_script = f"""
        window.localStorage.setItem('supabase.auth.token', JSON.stringify({{
            currentSession: {{
                access_token: 'mock-token',
                user: {json.dumps(user)}
            }}
        }}));
        window.PlaywrightTest = true;
        window.PlaywrightUser = {json.dumps(user)};
    """
    page.add_init_script(auth_script)

    # Mock User/Subscription/Profile API Calls
    # Intercept all Supabase REST/RPC calls to return mocks

    # 1. Profile (Producer)
    page.route("**/rest/v1/profiles*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({
            "id": "test-producer-id",
            "user_id": "test-producer-id",
            "role": "producer",
            "group_name": "Test Group",
            "created_at": "2024-01-01T00:00:00Z"
        })
    ))

    # 2. Subscription (Empty/None -> Not Pro)
    page.route("**/rest/v1/subscriptions*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    # 3. Shows (Empty)
    page.route("**/rest/v1/shows*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    # 4. Analytics RPC (Empty)
    page.route("**/rpc/get_analytics_summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({ "views": 0, "clicks": 0, "ctr": 0, "chartData": [] })
    ))

    # 5. Group Members (Empty)
    page.route("**/rest/v1/group_members*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    # 6. Audience Links (Empty)
    page.route("**/rest/v1/group_audience_links*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    print("Navigating to Dashboard...")
    try:
        page.goto("http://localhost:8081/dashboard")
        page.wait_for_load_state("networkidle")
    except Exception as e:
        print(f"Error navigating: {e}")

    print("Checking Analytics Lock...")
    page.wait_for_timeout(2000) # Wait for rendering

    # Handle Tour Modal
    try:
        skip_btn = page.get_by_text("Skip Tour")
        if skip_btn.count() > 0:
            skip_btn.first.click()
            print("Skipped Tour")
            page.wait_for_timeout(500)
    except:
        pass

    page.screenshot(path="verification/dashboard_analytics_locked.png")

    # Navigate to Members tab
    print("Navigating to Members Tab...")
    try:
        # Click the button with the Users icon (Group Members)
        # Using CSS selector to find button containing the Users icon (lucide-users class or similar structure)
        # Since lucide-react renders svg, we look for button containing svg
        # The buttons are in order: Dashboard, Shows, Profile, Members
        # Let's try finding by text first, if visible. If not, try icon.

        members_btn = page.get_by_text("Group Members")
        if members_btn.is_visible():
            members_btn.click()
        else:
            print("Text hidden, clicking by index/icon...")
            # It's the 4th button in the sidebar navigation
            # Assuming sidebar is the <aside> or similar container.
            # Let's target the button that sets activeTab to members.
            # We can use the svg selector.
            # <Users> usually renders an svg.
            # page.locator("button:has(svg)") might match many.
            # Let's use the 4th button in the main sidebar area.

            # Or better: locate by icon class? No, classes are hashed or generic.
            # But the component source has <Users .../>.
            # Let's try to click the 4th button in the sidebar list.
            # Target buttons inside the nav element to avoid logout/logo buttons
            sidebar_buttons = page.locator("aside nav button")
            count = sidebar_buttons.count()
            print(f"Found {count} sidebar nav buttons")

            if count >= 4:
                print("Clicking 4th button (Members)...")
                sidebar_buttons.nth(3).click()
            else:
                print("Sidebar buttons not found or insufficient")

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/dashboard_members_locked.png")
    except Exception as e:
        print(f"Error clicking members tab: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
