import { test, expect } from '@playwright/test';

test.describe('Billing and Subscription Flow', () => {
  test('should complete subscription flow: Login -> Subscribe -> Verify role update', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to billing
    await page.click('text=Billing');
    await expect(page).toHaveURL(/.*billing/);

    // Should see pricing plans
    await expect(page.locator('[data-testid="pricing-plans"]')).toBeVisible();

    // Select a plan
    const proPlan = page.locator('[data-testid="pro-plan"]');
    await expect(proPlan).toBeVisible();
    await proPlan.locator('text=Subscribe').click();

    // Should redirect to Stripe checkout or show payment form
    // Note: In a real test, you'd need to handle Stripe test mode
    await expect(page.locator('text=Payment')).toBeVisible();

    // Mock successful payment
    // In a real test, you'd use Stripe test cards
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="name"]', 'Test User');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Subscription successful')).toBeVisible();

    // Verify role update
    await page.goto('/dashboard');
    await expect(page.locator('text=Pro Plan')).toBeVisible();
  });

  test('should display current subscription status', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to billing
    await page.click('text=Billing');

    // Should show current plan
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    await expect(page.locator('text=Free Plan')).toBeVisible();
  });

  test('should allow plan cancellation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to billing
    await page.click('text=Billing');

    // Click manage subscription
    await page.click('text=Manage Subscription');

    // Should open subscription management
    await expect(page.locator('text=Cancel Subscription')).toBeVisible();
  });

  test('should show usage statistics', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to billing
    await page.click('text=Billing');

    // Should show usage stats
    await expect(page.locator('[data-testid="usage-stats"]')).toBeVisible();
    await expect(page.locator('text=AI Employees')).toBeVisible();
    await expect(page.locator('text=Tasks Completed')).toBeVisible();
  });
});
