import { test, expect } from '@playwright/test';

test('force open ProductionModal and show Badge', async ({ page }) => {
  // Use playwright mock auth
  await page.addInitScript(() => {
    window.PlaywrightTest = true;
    window.PlaywrightUser = { id: "mock-user", email: "mock@example.com" };
    window.PlaywrightProfile = { id: "mock-profile", role: "producer", full_name: "Mock Producer" };
  });

  // Load the app dashboard
  await page.goto('http://localhost:8080/dashboard');

  // Wait a bit for React to hydrate
  await page.waitForTimeout(2000);

  // Expose a function to open the modal from React internals or force it via DOM
  // Since we know ProductionModal is mounted conditionally in UserFeed based on showProductionModal state,
  // we can just click the "Post a Show" button using more specific locators.

  // Wait for the loader to vanish
  await page.locator('.branded-loader').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

  // On the dashboard, there's an empty state placeholder if no shows exist
  const emptyStatePostBtn = page.getByRole('button', { name: 'Post a new production to get started!' });
  const dashboardPostBtn = page.getByRole('button', { name: 'Post a Show' });
  const otherPostBtn = page.getByText('Post a Show');

  if (await dashboardPostBtn.isVisible()) {
      await dashboardPostBtn.click();
      console.log("Clicked main dashboard post button");
  } else if (await emptyStatePostBtn.isVisible()) {
      await emptyStatePostBtn.click();
      console.log("Clicked empty state post button");
  } else if (await otherPostBtn.isVisible()) {
      await otherPostBtn.click();
      console.log("Clicked other text post button");
  } else {
      console.log("Cannot find any Post a Show button. HTML:");
      const html = await page.content();
      console.log(html.substring(0, 500));
  }

  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'verification_attempt.png', fullPage: true });

});
