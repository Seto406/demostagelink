from playwright.sync_api import sync_playwright
import time
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock the Supabase response for the producer profile
    def handle_route(route):
        # print(f"Intercepted: {route.request.url}")

        # Determine if it's the profile fetch
        if "rest/v1/profiles" in route.request.url and "select" in route.request.url:
            print("Mocking profile response")
            # Supabase usually returns a single object if .maybeSingle() is used but sometimes an array if .select() is used without .single() on the query builder unless the client handles it.
            # The client code uses .maybeSingle() which expects a single object or null.
            # However, the network response from Supabase REST API for .eq().maybeSingle() is typically an array with 0 or 1 elements, OR the client library handles the transformation.
            # Let's check how the Supabase JS client expects it. Usually it expects an array from the REST API if we look at raw requests.
            # But wait, maybeSingle() adds `accept: application/vnd.pgrst.object+json` header to get a single object.
            # Let's inspect the headers in a real scenario or just return an object and see if it works, or return array.
            # Safest is to try checking headers, but for now I'll return an array because `eq` usually returns list.
            # Actually, `maybeSingle` sends `Accept: application/vnd.pgrst.object+json` if I recall correctly.
            # Let's try returning the object directly first.

            response_body = {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "group_name": "Test Theater Group",
                "description": "This is a test description for the rich media profile.",
                "founded_year": 2020,
                "niche": "local",
                "avatar_url": "https://github.com/shadcn.png",
                "facebook_url": "https://facebook.com",
                "instagram_url": "https://instagram.com",
                "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "gallery_images": [
                    "https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?q=80&w=2069&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1503095392237-fc7852ad4566?q=80&w=2070&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=2070&auto=format&fit=crop"
                ]
            }

            # Check for specific header that requests single object
            headers = route.request.headers
            if "application/vnd.pgrst.object+json" in headers.get("accept", ""):
                 route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(response_body)
                )
            else:
                 # Fallback to array if it wasn't a single object request
                 route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps([response_body])
                )
        else:
            route.continue_()

    page.route("**/rest/v1/profiles*", handle_route)

    # Mock shows fetch to be empty or simple to avoid errors if any
    page.route("**/rest/v1/shows*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    try:
        # Navigate to the producer profile page with the mocked ID
        page.goto("http://localhost:8080/producer/123e4567-e89b-12d3-a456-426614174000")

        # Wait for the content to load
        page.wait_for_selector("text=Test Theater Group", timeout=10000)

        # Scroll down to see the rich media section
        # page.evaluate("window.scrollBy(0, 500)")

        # Wait for video and gallery to be visible
        page.wait_for_selector("text=Featured Video", timeout=5000)
        page.wait_for_selector("text=Gallery", timeout=5000)

        time.sleep(2) # Wait for iframe and images to render

        # Take a screenshot
        page.screenshot(path="verification/rich_media_profile.png", full_page=True)
        print("Screenshot taken: verification/rich_media_profile.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
