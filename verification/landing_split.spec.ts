import { test, expect } from '@playwright/test';

test('Landing Page Split Layout', async ({ page }) => {
  await page.goto('/');

  // Check for the "Your Stage, Connected" text (Left Pane)
  await expect(page.getByText('Your Stage,')).toBeVisible();
  await expect(page.getByText('Connected')).toBeVisible();

  // Check for the Login Form (Right Pane)
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  // Use getByRole for input fields to be precise
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  // Password is not a textbox, it's generic or password role (not standard role)
  // Usually inputs with type="password" don't have a role, so we use getByLabel but filter
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // Check that "Login" button is present in the form
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('Login Page uses Split Layout', async ({ page }) => {
  await page.goto('/login');

  // Check for Left Pane content
  await expect(page.getByText('Your Stage,')).toBeVisible();

  // Check for Login Form
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});
