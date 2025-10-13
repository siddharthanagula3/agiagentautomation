import { test, expect } from '@playwright/test';

test.describe('Core User Journey', () => {
  test('should complete core loop: Login -> Hire Agent -> Start Chat', async ({
    page,
  }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to marketplace
    await page.click('text=Marketplace');
    await expect(page).toHaveURL(/.*marketplace/);

    // Find and hire an AI employee
    const firstEmployee = page.locator('[data-testid="employee-card"]').first();
    await expect(firstEmployee).toBeVisible();

    // Click hire button
    await firstEmployee.locator('text=Hire Free').click();

    // Should show success message
    await expect(
      page.locator('text=AI Employee hired successfully')
    ).toBeVisible();

    // Navigate to chat
    await page.click('text=Chat');
    await expect(page).toHaveURL(/.*chat/);

    // Should see chat interface
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('should display hired employees in workforce page', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to workforce
    await page.click('text=Workforce');
    await expect(page).toHaveURL(/.*workforce/);

    // Should see hired employees
    await expect(page.locator('[data-testid="hired-employees"]')).toBeVisible();
  });

  test('should allow starting chat with hired employee', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to chat
    await page.click('text=Chat');
    await expect(page).toHaveURL(/.*chat/);

    // Select an employee to chat with
    const employeeSelector = page.locator('[data-testid="employee-selector"]');
    await employeeSelector.click();

    const firstEmployee = page
      .locator('[data-testid="employee-option"]')
      .first();
    await firstEmployee.click();

    // Should see chat interface with selected employee
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
  });
});
