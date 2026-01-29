from playwright.sync_api import Page, expect, sync_playwright

def test_not_found_page(page: Page):
    # 1. Arrange: Go to a non-existent page to trigger 404
    page.goto("http://localhost:8080/non-existent-page-123")

    # 2. Act: Check for the presence of the main landmark
    # We are looking for the 'main' role which corresponds to the <main> tag
    main_landmark = page.get_by_role("main")

    # 3. Assert: Confirm the main landmark is visible and contains expected text
    expect(main_landmark).to_be_visible()
    expect(main_landmark).to_contain_text("404")
    expect(main_landmark).to_contain_text("Oops! Page not found")

    # 4. Screenshot: Capture the result
    page.screenshot(path="verification/not_found_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_not_found_page(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
