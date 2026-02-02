import { test, expect } from '@playwright/test';

test('Cinematic Landing Page Layout', async ({ page }) => {
  await page.goto('/');

  // Check for the "The Stage Is Yours" text
  await expect(page.getByRole('heading', { name: 'The Stage Is Yours.' })).toBeVisible();

  // Check for the description text
  await expect(page.getByText('Connect with local theater groups')).toBeVisible();

  // Check for the Login Form (Right Side / Floating Card)
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // Check that "Login" button is present in the form
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('Login Page uses Cinematic Layout', async ({ page }) => {
  await page.goto('/login');

  // Check for Cinematic content
  await expect(page.getByRole('heading', { name: 'The Stage Is Yours.' })).toBeVisible();

  // Check for Login Form
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});
