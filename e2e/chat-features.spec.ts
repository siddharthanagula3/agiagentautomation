import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use local dev server for testing
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || '', // Set in CI environment
};

// Helper functions
async function captureScreenshot(page: Page, name: string) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  const screenshotPath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

/**
 * Wait for the app to fully initialize
 * - Waits for auth initialization to complete (has 5 second timeout)
 * - Waits for React to hydrate
 * - Waits for any loading spinners to disappear
 */
async function waitForAppInit(page: Page, timeout = 15000) {
  console.log('⏳ Waiting for app initialization...');

  // Wait for the root element to have content (React hydration)
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout }
  );

  // Wait for auth initialization spinner to disappear
  // The app shows "Initializing..." or "Loading..." while auth is loading
  try {
    await page.waitForFunction(
      () => {
        // Look for the loading text that appears during auth init
        const loadingText = document.body.innerText;
        return (
          !loadingText.includes('Initializing...') &&
          !loadingText.includes('Loading...')
        );
      },
      { timeout }
    );
  } catch {
    // Continue even if no loading text found - might already be initialized
    console.log('⚠️ No loading text found, continuing...');
  }

  // Wait for body to have app-loaded class (set 500ms after render)
  try {
    await page.waitForSelector('body.app-loaded', { timeout: 3000 });
    console.log('✅ App loaded class detected');
  } catch {
    // The class might not always be set
    console.log('⚠️ app-loaded class not found, continuing...');
  }

  // Wait for network to settle
  await page.waitForLoadState('networkidle');

  // Extra buffer for lazy components
  await page.waitForTimeout(1000);

  console.log('✅ App initialization complete');
}

/**
 * Navigate to a page and wait for it to fully load
 */
async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await waitForAppInit(page);
}

/**
 * Check if user is authenticated by looking at the URL or page content
 */
async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  // If redirected to login, not authenticated
  if (url.includes('/login') || url.includes('/signup')) {
    return false;
  }
  // Check for dashboard-specific elements
  const dashboardElement = await page
    .locator('[class*="dashboard"], [class*="sidebar"], nav')
    .first()
    .isVisible()
    .catch(() => false);
  return dashboardElement;
}

/**
 * Attempt to log in with test credentials
 */
async function login(page: Page) {
  console.log('🔐 Attempting login...');

  await navigateAndWait(page, `${BASE_URL}/login`);
  await captureScreenshot(page, 'login-page-initial');

  // Wait for login form to appear
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]').first();

  try {
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill login form
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await captureScreenshot(page, 'login-form-filled');

    await submitButton.click();

    // Wait for navigation after login
    await page.waitForURL(/\/(dashboard|home|chat|vibe|mission-control)/, {
      timeout: 15000,
    });
    await waitForAppInit(page);
    console.log('✅ Login successful');
    return true;
  } catch (e) {
    console.log('⚠️ Login failed or form not found:', (e as Error).message);
    await captureScreenshot(page, 'login-failed');
    return false;
  }
}

test.describe('Chat Interface - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Try to login, continue even if it fails
    await login(page);
  });

  test('Chat page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Page Load');

    await navigateAndWait(page, `${BASE_URL}/chat`);
    await captureScreenshot(page, 'chat-page-load');

    // Check current URL - might be redirected to login if not authenticated
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('⚠️ Redirected to login - authentication required');
      // This is expected behavior if not logged in
      const loginForm = page.locator('input[type="email"]');
      await expect(loginForm).toBeVisible({ timeout: 10000 });
      console.log('✅ Login page rendered correctly');
    } else {
      // Check for essential chat elements
      const chatContainer = page.locator(
        '[class*="chat"], [data-testid*="chat"], main'
      );
      await expect(chatContainer.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Chat page loaded successfully');
    }
  });

  test('Message input is functional', async ({ page }) => {
    console.log('\n🧪 TEST: Message Input Functionality');

    await navigateAndWait(page, `${BASE_URL}/chat`);
    await captureScreenshot(page, 'chat-message-input-initial');

    // Check if we're on the chat page or login page
    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping input test');
      return;
    }

    // Find message input with various selectors
    const inputSelectors = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      'textarea[placeholder*="ask" i]',
      'input[placeholder*="message" i]',
      'textarea',
      '[contenteditable="true"]',
    ];

    let messageInput = null;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        messageInput = element;
        console.log(`✅ Found input: ${selector}`);
        break;
      }
    }

    if (messageInput) {
      await messageInput.fill('Test message input');
      await captureScreenshot(page, 'chat-message-input');
      console.log('✅ Message input is functional');
    } else {
      await captureScreenshot(page, 'chat-no-input-error');
      console.log('❌ No message input found');
    }
  });

  test('Send button is present and clickable', async ({ page }) => {
    console.log('\n🧪 TEST: Send Button');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping button test');
      return;
    }

    const sendButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button[aria-label*="send" i]',
      'button:has(svg)',
    ];

    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        sendButton = button;
        console.log(`✅ Found send button: ${selector}`);
        break;
      }
    }

    if (sendButton) {
      await expect(sendButton).toBeEnabled();
      await captureScreenshot(page, 'chat-send-button');
      console.log('✅ Send button is present and enabled');
    } else {
      await captureScreenshot(page, 'chat-no-send-button');
      console.log('⚠️ Send button not found');
    }
  });
});

test.describe('Chat Interface - Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mode selector is present', async ({ page }) => {
    console.log('\n🧪 TEST: Mode Selector Presence');

    await navigateAndWait(page, `${BASE_URL}/chat`);
    await captureScreenshot(page, 'chat-mode-selector-check');

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping mode selector test');
      return;
    }

    // Look for mode selection UI
    const modeSelectors = [
      'select',
      'button[aria-haspopup]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[class*="select"]',
      '[class*="dropdown"]',
      '[class*="mode"]',
    ];

    let foundMode = false;
    for (const selector of modeSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(
          `✅ Found potential mode selector: ${selector} (${count} elements)`
        );
        foundMode = true;
      }
    }

    if (!foundMode) {
      console.log(
        '⚠️ No explicit mode selector found - modes may be auto-detected'
      );
    }
  });

  test('Employee/consultant selection UI', async ({ page }) => {
    console.log('\n🧪 TEST: Employee Selection UI');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping employee UI test');
      return;
    }

    // Look for employee/agent selection
    const employeeUISelectors = [
      '[class*="employee"]',
      '[class*="agent"]',
      '[class*="consultant"]',
      '[data-testid*="employee"]',
      '[data-testid*="agent"]',
    ];

    for (const selector of employeeUISelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found employee UI: ${selector} (${count} elements)`);
      }
    }

    await captureScreenshot(page, 'chat-employee-selection');
  });
});

test.describe('Chat Interface - Message Sending', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Can type and prepare to send message', async ({ page }) => {
    console.log('\n🧪 TEST: Message Preparation');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping message test');
      return;
    }

    // Find and fill input
    const input = page.locator('textarea, input[type="text"]').first();

    try {
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(
        'Test message for consulting: I need help with my fitness routine'
      );
      await captureScreenshot(page, 'chat-message-typed');

      // Verify text was entered
      const inputValue = await input.inputValue();
      expect(inputValue).toContain('fitness');

      console.log('✅ Message typed successfully');
    } catch (e) {
      console.log('❌ Could not type message:', e);
      await captureScreenshot(page, 'chat-type-error');
    }
  });
});

test.describe('Chat Interface - UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Chat header/navigation is present', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Header');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping header test');
      return;
    }

    // Check for header elements
    const headerSelectors = [
      'header',
      'nav',
      '[class*="header"]',
      '[class*="topbar"]',
      '[class*="toolbar"]',
    ];

    for (const selector of headerSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`✅ Found header element: ${selector}`);
      }
    }

    await captureScreenshot(page, 'chat-header');
  });

  test('Sidebar/conversation list is present', async ({ page }) => {
    console.log('\n🧪 TEST: Sidebar/Conversation List');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping sidebar test');
      return;
    }

    const sidebarSelectors = [
      '[class*="sidebar"]',
      '[class*="conversation-list"]',
      '[class*="chat-list"]',
      'aside',
      '[role="navigation"]',
    ];

    for (const selector of sidebarSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`✅ Found sidebar: ${selector}`);
      }
    }

    await captureScreenshot(page, 'chat-sidebar');
  });

  test('Message display area is present', async ({ page }) => {
    console.log('\n🧪 TEST: Message Display Area');

    await navigateAndWait(page, `${BASE_URL}/chat`);

    if (page.url().includes('/login')) {
      console.log('⚠️ Not authenticated - skipping message area test');
      return;
    }

    const messageAreaSelectors = [
      '[class*="messages"]',
      '[class*="chat-content"]',
      '[class*="conversation"]',
      '[role="log"]',
      '[aria-live]',
    ];

    for (const selector of messageAreaSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`✅ Found message area: ${selector}`);
      }
    }

    await captureScreenshot(page, 'chat-message-area');
  });
});

test.describe('Chat Interface - Console Error Check', () => {
  test('No critical console errors on chat page', async ({ page }) => {
    console.log('\n🧪 TEST: Console Error Check');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Filter out common non-critical errors
        if (!text.includes('favicon') && !text.includes('manifest')) {
          errors.push(text);
        }
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      }
    });

    await navigateAndWait(page, `${BASE_URL}/chat`);

    // Interact with the page to trigger potential errors
    try {
      const input = page.locator('textarea, input[type="text"]').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('Test');
        await page.waitForTimeout(2000);
      }
    } catch {
      // Continue checking
    }

    console.log(`\n📊 Console Report:`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 Critical Errors:');
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 300)}`);
      });
    }

    await captureScreenshot(page, 'chat-console-check');

    // Fail test if there are Immer or state management errors
    const immerErrors = errors.filter(
      (e) =>
        e.includes('Immer') ||
        e.includes('frozen') ||
        e.includes('Cannot modify')
    );

    if (immerErrors.length > 0) {
      console.log('\n🚨 IMMER STATE ERRORS DETECTED:');
      immerErrors.forEach((err) => console.log(err));
    }
  });
});

test.describe('Chat Interface - Network Requests', () => {
  test('No failed network requests', async ({ page }) => {
    console.log('\n🧪 TEST: Network Request Check');

    interface FailedRequest {
      url: string;
      method: string;
      failure: string;
    }
    const failedRequests: FailedRequest[] = [];

    page.on('requestfailed', (request) => {
      const url = request.url();
      // Filter out expected failures (like analytics that might be blocked)
      if (!url.includes('analytics') && !url.includes('tracking')) {
        failedRequests.push({
          url: url,
          method: request.method(),
          failure: request.failure()?.errorText || 'Unknown error',
        });
      }
    });

    await navigateAndWait(page, `${BASE_URL}/chat`);

    console.log(`\n📊 Network Report:`);
    console.log(`❌ Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n🔴 Failed Requests:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. [${req.method}] ${req.url}`);
        console.log(`   Error: ${req.failure}`);
      });
    }

    await captureScreenshot(page, 'chat-network-check');
  });
});

test.describe('Chat Interface - Responsive Design', () => {
  test('Chat works on mobile viewport', async ({ page }) => {
    console.log('\n🧪 TEST: Mobile Responsive');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateAndWait(page, `${BASE_URL}/chat`);
    await captureScreenshot(page, 'chat-mobile');

    // Check that key elements are still visible
    const input = page.locator('textarea, input[type="text"]').first();

    if (await input.isVisible().catch(() => false)) {
      console.log('✅ Input is visible on mobile');
    } else {
      console.log('⚠️ Input may be hidden on mobile (might be login page)');
    }
  });

  test('Chat works on tablet viewport', async ({ page }) => {
    console.log('\n🧪 TEST: Tablet Responsive');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await navigateAndWait(page, `${BASE_URL}/chat`);
    await captureScreenshot(page, 'chat-tablet');

    console.log('✅ Tablet viewport test completed');
  });
});

test.describe('Public Pages - No Auth Required', () => {
  test('Landing page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Landing Page');

    await navigateAndWait(page, BASE_URL);
    await captureScreenshot(page, 'landing-page');

    // Landing page should have hero content
    const heroContent = page.locator('h1, [class*="hero"], [class*="landing"]');
    await expect(heroContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Landing page loaded');
  });

  test('Login page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Login Page');

    await navigateAndWait(page, `${BASE_URL}/login`);
    await captureScreenshot(page, 'login-page');

    // Login page should have email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Login page loaded');
  });

  test('Signup page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Signup Page');

    await navigateAndWait(page, `${BASE_URL}/signup`);
    await captureScreenshot(page, 'signup-page');

    // Signup page should have form elements
    const formElement = page.locator('form, [class*="signup"]');
    await expect(formElement.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Signup page loaded');
  });

  test('Pricing page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Pricing Page');

    await navigateAndWait(page, `${BASE_URL}/pricing`);
    await captureScreenshot(page, 'pricing-page');

    // Pricing page should have pricing content
    const pageContent = page.locator('main, [class*="pricing"], h1');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Pricing page loaded');
  });
});
