"""Verify tooltips are visible when hovering over trigger elements."""
import re
import json
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:8080"
AUTH_KEY = "sb-jfttjnoxveekouqcznis-auth-token"


def mock_supabase_for_producer(page):
    """Mock Supabase for producer dashboard access."""
    user_data = {
        "id": "test-user-id",
        "aud": "authenticated",
        "role": "authenticated",
        "email": "test_producer@example.com",
        "email_confirmed_at": "2023-01-01T00:00:00Z",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "identities": [],
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
    }
    profile_data = {
        "id": "test-profile-id",
        "user_id": "test-user-id",
        "role": "producer",
        "created_at": "2026-01-01T00:00:00Z",
        "group_name": "Test Theater Group",
        "description": "A test theater group",
        "founded_year": 2020,
        "niche": "local",
    }
    session_data = {
        "access_token": "fake-jwt-token",
        "refresh_token": "fake-refresh-token",
        "expires_in": 3600,
        "expires_at": 9999999999,
        "user": user_data,
    }

    def handle_request(route):
        url = route.request.url
        if "auth/v1/user" in url:
            route.fulfill(json=user_data)
        elif "auth/v1/token" in url:
            route.fulfill(json=session_data)
        elif "rest/v1/profiles" in url:
            route.fulfill(json=[profile_data])
        elif "rest/v1/shows" in url:
            route.fulfill(json=[])
        elif "rest/v1/analytics_events" in url:
            route.fulfill(json=[])
        elif "rest/v1/favorites" in url:
            route.fulfill(json=[])
        elif "storage/" in url:
            route.fulfill(json={"Key": "mock/key"})
        else:
            route.fulfill(status=200, json={})

    page.route(re.compile(r".*supabase\.co.*"), handle_request)
    page.goto(BASE_URL)
    page.evaluate(f'localStorage.setItem("{AUTH_KEY}", JSON.stringify({json.dumps(session_data)}));')


def test_dashboard_tooltip(page):
    """Test Production Status tooltip in Add Show modal."""
    print("Testing Dashboard tooltip (Add Show modal)...")
    page.goto(BASE_URL)
    page.evaluate("localStorage.clear()")
    mock_supabase_for_producer(page)

    page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")

    # Skip tour if it appears
    try:
        skip_btn = page.get_by_label("Skip Tour").or_(page.get_by_text("Skip Tour"))
        if skip_btn.is_visible(timeout=2000):
            skip_btn.click()
    except Exception:
        pass

    # Open Add Show modal
    add_btn = page.locator("#add-show-button").first
    expect(add_btn).to_be_visible(timeout=5000)
    add_btn.click()

    # Wait for modal
    expect(page.get_by_text("Add New Show")).to_be_visible(timeout=3000)

    # Hover over the HelpCircle for Production Status (inside the modal)
    # HelpCircle is in the dialog, near "Production Status"
    dialog = page.locator('[role="dialog"]')
    expect(dialog).to_be_visible(timeout=2000)
    help_icon = dialog.locator('svg.lucide-help-circle').first
    expect(help_icon).to_be_visible(timeout=3000)
    help_icon.hover()

    # Wait for tooltip (Radix: 300ms delayDuration, then shows with data-state="delayed-open")
    page.wait_for_timeout(400)
    tooltip = page.locator('[role="tooltip"]').or_(page.locator('[data-state="delayed-open"]'))
    try:
        expect(tooltip).to_be_visible(timeout=2000)
        assert "past productions" in tooltip.text_content().lower() or "portfolio" in tooltip.text_content().lower()
        print("  PASS: Dashboard Production Status tooltip visible")
    except Exception as e:
        print(f"  FAIL: Dashboard tooltip not visible: {e}")
        page.screenshot(path="verification/tooltip_dashboard_fail.png")
        raise


def test_analytics_tooltip(page):
    """Test CTR tooltip in Analytics dashboard."""
    print("Testing Analytics dashboard tooltip...")
    page.goto(BASE_URL)
    page.evaluate("localStorage.clear()")
    mock_supabase_for_producer(page)

    page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")

    try:
        skip_btn = page.get_by_label("Skip Tour").or_(page.get_by_text("Skip Tour"))
        if skip_btn.is_visible(timeout=2000):
            skip_btn.click()
    except Exception:
        pass

    # Navigate to Analytics tab
    analytics_tab = page.get_by_text("Analytics", exact=True).first
    if analytics_tab.is_visible(timeout=2000):
        analytics_tab.click()

    # Look for Click-Through Rate card with HelpCircle
    help_icon = page.locator("text=Click-Through Rate").locator("..").locator("svg.lucide-help-circle").first
    if help_icon.count() == 0:
        help_icon = page.locator('svg.lucide-help-circle').first

    if help_icon.count() > 0:
        help_icon.first.hover()
        page.wait_for_timeout(400)
        tooltip = page.locator('[role="tooltip"]').or_(page.locator('[data-state="delayed-open"]'))
        try:
            expect(tooltip).to_be_visible(timeout=2000)
            print("  PASS: Analytics CTR tooltip visible")
        except Exception as e:
            print(f"  FAIL: Analytics tooltip not visible: {e}")
            page.screenshot(path="verification/tooltip_analytics_fail.png")
    else:
        print("  SKIP: Analytics tab or help icon not found (may need producer with analytics)")


def test_landing_tooltip(page):
    """Test tooltip on landing/pricing page."""
    print("Testing Landing/Pricing tooltip...")
    page.goto(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")

    # Find 'Coming Soon' badge with info icon (if present)
    coming_soon = page.get_by_text("Coming Soon")
    if coming_soon.is_visible(timeout=3000):
        info_icon = page.locator('svg.lucide-info').first
        if info_icon.count() > 0:
            info_icon.hover()
            page.wait_for_timeout(400)
            tooltip = page.locator('[role="tooltip"]').or_(page.locator('[data-state="delayed-open"]'))
            try:
                expect(tooltip).to_be_visible(timeout=2000)
                print("  PASS: Pricing 'Coming Soon' tooltip visible")
            except Exception as e:
                print(f"  FAIL: Pricing tooltip not visible: {e}")
        else:
            print("  SKIP: Coming Soon info icon not found")
    else:
        print("  SKIP: Coming Soon section not on initial view")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            test_dashboard_tooltip(page)
            test_analytics_tooltip(page)
            test_landing_tooltip(page)
            print("\nTooltip verification complete.")
        except Exception as e:
            print(f"\nVerification failed: {e}")
            page.screenshot(path="verification/tooltip_error.png")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
