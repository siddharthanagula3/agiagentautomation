import { test, expect } from '@playwright/test';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || '', // Set in CI environment
};

test.describe('User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should handle registration with invalid email', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Fill form with invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should handle password mismatch', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should complete login flow', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Fill login form with test credentials from environment
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Fill form with invalid credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should complete logout flow', async ({ page }) => {
    // First login with test credentials from environment
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Should redirect to home page
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Click forgot password link
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);

    // Fill email for password reset (use test user email)
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});
