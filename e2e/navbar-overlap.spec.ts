import { test, expect } from '@playwright/test';

test('navbar search bar layout check', async ({ page }) => {
  // Set viewport to 1024x768 (lg breakpoint start)
  // After fix, Desktop Search Bar should be HIDDEN.
  await page.setViewportSize({ width: 1024, height: 768 });

  await page.goto('/about');

  const navbar = page.locator('nav').first();
  const logo = navbar.locator('a', { hasText: 'StageLink' }).first();
  const searchBar = navbar.getByPlaceholder('Search...');

  // Verify Logo is visible
  await expect(logo).toBeVisible();

  // Verify Desktop Search Bar is HIDDEN
  // getByPlaceholder might match the one in Mobile Dialog too?
  // Mobile Dialog is rendered but closed?
  // If Mobile Search Bar uses `Button` then `Dialog`, the Input might not be in DOM or hidden.
  // BUT the test failure before showed 2 inputs.
  // If variant="mobile", it renders Button + Dialog.
  // If Dialog is closed, Input is not visible.

  // So on 1024px (lg):
  // Desktop SearchBar (xl:block) -> HIDDEN (class hidden).
  // Mobile SearchBar (xl:hidden) -> VISIBLE (class NOT hidden).
  // Mobile SearchBar renders BUTTON.

  // So NO Input should be visible.

  // We can check count.
  const visibleInputs = searchBar.locator('visible=true');
  await expect(visibleInputs).toHaveCount(0);

  console.log('--- 1024px: Verified Search Input is HIDDEN ---');

  // Verify Mobile Search Icon is VISIBLE
  // It is inside a button.
  // We can look for the button with Search icon?
  // Or just check if there is a button that opens search.
  // SearchBar.tsx: <Button ...><Search .../></Button>
  // We can locate the Search icon.
  const searchIcon = navbar.locator('button svg.lucide-search');
  await expect(searchIcon).toBeVisible();
  console.log('--- 1024px: Verified Mobile Search Icon is VISIBLE ---');
  await page.screenshot({ path: 'verification_navbar_1024px.png' });
});

test('navbar search bar should be visible on xl screens', async ({ page }) => {
  // Set viewport to 1280x800 (xl breakpoint start)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/about');

  const navbar = page.locator('nav').first();
  const searchBar = navbar.getByPlaceholder('Search...');

  // Verify Desktop Search Bar is VISIBLE
  await expect(searchBar).toBeVisible();

  // Verify NO Overlap with Logo
  const logo = navbar.locator('a', { hasText: 'StageLink' }).first();
  const logoBox = await logo.boundingBox();
  const searchBox = await searchBar.boundingBox();

  if (logoBox && searchBox) {
      const overlap = (searchBox.x < logoBox.x + logoBox.width) &&
                      (searchBox.x + searchBox.width > logoBox.x);
      console.log('--- 1280px ---');
      console.log('Logo Box:', logoBox);
      console.log('Search Box:', searchBox);
      console.log('Overlap:', overlap);
      expect(overlap).toBe(false);
  }
  await page.screenshot({ path: 'verification_navbar_1280px.png' });
});
