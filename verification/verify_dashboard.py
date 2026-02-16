from playwright.sync_api import sync_playwright
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=['--no-sandbox', '--disable-gpu'])
    context = browser.new_context(viewport={'width': 1280, 'height': 800})

    # Inject Auth Mock
    context.add_init_script("""
        window.PlaywrightTest = true;
        window.PlaywrightUser = { id: 'test-user-id', email: 'producer@example.com' };
        window.PlaywrightProfile = {
            id: 'test-user-id',
            role: 'producer',
            group_name: 'Test Group',
            description: 'Test Description',
            avatar_url: 'https://github.com/shadcn.png',
            has_completed_tour: true
        };
    """)

    page = context.new_page()

    # Mock Shows
    page.route("**/rest/v1/shows*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{
            "id": "show-1",
            "title": "Hamilton",
            "producer_id": "test-user-id",
            "status": "approved",
            "production_status": "ongoing",
            "created_at": "2023-01-01",
            "date": "2023-12-01",
            "poster_url": "https://github.com/shadcn.png"
        }])
    ))

    # Mock Tickets
    page.route("**/rest/v1/tickets*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([
            {
                "id": "t1",
                "created_at": "2023-10-27T10:00:00Z",
                "profiles": {"username": "John Doe", "avatar_url": "https://github.com/shadcn.png"},
                "shows": {"title": "Hamilton"}
            },
            {
                "id": "t2",
                "created_at": "2023-10-26T15:30:00Z",
                "profiles": {"username": "Jane Smith", "avatar_url": None},
                "shows": {"title": "Hamilton"}
            }
        ])
    ))

    # Mock Group Members Count
    # Using */1 to simulate total count of 1
    page.route("**/rest/v1/group_members*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        headers={"Content-Range": "*/1"},
        body=json.dumps([{"id": "m1"}])
    ))

    # Mock Analytics
    page.route("**/rpc/get_analytics_summary", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"views": 0, "clicks": 0, "ctr": 0, "chartData": []})
    ))

    try:
        page.goto("http://localhost:3000/dashboard")
        page.wait_for_selector("text=Dashboard")
        page.wait_for_timeout(3000)
        page.screenshot(path="verification/dashboard_populated.png", full_page=True)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png", full_page=True)
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
