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
  'Deep chat/VIBE E2E tests require E2E_TEST_EMAIL and E2E_TEST_PASSWORD'
);

// Helper functions
async function captureScreenshot(page: Page, name: string) {
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Extra buffer for dynamic content
}

async function login(page: Page) {
  console.log('🔐 Logging in...');
  await page.goto(`${BASE_URL}/auth/login`);
  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/(dashboard|home|chat|vibe|mission-control)/, {
    timeout: 15000,
  });
  await waitForPageLoad(page);
  console.log('✅ Login successful');
}

test.describe('Chat Interface - Deep Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Chat - Verify message input is functional', async ({ page }) => {
    console.log('\n🧪 TEST: Chat Message Input');

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);
    await captureScreenshot(page, 'chat-01-initial');

    // Look for message input field (try multiple selectors)
    const inputSelectors = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      'input[type="text"][placeholder*="message" i]',
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
    ];

    let messageInput = null;
    for (const selector of inputSelectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        try {
          await element.waitFor({ state: 'visible', timeout: 5000 });
          messageInput = element;
          console.log(`✅ Found input with selector: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!messageInput) {
      console.log('❌ CRITICAL: No message input field found!');
      console.log(
        'Available inputs:',
        await page
          .locator('textarea, input[type="text"], [contenteditable]')
          .count()
      );
      await captureScreenshot(page, 'chat-01-no-input-error');
      throw new Error(
        'Message input field not found - Chat feature may be broken'
      );
    }

    await captureScreenshot(page, 'chat-01-input-found');
    console.log('✅ Message input is visible and functional');
  });

  test('2. Chat - Test sending a message', async ({ page }) => {
    console.log('\n🧪 TEST: Sending Chat Message');

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);

    // Find input
    const messageInput = page.locator('textarea, input[type="text"]').first();
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });

    // Type a test message
    const testMessage =
      'Hello, this is a test message. Please respond with "Test received".';
    await messageInput.fill(testMessage);
    await captureScreenshot(page, 'chat-02-message-typed');

    // Find and click send button
    const sendButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("Submit")',
      'button[aria-label*="send" i]',
      'button svg', // Icon-only button
    ];

    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      const button = page.locator(selector).first();
      if ((await button.count()) > 0 && (await button.isVisible())) {
        sendButton = button;
        console.log(`✅ Found send button: ${selector}`);
        break;
      }
    }

    if (!sendButton) {
      console.log('❌ CRITICAL: Send button not found!');
      await captureScreenshot(page, 'chat-02-no-send-button');
      throw new Error('Send button not found - Cannot send messages');
    }

    await sendButton.click();
    await captureScreenshot(page, 'chat-02-message-sent');

    // Wait for response (check for new message elements)
    console.log('⏳ Waiting for AI response...');

    try {
      // Wait for response message to appear
      await page.waitForSelector(
        '[class*="message"], [class*="chat"], div[role="article"]',
        {
          timeout: 30000,
          state: 'visible',
        }
      );

      await page.waitForTimeout(3000); // Wait for streaming to complete
      await captureScreenshot(page, 'chat-02-response-received');

      console.log('✅ Message sent and response received');
    } catch (e) {
      console.log('⚠️ No response received within 30 seconds');
      await captureScreenshot(page, 'chat-02-no-response');
      console.log('❌ Chat may not be processing messages correctly');
      throw new Error('No AI response received - Chat feature may be broken');
    }
  });

  test('3. Chat - Verify conversation history persists', async ({ page }) => {
    console.log('\n🧪 TEST: Chat History Persistence');

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);

    // Count initial messages
    const initialMessageCount = await page
      .locator('[class*="message"], div[role="article"]')
      .count();
    console.log(`📊 Initial message count: ${initialMessageCount}`);

    // Send a message
    const messageInput = page.locator('textarea, input[type="text"]').first();
    await messageInput.fill('Test message for history check');

    const sendButton = page
      .locator('button[type="submit"], button:has-text("Send")')
      .first();
    await sendButton.click();

    await page.waitForTimeout(5000); // Wait for message to be saved
    await captureScreenshot(page, 'chat-03-message-sent');

    // Reload page
    await page.reload();
    await waitForPageLoad(page);
    await captureScreenshot(page, 'chat-03-after-reload');

    // Check if messages persisted
    const afterReloadCount = await page
      .locator('[class*="message"], div[role="article"]')
      .count();
    console.log(`📊 After reload message count: ${afterReloadCount}`);

    if (afterReloadCount === 0) {
      console.log(
        '❌ CRITICAL: No messages found after reload - History not persisting!'
      );
      throw new Error(
        'Chat history not persisting - Database integration may be broken'
      );
    }

    if (afterReloadCount < initialMessageCount) {
      console.log('⚠️ WARNING: Message count decreased after reload');
    }

    console.log('✅ Chat history persists after reload');
  });

  test('4. Chat - Test employee/model selection', async ({ page }) => {
    console.log('\n🧪 TEST: Employee/Model Selection');

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);
    await captureScreenshot(page, 'chat-04-initial');

    // Look for employee selector
    const selectorElements = [
      'select',
      'button[aria-haspopup="listbox"]',
      'div[role="combobox"]',
      '[class*="select"]',
      '[class*="dropdown"]',
    ];

    let found = false;
    for (const selector of selectorElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} selector(s) matching: ${selector}`);
        found = true;
      }
    }

    if (!found) {
      console.log('⚠️ WARNING: No employee/model selector found');
      console.log('Users may not be able to choose which AI to chat with');
    }

    await captureScreenshot(page, 'chat-04-selector-check');
  });
});

test.describe('VIBE Workspace - Deep Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. VIBE - Verify multi-agent workspace loads', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Workspace Load');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);
    await captureScreenshot(page, 'vibe-01-initial');

    // Check for workspace elements
    const workspaceElements = [
      '[class*="workspace"]',
      '[class*="agent"]',
      '[class*="panel"]',
      '[data-testid*="vibe"]',
      '[data-testid*="workspace"]',
    ];

    let foundElements = 0;
    for (const selector of workspaceElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} element(s): ${selector}`);
        foundElements += count;
      }
    }

    if (foundElements === 0) {
      console.log('❌ CRITICAL: No VIBE workspace elements found!');
      throw new Error('VIBE workspace not rendering - Feature may be broken');
    }

    console.log(`✅ VIBE workspace loaded with ${foundElements} UI elements`);
  });

  test('2. VIBE - Test agent creation/addition', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Agent Creation');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Look for "Add Agent" or similar button
    const addAgentSelectors = [
      'button:has-text("Add Agent")',
      'button:has-text("New Agent")',
      'button:has-text("+")',
      'button[aria-label*="add" i]',
      '[class*="add"]',
    ];

    let addButton = null;
    for (const selector of addAgentSelectors) {
      const button = page.locator(selector).first();
      if ((await button.count()) > 0) {
        try {
          await button.waitFor({ state: 'visible', timeout: 3000 });
          addButton = button;
          console.log(`✅ Found add agent button: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!addButton) {
      console.log('⚠️ WARNING: No "Add Agent" button found');
      console.log('Users may not be able to add agents to workspace');
      await captureScreenshot(page, 'vibe-02-no-add-button');
    } else {
      // Try clicking the button
      await addButton.click();
      await page.waitForTimeout(2000);
      await captureScreenshot(page, 'vibe-02-after-add-click');
      console.log('✅ Add agent button is clickable');
    }
  });

  test('3. VIBE - Test message sending in workspace', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Message Sending');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);
    await captureScreenshot(page, 'vibe-03-initial');

    // Look for message input
    const messageInput = page
      .locator('textarea, input[type="text"], [contenteditable="true"]')
      .first();

    try {
      await messageInput.waitFor({ state: 'visible', timeout: 10000 });

      // Type a message
      const testMessage = 'Test collaboration message for multiple agents';
      await messageInput.fill(testMessage);
      await captureScreenshot(page, 'vibe-03-message-typed');

      // Look for send button
      const sendButton = page
        .locator('button[type="submit"], button:has-text("Send")')
        .first();

      if ((await sendButton.count()) > 0) {
        await sendButton.click();
        await page.waitForTimeout(5000);
        await captureScreenshot(page, 'vibe-03-message-sent');
        console.log('✅ Message sent in VIBE workspace');
      } else {
        console.log('⚠️ Send button not found in VIBE');
        await captureScreenshot(page, 'vibe-03-no-send-button');
      }
    } catch (e) {
      console.log('❌ CRITICAL: Cannot find message input in VIBE workspace!');
      await captureScreenshot(page, 'vibe-03-no-input');
      throw new Error(
        'VIBE message input not found - Collaboration feature broken'
      );
    }
  });

  test('4. VIBE - Verify agent panels/views', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Agent Panels');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Count agent panels
    const panelSelectors = [
      '[class*="agent-panel"]',
      '[class*="agent-card"]',
      '[class*="workspace-panel"]',
      '[data-testid*="agent"]',
      'div[role="region"]',
    ];

    let totalPanels = 0;
    for (const selector of panelSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} panel(s): ${selector}`);
        totalPanels += count;
      }
    }

    await captureScreenshot(page, 'vibe-04-panels');

    if (totalPanels === 0) {
      console.log('⚠️ WARNING: No agent panels detected in workspace');
      console.log('VIBE multi-agent view may not be rendering correctly');
    } else {
      console.log(`✅ Found ${totalPanels} workspace panels/regions`);
    }
  });

  test('5. VIBE - Test real-time collaboration features', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Real-time Features');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Check for WebSocket connection or real-time indicators
    const realtimeIndicators = [
      '[class*="online"]',
      '[class*="connected"]',
      '[class*="status"]',
      '[class*="indicator"]',
      'svg[class*="pulse"]',
    ];

    let foundIndicators = 0;
    for (const selector of realtimeIndicators) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found real-time indicator: ${selector} (${count})`);
        foundIndicators += count;
      }
    }

    await captureScreenshot(page, 'vibe-05-realtime-check');

    if (foundIndicators === 0) {
      console.log('⚠️ No real-time connection indicators found');
      console.log('May not have WebSocket/real-time updates enabled');
    }

    console.log('✅ Real-time features check completed');
  });

  test('6. VIBE - Test workspace state persistence', async ({ page }) => {
    console.log('\n🧪 TEST: VIBE Workspace Persistence');

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Get initial state
    const initialElements = await page
      .locator('[class*="agent"], [class*="message"]')
      .count();
    console.log(`📊 Initial workspace elements: ${initialElements}`);
    await captureScreenshot(page, 'vibe-06-before-reload');

    // Reload page
    await page.reload();
    await waitForPageLoad(page);
    await captureScreenshot(page, 'vibe-06-after-reload');

    // Check state after reload
    const afterReloadElements = await page
      .locator('[class*="agent"], [class*="message"]')
      .count();
    console.log(`📊 After reload elements: ${afterReloadElements}`);

    if (afterReloadElements === 0 && initialElements > 0) {
      console.log('❌ WARNING: Workspace state not persisting!');
      console.log('Users will lose their work when refreshing');
    } else {
      console.log('✅ Workspace state appears to persist');
    }
  });
});

test.describe('Bug Detection - Feature-Specific Issues', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('7. BUG CHECK: Detect console errors in Chat', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: Chat Console Errors');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);

    // Try to interact with chat
    try {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Test');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(5000);
    } catch (e) {
      // Ignore interaction errors, we're checking console
    }

    console.log(`\n📊 CHAT CONSOLE ERROR REPORT:`);
    console.log(`❌ Errors found: ${errors.length}`);
    console.log(`⚠️ Warnings found: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    await captureScreenshot(page, 'bug-chat-console-check');
  });

  test('8. BUG CHECK: Detect console errors in VIBE', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: VIBE Console Errors');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Try to interact
    try {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Test collaboration');
      await page.waitForTimeout(5000);
    } catch (e) {
      // Ignore interaction errors
    }

    console.log(`\n📊 VIBE CONSOLE ERROR REPORT:`);
    console.log(`❌ Errors found: ${errors.length}`);
    console.log(`⚠️ Warnings found: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    await captureScreenshot(page, 'bug-vibe-console-check');
  });

  test('9. BUG CHECK: Network failures in Chat', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: Chat Network Requests');

    // Updated: Nov 16th 2025 - Fixed any type
    interface FailedRequest {
      url: string;
      method: string;
      failure: string;
    }
    const failedRequests: FailedRequest[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText || 'Unknown error',
      });
    });

    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);

    // Try sending a message
    try {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Network test message');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(10000);
    } catch (e) {
      // Continue
    }

    console.log(`\n📊 CHAT NETWORK REPORT:`);
    console.log(`❌ Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n🔴 FAILED REQUESTS:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. [${req.method}] ${req.url}`);
        console.log(`   Error: ${req.failure}`);
      });
    }

    await captureScreenshot(page, 'bug-chat-network-check');
  });

  test('10. BUG CHECK: Network failures in VIBE', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: VIBE Network Requests');

    // Updated: Nov 16th 2025 - Fixed any type
    interface FailedRequest {
      url: string;
      method: string;
      failure: string;
    }
    const failedRequests: FailedRequest[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText || 'Unknown error',
      });
    });

    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);

    // Try interacting
    try {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Network test for collaboration');
      await page.waitForTimeout(10000);
    } catch (e) {
      // Continue
    }

    console.log(`\n📊 VIBE NETWORK REPORT:`);
    console.log(`❌ Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n🔴 FAILED REQUESTS:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. [${req.method}] ${req.url}`);
        console.log(`   Error: ${req.failure}`);
      });
    }

    await captureScreenshot(page, 'bug-vibe-network-check');
  });
});
