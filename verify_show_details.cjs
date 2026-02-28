const { chromium } = require('playwright');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the dummy show details page that we know has a price
    await page.goto('http://localhost:8080/show/b4317b82-24fc-4d2d-bcb3-56f1e68472cb');

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

    await page.screenshot({ path: '/home/jules/verification/show_details.png', fullPage: false });
    console.log('Screenshot saved.');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

verify();
