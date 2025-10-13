import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'siddharthanagula3@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Sid@1234';

// Smoke billing page loads in production (no real purchase)
test('Billing page loads for authenticated user (production)', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  const loginBtn = page.getByRole('button', { name: /log in|sign in/i });
  if (await loginBtn.isVisible()) await loginBtn.click();

  await page.waitForURL(/dashboard|marketplace|chat/i, { timeout: 20000 });

  await page.goto('/dashboard/billing');
  await expect(page).toHaveURL(/billing/);
  // Check that key billing container exists
  const section = page.locator('text=Billing');
  await expect(section).toBeVisible({ timeout: 10000 });
});


