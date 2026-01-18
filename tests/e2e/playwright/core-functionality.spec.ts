import { test, expect } from '@playwright/test';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || '', // Set in CI environment
};

test.describe('Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to workforce management', async ({ page }) => {
    // Navigate to workforce page
    await page.click('text=Workforce');
    await expect(page).toHaveURL(/.*\/workforce/);

    // Should see workforce management interface
    await expect(page.locator('text=AI Employee Marketplace')).toBeVisible();
  });

  test('should hire an AI employee from marketplace', async ({ page }) => {
    // Navigate to workforce
    await page.click('text=Workforce');
    await expect(page).toHaveURL(/.*\/workforce/);

    // Wait for AI employees to load
    await expect(
      page.locator('[data-testid="ai-employee-card"]').first()
    ).toBeVisible();

    // Click hire button on first AI employee
    await page.click(
      '[data-testid="ai-employee-card"]:first-child [data-testid="hire-button"]'
    );

    // Should show confirmation or success message
    await expect(page.locator('text=Successfully hired')).toBeVisible();
  });

  test('should start chat session with hired employee', async ({ page }) => {
    // Navigate to workforce
    await page.click('text=Workforce');
    await expect(page).toHaveURL(/.*\/workforce/);

    // Click on a hired employee to start chat
    await page.click('[data-testid="hired-employee"]:first-child');
    await expect(page).toHaveURL(/.*\/chat/);

    // Should see chat interface
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
  });

  test('should send message in chat', async ({ page }) => {
    // Navigate to chat
    await page.click('text=Chat');
    await expect(page).toHaveURL(/.*\/chat/);

    // Type and send a message
    const message = 'Hello, can you help me with a task?';
    await page.fill('[data-testid="chat-input"]', message);
    await page.click('[data-testid="send-button"]');

    // Should see the message in chat
    await expect(page.locator(`text=${message}`)).toBeVisible();
  });

  test('should handle multiple chat tabs', async ({ page }) => {
    // Navigate to chat
    await page.click('text=Chat');
    await expect(page).toHaveURL(/.*\/chat/);

    // Create new chat tab
    await page.click('[data-testid="new-chat-button"]');

    // Should see new tab
    await expect(page.locator('[data-testid="chat-tab"]').nth(1)).toBeVisible();

    // Switch between tabs
    await page.click('[data-testid="chat-tab"]:first-child');
    await page.click('[data-testid="chat-tab"]:nth-child(2)');
  });

  test('should access AI employee marketplace', async ({ page }) => {
    // Navigate to marketplace
    await page.click('text=Marketplace');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Should see marketplace content
    await expect(page.locator('text=AI Employee Marketplace')).toBeVisible();
    await expect(
      page.locator('[data-testid="ai-employee-card"]')
    ).toBeVisible();
  });

  test('should filter AI employees by category', async ({ page }) => {
    await page.click('text=Marketplace');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Click on a category filter
    await page.click('[data-testid="category-filter"]:first-child');

    // Should see filtered results
    await expect(
      page.locator('[data-testid="ai-employee-card"]')
    ).toBeVisible();
  });

  test('should view AI employee details', async ({ page }) => {
    await page.click('text=Marketplace');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Click on an AI employee card
    await page.click('[data-testid="ai-employee-card"]:first-child');

    // Should see detailed view or modal
    await expect(
      page.locator('[data-testid="employee-details"]')
    ).toBeVisible();
  });

  test('should handle dashboard navigation', async ({ page }) => {
    // Test navigation between different dashboard sections
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.click('text=Settings');
    await expect(page).toHaveURL(/.*\/settings/);

    await page.click('text=Billing');
    await expect(page).toHaveURL(/.*\/billing/);
  });

  test('should display user profile information', async ({ page }) => {
    // Click on user menu
    await page.click('[data-testid="user-menu"]');

    // Should see profile information (verify email matches test user)
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  });
});
