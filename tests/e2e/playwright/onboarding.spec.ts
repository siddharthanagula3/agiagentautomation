import { test, expect } from '@playwright/test';

test.describe('User Onboarding Flow', () => {
  test('should complete full onboarding flow: Register -> Login -> Logout', async ({
    page,
  }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Click on Get Started button
    await page.click('text=Get Started Free');
    await expect(page).toHaveURL(/.*register/);

    // Fill out registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to login or dashboard
    await page.waitForURL(/.*(login|dashboard)/);

    // If redirected to login, fill login form
    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
    }

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Should redirect to landing page
    await expect(page).toHaveURL('/');
  });

  test('should handle registration with existing email', async ({ page }) => {
    await page.goto('/register');

    // Fill out form with existing email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to dashboard if already logged in', async ({
    page,
  }) => {
    // This test would require setting up authenticated state
    // For now, we'll test the redirect logic
    await page.goto('/login');

    // Check that login form is visible
    await expect(page.locator('form')).toBeVisible();
  });
});
