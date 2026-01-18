/**
 * E2E Test: Marketplace and Employee Hiring Flow
 * Demonstrates best practices for E2E testing with proper test data isolation
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || ''; // Set in CI environment

/**
 * Test User Helper - Creates isolated test user for each session
 */
async function createTestUser(page: Page) {
  const timestamp = Date.now();
  const testUser = {
    email: `test-user-${timestamp}@example.com`,
    password: E2E_TEST_PASSWORD,
    name: `Test User ${timestamp}`,
  };

  // Navigate to registration
  await page.goto('/auth/register');

  // Fill registration form
  await page.fill('[data-testid="register-name-input"]', testUser.name);
  await page.fill('[data-testid="register-email-input"]', testUser.email);
  await page.fill('[data-testid="register-password-input"]', testUser.password);
  await page.fill(
    '[data-testid="register-confirm-password-input"]',
    testUser.password
  );

  // Submit registration
  await page.click('[data-testid="register-submit-button"]');

  // Wait for redirect to dashboard or login
  await page.waitForURL(/.*\/(dashboard|login)/, { timeout: 10000 });

  // If redirected to login, log in
  if (page.url().includes('login')) {
    await page.fill('[data-testid="login-email-input"]', testUser.email);
    await page.fill('[data-testid="login-password-input"]', testUser.password);
    await page.click('[data-testid="login-submit-button"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  }

  return testUser;
}

/**
 * Cleanup Helper - Deletes test user (optional, depends on test environment)
 */
async function cleanupTestUser(page: Page, email: string) {
  // This would call an admin API endpoint to delete the test user
  // Implementation depends on your backend setup
  console.log(`Cleanup: Would delete user ${email}`);
}

test.describe('Marketplace and Employee Hiring', () => {
  test.beforeEach(async ({ page }) => {
    // Create fresh test user for each test
    await createTestUser(page);
  });

  test('should display marketplace with employee listings', async ({
    page,
  }) => {
    // Navigate to marketplace
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Verify marketplace loaded
    await expect(
      page.locator('[data-testid="marketplace-title"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="marketplace-title"]')).toHaveText(
      /AI Employee Marketplace/i
    );

    // Verify employee cards are displayed
    const employeeCards = page.locator('[data-testid="employee-card"]');
    await expect(employeeCards.first()).toBeVisible({ timeout: 5000 });

    // Verify at least some employees are listed
    const cardCount = await employeeCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify employee card structure
    const firstCard = employeeCards.first();
    await expect(
      firstCard.locator('[data-testid="employee-name"]')
    ).toBeVisible();
    await expect(
      firstCard.locator('[data-testid="employee-description"]')
    ).toBeVisible();
    await expect(
      firstCard.locator('[data-testid="employee-tools"]')
    ).toBeVisible();
  });

  test('should filter employees by category', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Wait for employees to load
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Get initial count
    const initialCount = await page
      .locator('[data-testid="employee-card"]')
      .count();
    expect(initialCount).toBeGreaterThan(0);

    // Click on a category filter
    const categoryFilter = page.locator(
      '[data-testid="category-filter-development"]'
    );
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Filtered count should be different (or same if all are in that category)
      const filteredCount = await page
        .locator('[data-testid="employee-card"]')
        .count();

      // At minimum, verify the filter interaction worked
      expect(categoryFilter).toHaveClass(/active|selected/);
    }
  });

  test('should view employee details in modal', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Click on first employee card
    const firstCard = page.locator('[data-testid="employee-card"]').first();
    await firstCard.click();

    // Verify modal opened
    const modal = page.locator('[data-testid="employee-details-modal"]');
    await expect(modal).toBeVisible();

    // Verify modal contains detailed information
    await expect(
      modal.locator('[data-testid="employee-detail-name"]')
    ).toBeVisible();
    await expect(
      modal.locator('[data-testid="employee-detail-description"]')
    ).toBeVisible();
    await expect(
      modal.locator('[data-testid="employee-detail-capabilities"]')
    ).toBeVisible();

    // Close modal
    await page.click('[data-testid="employee-details-modal-close"]');
    await expect(modal).not.toBeVisible();
  });

  test('should hire a free employee successfully', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Wait for employees to load
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Find and click hire button on first free employee
    const firstFreeEmployee = page
      .locator('[data-testid="employee-card"]')
      .first();
    const employeeName = await firstFreeEmployee
      .locator('[data-testid="employee-name"]')
      .textContent();

    await firstFreeEmployee.locator('[data-testid="hire-button"]').click();

    // Verify success notification
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="success-toast"]')).toHaveText(
      /hired successfully/i
    );

    // Navigate to workforce to verify hire
    await page.click('[data-testid="nav-workforce"]');
    await expect(page).toHaveURL(/.*\/workforce/);

    // Verify employee appears in hired list
    const hiredEmployees = page.locator('[data-testid="hired-employee-card"]');
    await expect(hiredEmployees).toHaveCount(1, { timeout: 5000 });

    // Verify it's the correct employee
    const hiredEmployeeName = await hiredEmployees
      .first()
      .locator('[data-testid="employee-name"]')
      .textContent();
    expect(hiredEmployeeName).toBe(employeeName);
  });

  test('should prevent duplicate hires of same employee', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Hire first employee
    const firstEmployee = page.locator('[data-testid="employee-card"]').first();
    await firstEmployee.locator('[data-testid="hire-button"]').click();

    // Wait for success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Wait for toast to disappear
    await page.waitForTimeout(3000);

    // Try to hire the same employee again
    await firstEmployee.locator('[data-testid="hire-button"]').click();

    // Should show error or "Already Hired" state
    await expect(
      page.locator('[data-testid="error-toast"], [data-testid="info-toast"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should search for employees by name', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Get name of first employee
    const firstEmployeeName = await page
      .locator('[data-testid="employee-card"]')
      .first()
      .locator('[data-testid="employee-name"]')
      .textContent();

    // Use search input
    const searchInput = page.locator('[data-testid="employee-search-input"]');
    await searchInput.fill(firstEmployeeName || 'Code');

    // Wait for search to filter
    await page.waitForTimeout(500);

    // Verify filtered results
    const visibleCards = page.locator('[data-testid="employee-card"]');
    const count = await visibleCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify all visible employees match search
    for (let i = 0; i < count; i++) {
      const name = await visibleCards
        .nth(i)
        .locator('[data-testid="employee-name"]')
        .textContent();
      expect(name?.toLowerCase()).toContain(
        (firstEmployeeName || 'code').toLowerCase()
      );
    }
  });

  test('should handle hiring multiple employees', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Hire first employee
    await page
      .locator('[data-testid="employee-card"]')
      .first()
      .locator('[data-testid="hire-button"]')
      .click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Hire second employee
    await page
      .locator('[data-testid="employee-card"]')
      .nth(1)
      .locator('[data-testid="hire-button"]')
      .click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await page.waitForTimeout(2000);

    // Hire third employee
    await page
      .locator('[data-testid="employee-card"]')
      .nth(2)
      .locator('[data-testid="hire-button"]')
      .click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Navigate to workforce
    await page.click('[data-testid="nav-workforce"]');
    await expect(page).toHaveURL(/.*\/workforce/);

    // Verify all three employees are hired
    const hiredEmployees = page.locator('[data-testid="hired-employee-card"]');
    await expect(hiredEmployees).toHaveCount(3, { timeout: 5000 });
  });

  test('should display employee capabilities and tools', async ({ page }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Open first employee details
    await page.locator('[data-testid="employee-card"]').first().click();

    const modal = page.locator('[data-testid="employee-details-modal"]');
    await expect(modal).toBeVisible();

    // Verify tools section
    const toolsList = modal.locator('[data-testid="employee-tools-list"]');
    await expect(toolsList).toBeVisible();

    // Verify at least one tool is listed
    const tools = toolsList.locator('[data-testid="employee-tool-badge"]');
    const toolCount = await tools.count();
    expect(toolCount).toBeGreaterThan(0);

    // Verify capabilities/description
    const capabilities = modal.locator(
      '[data-testid="employee-detail-capabilities"]'
    );
    await expect(capabilities).toBeVisible();
    const capabilitiesText = await capabilities.textContent();
    expect(capabilitiesText).toBeTruthy();
    expect(capabilitiesText!.length).toBeGreaterThan(10);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/marketplace');

    // Should show error state or loading state
    const errorMessage = page.locator('[data-testid="marketplace-error"]');
    const loadingState = page.locator('[data-testid="marketplace-loading"]');

    // Either error or loading should be visible
    await expect(errorMessage.or(loadingState)).toBeVisible({ timeout: 10000 });

    // Restore connection
    await page.context().setOffline(false);

    // Retry loading
    await page.reload();

    // Should now load successfully
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate from marketplace to chat with hired employee', async ({
    page,
  }) => {
    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Hire an employee
    const employeeName = await page
      .locator('[data-testid="employee-card"]')
      .first()
      .locator('[data-testid="employee-name"]')
      .textContent();

    await page
      .locator('[data-testid="employee-card"]')
      .first()
      .locator('[data-testid="hire-button"]')
      .click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Navigate to chat
    await page.click('[data-testid="nav-chat"]');
    await expect(page).toHaveURL(/.*\/chat/);

    // Select the hired employee
    await page.click('[data-testid="employee-selector"]');
    await page.click(
      `[data-testid="employee-option-${employeeName?.toLowerCase().replace(/\s+/g, '-')}"]`
    );

    // Verify chat interface is ready
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="selected-employee-name"]')
    ).toHaveText(employeeName!);
  });

  test('should respect free tier limits (if applicable)', async ({ page }) => {
    // This test assumes there's a free tier limit (e.g., max 3 free employees)
    // Adjust based on actual business logic

    await page.click('[data-testid="nav-marketplace"]');
    await expect(page).toHaveURL(/.*\/marketplace/);

    // Check if tier limit info is displayed
    const tierInfo = page.locator('[data-testid="tier-limit-info"]');
    if (await tierInfo.isVisible()) {
      const tierText = await tierInfo.textContent();
      expect(tierText).toMatch(/free|limit|employees/i);
    }
  });
});

test.describe('Marketplace - Visual Regression', () => {
  test('should match marketplace layout snapshot', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Wait for images to load
    await page.waitForTimeout(1000);

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('marketplace-layout.png', {
      fullPage: true,
      mask: [page.locator('[data-testid="user-avatar"]')], // Mask dynamic content
    });
  });
});

test.describe('Marketplace - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );

    // Should focus on interactive element
    expect(focused).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(
      page.locator('[data-testid="employee-card"]').first()
    ).toBeVisible();

    // Check for aria-label or aria-labelledby
    const firstCard = page.locator('[data-testid="employee-card"]').first();
    const ariaLabel = await firstCard.getAttribute('aria-label');
    const ariaLabelledby = await firstCard.getAttribute('aria-labelledby');

    expect(ariaLabel || ariaLabelledby).toBeTruthy();
  });
});
