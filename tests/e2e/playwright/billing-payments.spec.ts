import { test, expect } from '@playwright/test';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || '', // Set in CI environment
};

test.describe('Billing & Payments', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to pricing page', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');
    await expect(page).toHaveURL(/.*\/pricing/);

    // Should see pricing plans
    await expect(page.locator('text=Pay Per Employee')).toBeVisible();
    await expect(page.locator('text=All Access')).toBeVisible();
  });

  test('should select a pricing plan', async ({ page }) => {
    await page.goto('/pricing');

    // Click on a pricing plan
    await page.click(
      '[data-testid="pricing-plan"]:first-child [data-testid="select-plan-button"]'
    );

    // Should redirect to Stripe checkout or show subscription form
    // Note: In test environment, this might redirect to a test page
    await expect(page).toHaveURL(/.*\/checkout|.*\/subscribe/, {
      timeout: 10000,
    });
  });

  test('should access billing management', async ({ page }) => {
    // Navigate to billing page
    await page.click('text=Billing');
    await expect(page).toHaveURL(/.*\/billing/);

    // Should see billing information
    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('text=Usage')).toBeVisible();
  });

  test('should manage billing through customer portal', async ({ page }) => {
    await page.goto('/billing');

    // Click manage billing button
    await page.click('[data-testid="manage-billing-button"]');

    // Should redirect to Stripe customer portal
    // Note: In test environment, this might redirect to a test page
    await expect(page).toHaveURL(/.*\/portal|.*\/billing/, { timeout: 10000 });
  });

  test('should view subscription status', async ({ page }) => {
    await page.goto('/billing');

    // Should see current subscription status
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toBeVisible();
  });

  test('should view usage statistics', async ({ page }) => {
    await page.goto('/billing');

    // Should see usage information
    await expect(page.locator('[data-testid="usage-stats"]')).toBeVisible();
    await expect(page.locator('text=API Calls')).toBeVisible();
    await expect(page.locator('text=Storage')).toBeVisible();
  });

  test('should handle subscription upgrade', async ({ page }) => {
    await page.goto('/billing');

    // Click upgrade button if available
    const upgradeButton = page.locator('[data-testid="upgrade-button"]');
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await expect(page).toHaveURL(/.*\/pricing/, { timeout: 5000 });
    }
  });

  test('should handle subscription cancellation', async ({ page }) => {
    await page.goto('/billing');

    // Click cancel subscription button if available
    const cancelButton = page.locator(
      '[data-testid="cancel-subscription-button"]'
    );
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should show confirmation dialog
      await expect(
        page.locator('[data-testid="cancel-confirmation"]')
      ).toBeVisible();
    }
  });

  test('should display payment history', async ({ page }) => {
    await page.goto('/billing');

    // Should see payment history section
    await expect(page.locator('text=Payment History')).toBeVisible();
    await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
  });

  test('should handle payment method management', async ({ page }) => {
    await page.goto('/billing');

    // Click manage payment methods
    const paymentMethodsButton = page.locator(
      '[data-testid="payment-methods-button"]'
    );
    if (await paymentMethodsButton.isVisible()) {
      await paymentMethodsButton.click();

      // Should redirect to payment methods management
      await expect(page).toHaveURL(/.*\/payment-methods/, { timeout: 5000 });
    }
  });

  test('should show billing notifications', async ({ page }) => {
    await page.goto('/billing');

    // Check for any billing-related notifications
    const notifications = page.locator('[data-testid="billing-notification"]');
    if ((await notifications.count()) > 0) {
      await expect(notifications.first()).toBeVisible();
    }
  });

  test('should handle free tier limitations', async ({ page }) => {
    // If user is on free tier, test limitations
    await page.goto('/workforce');

    // Try to hire more employees than free tier allows
    const hireButtons = page.locator('[data-testid="hire-button"]');
    const buttonCount = await hireButtons.count();

    if (buttonCount > 0) {
      // Click hire button
      await hireButtons.first().click();

      // Should either hire successfully or show upgrade prompt
      const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
      const successMessage = page.locator('[data-testid="hire-success"]');

      await expect(upgradePrompt.or(successMessage)).toBeVisible();
    }
  });
});
