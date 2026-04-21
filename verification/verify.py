from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8080')

        # Wait for rendering
        page.wait_for_selector('button:has-text("Dark Mode")')

        # Use tab to focus to ensure focus-visible is triggered
        page.keyboard.press("Tab")
        time.sleep(0.5)
        page.screenshot(path='/home/jules/verification/focus_dark.png')

        page.keyboard.press("Tab")
        time.sleep(0.5)
        page.screenshot(path='/home/jules/verification/focus_light.png')

        browser.close()

if __name__ == '__main__':
    verify()
