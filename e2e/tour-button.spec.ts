import { test, expect } from '@playwright/test';

test('tour button has NO step count', async ({ page }) => {
  // Clear local storage first to ensure clean state
  await page.addInitScript(() => {
    localStorage.clear();
    // Force tour to start
    localStorage.setItem('stagelink_tour_active', 'true');
    localStorage.setItem('stagelink_tour_step_index', '0');
  });

  await page.goto('/');

  // Wait for tour tooltip to appear
  await expect(page.getByText('Central Exposure Hub')).toBeVisible({ timeout: 10000 });

  // Check the Next button text
  // It should be exactly "Next" now
  const nextButton = page.getByRole('button', { name: 'Next' });

  await expect(nextButton).toBeVisible();
  const text = await nextButton.textContent();
  console.log(`Tour button text: "${text}"`);

  // Assert it matches the requirement
  expect(text).toBe('Next');
});
