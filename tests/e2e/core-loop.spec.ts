import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'siddharthanagula3@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Sid@1234';

test('Login -> Hire Agent -> Start Chat (production)', async ({ page }) => {
  // Go to home
  await page.goto('/');
  await expect(page).toHaveTitle(/AGI/i);

  // Navigate to login
  await page.getByRole('link', { name: /dashboard/i }).click({ trial: true }).catch(() => {});
  await page.goto('/auth/login');

  // Login
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  const loginBtn = page.getByRole('button', { name: /log in|sign in/i });
  if (await loginBtn.isVisible()) await loginBtn.click();

  // Wait for dashboard marker
  await page.waitForURL(/dashboard|marketplace|chat/i, { timeout: 20000 });

  // Go to marketplace
  await page.goto('/marketplace');
  await expect(page).toHaveURL(/marketplace/);

  // Click first Hire Now (free)
  const hireButtons = page.getByRole('button', { name: /hire now/i });
  const count = await hireButtons.count();
  expect(count).toBeGreaterThan(0);
  await hireButtons.first().click();

  // Expect redirect to chat
  await page.waitForURL(/chat/, { timeout: 15000 });
  await expect(page).toHaveURL(/chat/);
});


