import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock the verify-paymongo-payment response
        def handle_route(route):
            print("Intercepted verify-paymongo-payment request")
            route.fulfill(
                status=200,
                content_type="application/json",
                body='''{
                    "status": "paid",
                    "type": "ticket",
                    "ticket": {
                        "id": "mock_ticket_id",
                        "status": "confirmed",
                        "shows": {
                            "id": "mock_show_id",
                            "title": "Mock Show Title",
                            "date": "2023-12-31T20:00:00",
                            "venue": "Mock Venue",
                            "city": "Mock City",
                            "price": 500,
                            "reservation_fee": 50,
                            "poster_url": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000",
                            "profiles": {
                                "group_name": "Mock Group Name",
                                "niche": "university"
                            },
                            "theater_groups": null,
                            "seo_metadata": {
                                "payment_instructions": "Pay at the door."
                            }
                        }
                    }
                }'''
            )

        # Intercept the API call
        # The URL might be absolute or relative depending on how supabase client constructs it.
        # supabase-js constructs full URL.
        # We'll match broadly.
        page.route("**/verify-paymongo-payment", handle_route)

        try:
            print("Navigating to Success Page...")
            page.goto("http://localhost:8080/payment/success?ref=mock_ref")

            # Wait for content
            print("Waiting for 'Booking Confirmed'...")
            page.wait_for_selector("text=Booking Confirmed!", timeout=10000)

            # Wait for Digital Pass content (Title)
            print("Waiting for 'Mock Show Title'...")
            page.wait_for_selector("text=Mock Show Title", timeout=10000)

            # Wait for 'Mock Group Name'
            print("Waiting for 'Mock Group Name'...")
            page.wait_for_selector("text=Mock Group Name", timeout=10000)

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/success_page_mock.png", full_page=True)
            print("Screenshot saved to verification/success_page_mock.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
