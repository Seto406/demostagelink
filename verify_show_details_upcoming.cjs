const { chromium } = require('playwright');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to a DIFFERENT dummy show that is upcoming to see the "Reserve by" message
    await page.goto('http://localhost:8080/show/demo-test-ticket');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check the button text
    const buyButton = page.locator('button').filter({ hasText: /Get Tickets|Buy Ticket|Reserve Now|Reserve Seat|Reservations Closed|Event Ended/i }).first();
    const buttonText = await buyButton.innerText();
    console.log("Button text:", buttonText);

    // Check the deadline text
    const deadlineText = page.locator('text=/Reserve by/');
    if (await deadlineText.count() > 0) {
        console.log("Deadline text:", await deadlineText.first().innerText());
    } else {
        console.log("Deadline text not found.");
    }

    await page.screenshot({ path: '/home/jules/verification/show_details_upcoming.png', fullPage: false });
    console.log('Screenshot saved.');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

verify();
