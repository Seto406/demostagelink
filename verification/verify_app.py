from playwright.sync_api import sync_playwright, Page, expect

def test_app(page: Page):
    # Capture console logs to check for errors
    console_logs = []
    page.on("console", lambda msg: console_logs.append(msg))

    # Capture page errors (uncaught exceptions)
    page_errors = []
    page.on("pageerror", lambda exc: page_errors.append(exc))

    print("Navigating to Home...")
    page.goto("http://localhost:8080/")
    page.wait_for_load_state("networkidle")

    # Check for title or key element
    # Assuming there's a title or some text. I'll just wait for body.
    expect(page.locator("body")).to_be_visible()

    print("Navigating to Login...")
    page.goto("http://localhost:8080/login")
    page.wait_for_load_state("networkidle")
    expect(page.locator("body")).to_be_visible()

    print("Navigating to Shows...")
    page.goto("http://localhost:8080/shows")
    page.wait_for_load_state("networkidle")
    expect(page.locator("body")).to_be_visible()

    # Screenshot of Shows page
    page.screenshot(path="verification/shows_page.png")
    print("Screenshot taken.")

    # Report errors
    if console_logs:
        print("\nConsole Logs:")
        for msg in console_logs:
            if msg.type == "error":
                print(f"[ERROR] {msg.text}")

    if page_errors:
        print("\nPage Errors:")
        for exc in page_errors:
            print(f"[PAGE ERROR] {exc}")

    # Fail if there were page errors
    if page_errors:
        raise Exception("Page crashed with errors.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_app(page)
            print("Verification passed successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
