from playwright.sync_api import sync_playwright
import json
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Define mock data
        admin_user = {
            "id": "admin-user-id",
            "aud": "authenticated",
            "role": "authenticated",
            "email": "admin@example.com",
            "confirmed_at": "2023-01-01T00:00:00Z",
            "last_sign_in_at": "2023-01-01T00:00:00Z",
            "app_metadata": {
                "provider": "email",
                "providers": ["email"]
            },
            "user_metadata": {},
            "identities": []
        }

        admin_profile = {
            "id": "admin-profile-id",
            "user_id": "admin-user-id",
            "role": "admin",
            "group_name": "Admin Group",
            "created_at": "2023-01-01T00:00:00Z"
        }

        dashboard_stats = {
            "totalUsers": 123,
            "totalShows": 456,
            "activeProducers": 10,
            "pendingRequests": 5,
            "deletedShows": 2,
            "pendingShows": 3,
            "approvedShows": 450,
            "rejectedShows": 3
        }

        # Mock Network Requests

        # 1. Auth User
        page.route("**/auth/v1/user", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(admin_user)
        ))

        # 2. Profiles (for AuthContext to get profile)
        page.route("**/rest/v1/profiles*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([admin_profile]) # Return array as it might be a list query
        ))

        # 3. Admin Stats RPC
        page.route("**/rest/v1/rpc/get_admin_dashboard_stats", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(dashboard_stats)
        ))

        # 4. Shows List (AdminPanel fetches shows)
        page.route("**/rest/v1/shows*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([]) # Empty list for now
        ))

        # 5. Producer Requests
        page.route("**/rest/v1/producer_requests*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([])
        ))

        # 6. Users List (RPC)
        page.route("**/rest/v1/rpc/get_admin_user_list", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "users": [],
                "total_count": 0
            })
        ))

        # Mock Login Response
        page.route("**/auth/v1/token?grant_type=password", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "access_token": "fake-access-token",
                "token_type": "bearer",
                "expires_in": 3600,
                "refresh_token": "fake-refresh-token",
                "user": admin_user
            })
        ))

        print("Navigating to Login...")
        page.goto("http://localhost:8080/login")

        # Fill Login Form
        try:
            page.wait_for_selector("input[type='email']", timeout=5000)
            page.fill("input[type='email']", "admin@example.com")
            page.fill("input[type='password']", "password")
            page.click("button[type='submit']")
            print("Logged in.")
        except Exception as e:
            print(f"Login failed: {e}")
            page.screenshot(path="/home/jules/verification/login_error.png")
            return

        print("Waiting for navigation...")
        time.sleep(2)

        print("Navigating to Admin Panel...")
        page.goto("http://localhost:8080/admin")

        print("Waiting for stats to load...")
        try:
            # Verify "Show Approvals" (default tab)
            page.wait_for_selector("text=Show Approvals", timeout=10000)

            # Verify Stats
            # totalUsers: 123
            # totalShows: 456
            page.wait_for_selector("text=123", timeout=5000)
            print("Verified totalUsers: 123")

            page.wait_for_selector("text=456", timeout=5000)
            print("Verified totalShows: 456")

            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/admin_dashboard.png", full_page=True)
            print("Screenshot saved to /home/jules/verification/admin_dashboard.png")
        except Exception as e:
            print(f"Error on dashboard: {e}")
            page.screenshot(path="/home/jules/verification/dashboard_error.png")

        browser.close()

if __name__ == "__main__":
    run()
