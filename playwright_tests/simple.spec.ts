import { test, expect } from '@playwright/test';

test('should load the homepage', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('http://localhost:5173');
  
  // Check if the page loads
  await expect(page).toHaveTitle(/AGI Agent Automation/);
  
  // Check for basic elements
  await expect(page.locator('text=Sign In')).toBeVisible();
  await expect(page.locator('text=Sign Up')).toBeVisible();
});

test('should navigate to login page', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Click on Sign In
  await page.click('text=Sign In');
  
  // Should navigate to login page
  await expect(page).toHaveURL(/.*\/auth\/login/);
  
  // Check for login form elements
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});
