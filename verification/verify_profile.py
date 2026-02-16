from playwright.sync_api import sync_playwright, Page, expect
import json

def verify_profile_and_settings(page: Page):
    # 1. Mock Supabase Network Requests

    # Mock Profile Fetch (catch-all for profiles)
    page.route("**/rest/v1/profiles?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{
            "id": "profile-mock-user-123",
            "username": "TheaterFan123",
            "avatar_url": "https://github.com/shadcn.png",
            "role": "audience",
            "created_at": "2023-01-01T00:00:00Z",
            "group_name": "Theater Fan",
            "niche": "local"
        }])
    ))

    # Mock Tickets Fetch
    page.route("**/rest/v1/tickets?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{
            "id": "ticket-1",
            "show_id": "show-1",
            "status": "paid",
            "shows": {
                "id": "show-1",
                "title": "Hamlet: The Musical",
                "poster_url": "https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?q=80&w=2071&auto=format&fit=crop",
                "date": "2024-05-15T19:00:00Z",
                "venue": "Grand Theater",
                "city": "Manila",
                "profiles": {
                    "group_name": "Royal Shakespeare Co."
                }
            }
        }])
    ))

    # Mock Follows Fetch
    page.route("**/rest/v1/follows?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{
            "id": "follow-1",
            "following_id": "producer-1",
            "profiles": {
                "id": "producer-1",
                "group_name": "Awesome Theater Group",
                "avatar_url": "https://github.com/shadcn.png",
                "niche": "university"
            }
        }])
    ))

    # Mock Reviews Fetch
    page.route("**/rest/v1/reviews?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{
            "id": "review-1",
            "rating": 5,
            "comment": "Absolutely stunning performance! A must-see.",
            "created_at": "2024-04-01T12:00:00Z",
            "shows": {
                "id": "show-2",
                "title": "The Lion King",
                "poster_url": "https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?q=80&w=2071&auto=format&fit=crop"
            }
        }])
    ))

    # 2. Inject Mock User into AuthContext
    page.add_init_script("""
        window.PlaywrightTest = true;
        window.PlaywrightUser = {
            id: 'mock-user-123',
            email: 'test@example.com',
            user_metadata: {
                full_name: 'Test User',
                avatar_url: 'https://github.com/shadcn.png'
            }
        };
    """)

    # 3. Navigate to Profile
    page.goto("http://localhost:8080/profile")

    # 4. Verify Profile
    print("Verifying Profile...")
    expect(page.get_by_text("Theater Fan")).to_be_visible(timeout=10000)

    # Check Stats Bar (using separate text checks)
    stats_container = page.locator(".border-t.border-b")
    expect(stats_container.get_by_text("Passes")).to_be_visible()
    expect(stats_container.get_by_text("Following")).to_be_visible()
    expect(stats_container.get_by_text("Reviews")).to_be_visible()

    # Check Tabs
    expect(page.get_by_role("tab", name="My Passes")).to_be_visible()
    expect(page.get_by_role("tab", name="Following")).to_be_visible()
    expect(page.get_by_role("tab", name="Reviews")).to_be_visible()

    # Check Ticket Card
    expect(page.get_by_text("Hamlet: The Musical")).to_be_visible()
    expect(page.get_by_text("₱25 Commitment Paid")).to_be_visible()

    # Screenshot Profile
    page.screenshot(path="verification/profile_passes.png")
    print("Profile Screenshot taken.")

    # 5. Verify Settings
    print("Verifying Settings...")
    # Click Settings button (it's a link to /settings)
    # We use force=True or explicit selector because button might be nested
    page.get_by_role("link", name="Settings").click()

    # Wait for Settings page
    expect(page.get_by_role("heading", name="Settings")).to_be_visible()

    # Click Change Password
    page.get_by_text("Change Password").click()

    # Verify Modal
    expect(page.get_by_role("dialog")).to_be_visible()
    expect(page.get_by_label("Current Password")).to_be_visible()
    expect(page.get_by_label("New Password", exact=True)).to_be_visible()
    expect(page.get_by_label("Confirm New Password")).to_be_visible()

    # Test Strength Meter
    page.get_by_label("New Password", exact=True).fill("weak")
    expect(page.get_by_text("Weak")).to_be_visible()

    page.get_by_label("New Password", exact=True).fill("StrongPass1!")
    expect(page.get_by_text("Excellent")).to_be_visible()

    # Screenshot Settings Modal
    page.screenshot(path="verification/settings_password_modal.png")
    print("Settings Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to ensure stats bar fits
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            verify_profile_and_settings(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_retry.png")
        finally:
            browser.close()
