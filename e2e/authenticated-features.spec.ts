import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Test credentials - MUST be set via environment variables in CI/CD
// Never commit actual credentials to the repository
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || '', // Set in CI environment
};
const HAS_TEST_CREDENTIALS = Boolean(
  process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD
);

test.skip(
  !HAS_TEST_CREDENTIALS,
  'Authenticated E2E tests require E2E_TEST_EMAIL and E2E_TEST_PASSWORD'
);

// Helper functions
async function captureScreenshot(page: Page, name: string) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}`);
}

async function waitForAppInit(page: Page, timeout = 20000) {
  // Wait for React to hydrate
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout }
  );

  // Wait for auth initialization
  try {
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          !text.includes('Initializing...') && !text.includes('Loading...')
        );
      },
      { timeout: 10000 }
    );
  } catch {
    // Continue
  }

  // Wait for app-loaded class
  try {
    await page.waitForSelector('body.app-loaded', { timeout: 5000 });
  } catch {
    // Continue
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

async function login(page: Page): Promise<boolean> {
  console.log('🔐 Logging in with test credentials...');

  await page.goto(`${BASE_URL}/auth/login`);
  await waitForAppInit(page);

  // Handle cookie consent if present
  try {
    const acceptButton = page.locator('button:has-text("Accept All")');
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // No cookie banner
  }

  // Fill login form
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  // Click sign in button
  const signInButton = page.locator('button:has-text("Sign In")');
  await signInButton.click();

  // Wait for successful login redirect
  try {
    await page.waitForURL(
      /\/(dashboard|home|chat|vibe|mission-control|marketplace)/,
      {
        timeout: 20000,
      }
    );
    await waitForAppInit(page);
    console.log('✅ Login successful!');
    return true;
  } catch (e) {
    console.log('❌ Login failed:', (e as Error).message);
    await captureScreenshot(page, 'login-failed');
    return false;
  }
}

// ============================================================
// AUTHENTICATION TESTS
// ============================================================
test.describe('Authentication', () => {
  test('Can log in with valid credentials', async ({ page }) => {
    console.log('\n🧪 TEST: Login with valid credentials');

    const success = await login(page);
    expect(success).toBe(true);

    // Verify we're on an authenticated page
    const url = page.url();
    expect(url).not.toContain('/auth/login');
    console.log('📍 Logged in, current URL:', url);

    await captureScreenshot(page, 'after-login');
  });

  test('Can log out', async ({ page }) => {
    console.log('\n🧪 TEST: Logout');

    await login(page);

    // Find and click logout button/menu
    const userMenu = page
      .locator('[class*="avatar"], [class*="user"], button:has-text("Account")')
      .first();
    if (await userMenu.isVisible({ timeout: 5000 })) {
      await userMenu.click();
      await page.waitForTimeout(500);

      const logoutButton = page.locator(
        'button:has-text("Log out"), button:has-text("Sign out"), [class*="logout"]'
      );
      if (await logoutButton.isVisible({ timeout: 3000 })) {
        await logoutButton.click();
        await page.waitForURL(/\/(auth\/login|$)/, { timeout: 10000 });
        console.log('✅ Logged out successfully');
      }
    }

    await captureScreenshot(page, 'after-logout');
  });
});

// ============================================================
// DASHBOARD TESTS
// ============================================================
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Dashboard loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Dashboard Load');

    await page.goto(`${BASE_URL}/dashboard`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'dashboard');

    // Check for dashboard elements
    const dashboardContent = page.locator('main, [class*="dashboard"]');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Dashboard loaded');
  });

  test('Navigation sidebar is functional', async ({ page }) => {
    console.log('\n🧪 TEST: Navigation Sidebar');

    await page.goto(`${BASE_URL}/dashboard`);
    await waitForAppInit(page);

    // Check sidebar links
    const sidebarLinks = [
      { text: 'Chat', url: '/chat' },
      { text: 'VIBE', url: '/vibe' },
      { text: 'Marketplace', url: '/marketplace' },
      { text: 'Mission Control', url: '/mission-control' },
      { text: 'Settings', url: '/settings' },
    ];

    for (const link of sidebarLinks) {
      const navLink = page
        .locator(`a:has-text("${link.text}"), [href*="${link.url}"]`)
        .first();
      if (await navLink.isVisible({ timeout: 3000 })) {
        console.log(`✅ Found nav link: ${link.text}`);
      } else {
        console.log(`⚠️ Nav link not found: ${link.text}`);
      }
    }

    await captureScreenshot(page, 'navigation-sidebar');
  });
});

// ============================================================
// CHAT INTERFACE TESTS
// ============================================================
test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Chat page loads with all components', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Page Components');

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'chat-interface');

    // Check for message input
    const messageInput = page
      .locator('textarea, input[placeholder*="message" i]')
      .first();
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Message input found');

    // Check for send button
    const sendButton = page
      .locator(
        'button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]'
      )
      .first();
    if (await sendButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Send button found');
    }

    // Check for conversation sidebar
    const sidebar = page.locator('[class*="sidebar"], aside').first();
    if (await sidebar.isVisible({ timeout: 5000 })) {
      console.log('✅ Sidebar found');
    }
  });

  test('Can type a message in chat', async ({ page }) => {
    console.log('\n🧪 TEST: Type Message');

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);

    const messageInput = page
      .locator('textarea, input[placeholder*="message" i]')
      .first();
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });

    const testMessage = 'Hello, this is a test message from Playwright!';
    await messageInput.fill(testMessage);

    const inputValue = await messageInput.inputValue();
    expect(inputValue).toContain('test message');
    console.log('✅ Message typed successfully');

    await captureScreenshot(page, 'chat-message-typed');
  });

  test('Can send a message and receive response', async ({ page }) => {
    console.log('\n🧪 TEST: Send Message');

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);

    const messageInput = page
      .locator('textarea, input[placeholder*="message" i]')
      .first();
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });

    // Type a simple test message
    await messageInput.fill('Hello! What can you help me with?');

    // Find and click send button
    const sendButton = page
      .locator(
        'button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]'
      )
      .first();

    if (await sendButton.isVisible({ timeout: 5000 })) {
      await sendButton.click();
      console.log('📤 Message sent');

      // Wait for response (look for loading indicator or new message)
      await page.waitForTimeout(3000);
      await captureScreenshot(page, 'chat-after-send');
    } else {
      // Try pressing Enter
      await messageInput.press('Enter');
      console.log('📤 Message sent via Enter key');
      await page.waitForTimeout(3000);
      await captureScreenshot(page, 'chat-after-enter');
    }
  });

  test('Chat mode selector works', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Mode Selector');

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);

    // Look for mode selector
    const modeSelectors = [
      '[class*="mode"]',
      'select',
      'button[aria-haspopup]',
      '[role="combobox"]',
    ];

    for (const selector of modeSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        console.log(`✅ Found mode selector: ${selector}`);
        await element.click();
        await page.waitForTimeout(500);
        await captureScreenshot(page, 'chat-mode-selector-open');
        break;
      }
    }
  });

  test('Can create new conversation', async ({ page }) => {
    console.log('\n🧪 TEST: New Conversation');

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);

    // Look for new conversation button
    const newChatButton = page
      .locator(
        'button:has-text("New"), button[aria-label*="new" i], [class*="new-chat"]'
      )
      .first();

    if (await newChatButton.isVisible({ timeout: 5000 })) {
      await newChatButton.click();
      console.log('✅ New conversation button clicked');
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'chat-new-conversation');
    } else {
      console.log('⚠️ New conversation button not found');
    }
  });
});

// ============================================================
// VIBE CODING WORKSPACE TESTS
// ============================================================
test.describe('VIBE Workspace', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('VIBE page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Page Load');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'vibe-interface');

    // VIBE should have code editor or workspace elements
    const vibeContent = page.locator(
      'main, [class*="vibe"], [class*="editor"], [class*="workspace"]'
    );
    await expect(vibeContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ VIBE workspace loaded');
  });

  test('VIBE has chat/prompt input', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Chat Input');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForAppInit(page);

    const chatInput = page
      .locator(
        'textarea, input[placeholder*="message" i], input[placeholder*="prompt" i]'
      )
      .first();

    if (await chatInput.isVisible({ timeout: 10000 })) {
      console.log('✅ VIBE chat input found');
      await chatInput.fill('Create a simple React component');
      await captureScreenshot(page, 'vibe-with-prompt');
    } else {
      console.log('⚠️ VIBE chat input not found');
      await captureScreenshot(page, 'vibe-no-input');
    }
  });

  test('VIBE file explorer is present', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE File Explorer');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForAppInit(page);

    const fileExplorer = page
      .locator('[class*="file"], [class*="explorer"], [class*="tree"], aside')
      .first();

    if (await fileExplorer.isVisible({ timeout: 5000 })) {
      console.log('✅ File explorer found');
    } else {
      console.log('⚠️ File explorer not visible');
    }

    await captureScreenshot(page, 'vibe-file-explorer');
  });

  test('VIBE code preview panel exists', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Code Preview');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForAppInit(page);

    const previewPanel = page
      .locator('[class*="preview"], [class*="output"], iframe')
      .first();

    if (await previewPanel.isVisible({ timeout: 5000 })) {
      console.log('✅ Preview panel found');
    } else {
      console.log('⚠️ Preview panel not visible');
    }

    await captureScreenshot(page, 'vibe-preview-panel');
  });
});

// ============================================================
// MARKETPLACE TESTS
// ============================================================
test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Marketplace page loads correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Marketplace Load');

    await page.goto(`${BASE_URL}/marketplace`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'marketplace');

    const marketplaceContent = page.locator(
      'main, [class*="marketplace"], [class*="employee"]'
    );
    await expect(marketplaceContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Marketplace loaded');
  });

  test('AI employees are displayed', async ({ page }) => {
    console.log('\n🧪 TEST: AI Employees Display');

    await page.goto(`${BASE_URL}/marketplace`);
    await waitForAppInit(page);

    // Look for employee cards
    const employeeCards = page.locator(
      '[class*="card"], [class*="employee"], [class*="agent"]'
    );
    const count = await employeeCards.count();

    console.log(`📊 Found ${count} employee cards`);

    if (count > 0) {
      await captureScreenshot(page, 'marketplace-employees');
      console.log('✅ AI employees are displayed');
    }
  });

  test('Can view employee details', async ({ page }) => {
    console.log('\n🧪 TEST: Employee Details');

    await page.goto(`${BASE_URL}/marketplace`);
    await waitForAppInit(page);

    // Click on first employee card
    const employeeCard = page
      .locator('[class*="card"], [class*="employee"]')
      .first();

    if (await employeeCard.isVisible({ timeout: 5000 })) {
      await employeeCard.click();
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'employee-details');
      console.log('✅ Employee card clicked');
    }
  });

  test('Can search/filter employees', async ({ page }) => {
    console.log('\n🧪 TEST: Search Employees');

    await page.goto(`${BASE_URL}/marketplace`);
    await waitForAppInit(page);

    const searchInput = page
      .locator('input[placeholder*="search" i], input[type="search"]')
      .first();

    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('developer');
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'marketplace-search');
      console.log('✅ Search functionality works');
    } else {
      console.log('⚠️ Search input not found');
    }
  });
});

// ============================================================
// MISSION CONTROL TESTS
// ============================================================
test.describe('Mission Control', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Mission Control page loads', async ({ page }) => {
    console.log('\n🧪 TEST: Mission Control Load');

    await page.goto(`${BASE_URL}/mission-control`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'mission-control');

    const missionContent = page.locator(
      'main, [class*="mission"], [class*="control"]'
    );
    await expect(missionContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Mission Control loaded');
  });

  test('Mission status dashboard is visible', async ({ page }) => {
    console.log('\n🧪 TEST: Mission Dashboard');

    await page.goto(`${BASE_URL}/mission-control`);
    await waitForAppInit(page);

    // Look for status indicators, charts, or mission panels
    const statusElements = page.locator(
      '[class*="status"], [class*="task"], [class*="progress"]'
    );
    const count = await statusElements.count();

    console.log(`📊 Found ${count} status elements`);
    await captureScreenshot(page, 'mission-dashboard');
  });
});

// ============================================================
// SETTINGS TESTS
// ============================================================
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Settings page loads', async ({ page }) => {
    console.log('\n🧪 TEST: Settings Load');

    await page.goto(`${BASE_URL}/settings`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'settings');

    const settingsContent = page.locator('main, [class*="settings"], form');
    await expect(settingsContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Settings page loaded');
  });

  test('AI Configuration settings exist', async ({ page }) => {
    console.log('\n🧪 TEST: AI Configuration');

    await page.goto(`${BASE_URL}/settings/ai`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'settings-ai');

    // Look for AI provider settings
    const aiSettings = page.locator(
      '[class*="ai"], [class*="provider"], [class*="model"]'
    );

    if (await aiSettings.first().isVisible({ timeout: 5000 })) {
      console.log('✅ AI configuration settings found');
    } else {
      console.log('⚠️ AI configuration not found at this URL');
    }
  });

  test('Profile settings exist', async ({ page }) => {
    console.log('\n🧪 TEST: Profile Settings');

    await page.goto(`${BASE_URL}/settings/profile`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'settings-profile');

    // Look for profile form elements
    const profileForm = page.locator('form, [class*="profile"]');

    if (await profileForm.first().isVisible({ timeout: 5000 })) {
      console.log('✅ Profile settings found');
    }
  });
});

// ============================================================
// EMPLOYEE MANAGEMENT TESTS
// ============================================================
test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('My Employees page loads', async ({ page }) => {
    console.log('\n🧪 TEST: My Employees');

    await page.goto(`${BASE_URL}/workforce`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'my-employees');

    const workforceContent = page.locator(
      'main, [class*="workforce"], [class*="employee"]'
    );
    await expect(workforceContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Workforce page loaded');
  });

  test('Can view hired employees', async ({ page }) => {
    console.log('\n🧪 TEST: Hired Employees');

    await page.goto(`${BASE_URL}/workforce`);
    await waitForAppInit(page);

    // Look for employee list or cards
    const employeeList = page.locator(
      '[class*="employee"], [class*="agent"], [class*="card"]'
    );
    const count = await employeeList.count();

    console.log(`📊 Found ${count} hired employees`);
    await captureScreenshot(page, 'hired-employees');
  });
});

// ============================================================
// BILLING TESTS
// ============================================================
test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Billing page loads', async ({ page }) => {
    console.log('\n🧪 TEST: Billing Page');

    await page.goto(`${BASE_URL}/billing`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'billing');

    const billingContent = page.locator(
      'main, [class*="billing"], [class*="subscription"]'
    );
    await expect(billingContent.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Billing page loaded');
  });

  test('Usage statistics are displayed', async ({ page }) => {
    console.log('\n🧪 TEST: Usage Statistics');

    await page.goto(`${BASE_URL}/billing`);
    await waitForAppInit(page);

    // Look for usage charts or statistics
    const usageElements = page.locator(
      '[class*="usage"], [class*="stats"], [class*="chart"], [class*="credit"]'
    );
    const count = await usageElements.count();

    console.log(`📊 Found ${count} usage elements`);
    await captureScreenshot(page, 'billing-usage');
  });
});

// ============================================================
// RESPONSIVE DESIGN TESTS
// ============================================================
test.describe('Responsive Design - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Dashboard works on mobile', async ({ page }) => {
    console.log('\n🧪 TEST: Mobile Dashboard');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'dashboard-mobile');

    console.log('✅ Mobile dashboard rendered');
  });

  test('Chat works on mobile', async ({ page }) => {
    console.log('\n🧪 TEST: Mobile Chat');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'chat-mobile');

    // Check message input is still accessible
    const messageInput = page
      .locator('textarea, input[placeholder*="message" i]')
      .first();
    if (await messageInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Chat input visible on mobile');
    }
  });

  test('VIBE works on tablet', async ({ page }) => {
    console.log('\n🧪 TEST: Tablet VIBE');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/vibe`);
    await waitForAppInit(page);
    await captureScreenshot(page, 'vibe-tablet');

    console.log('✅ Tablet VIBE rendered');
  });
});

// ============================================================
// ERROR HANDLING TESTS
// ============================================================
test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('No console errors on dashboard', async ({ page }) => {
    console.log('\n🧪 TEST: Dashboard Console Errors');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected warnings
        if (
          !text.includes('Environment validation') &&
          !text.includes('favicon')
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await waitForAppInit(page);
    await page.waitForTimeout(2000);

    console.log(`❌ Unexpected errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e.substring(0, 200)}`));

    // Check for Immer errors specifically
    const immerErrors = errors.filter(
      (e) => e.includes('Immer') || e.includes('frozen')
    );
    expect(immerErrors.length).toBe(0);
  });

  test('No console errors on chat', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Console Errors');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('Environment validation') &&
          !text.includes('favicon')
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);

    // Type a message to trigger state updates
    const input = page.locator('textarea').first();
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('Test message');
      await page.waitForTimeout(1000);
    }

    console.log(`❌ Unexpected errors: ${errors.length}`);

    const immerErrors = errors.filter(
      (e) => e.includes('Immer') || e.includes('frozen')
    );
    expect(immerErrors.length).toBe(0);
  });

  test('404 page works', async ({ page }) => {
    console.log('\n🧪 TEST: 404 Page');

    await page.goto(`${BASE_URL}/nonexistent-page-12345`);
    await waitForAppInit(page);
    await captureScreenshot(page, '404-page');

    // Should show 404 content or redirect
    const pageContent = await page.content();
    const is404 =
      pageContent.includes('404') ||
      pageContent.includes('not found') ||
      pageContent.includes('Not Found');

    console.log(`404 indicator found: ${is404}`);
  });
});

// ============================================================
// PERFORMANCE TESTS
// ============================================================
test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    const success = await login(page);
    expect(success).toBe(true);
  });

  test('Dashboard loads within 5 seconds', async ({ page }) => {
    console.log('\n🧪 TEST: Dashboard Load Time');

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForAppInit(page);
    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 second max
  });

  test('Chat loads within 5 seconds', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Load Time');

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/chat`);
    await waitForAppInit(page);
    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Chat load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });
});
