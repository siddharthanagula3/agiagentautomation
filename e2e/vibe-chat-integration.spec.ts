/**
 * Comprehensive E2E Tests for AGI Agent Automation Platform
 * Tests /chat, /vibe, and core features
 *
 * Run with: npx playwright test e2e/vibe-chat-integration.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://agiagentautomation.com';
const TEST_USER = {
  email: 'siddharthanagula3@gmail.com',
  password: 'Sid@1234',
};

// Helper to take full page screenshots
async function captureScreenshot(page: Page, name: string) {
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

// Helper to wait for navigation
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra buffer for dynamic content
}

test.describe('AGI Agent Automation - Complete Platform Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for tests
    test.setTimeout(120000); // 2 minutes per test
  });

  test('1. Landing Page - Verify all sections load', async ({ page }) => {
    console.log('\n🧪 TEST 1: Landing Page');

    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    await captureScreenshot(page, '01-landing-page');

    // Verify page title
    await expect(page).toHaveTitle(/AGI Agent Automation/i);

    // Verify key sections exist
    const heroSection = page.locator('h1, [class*="hero"]').first();
    await expect(heroSection).toBeVisible();

    console.log('✅ Landing page loaded successfully');
  });

  test('2. Login Flow - Authenticate user', async ({ page }) => {
    console.log('\n🧪 TEST 2: Login Flow');

    await page.goto(`${BASE_URL}/login`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '02-login-page');

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await captureScreenshot(page, '03-login-filled');

    // Click login button
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|home|chat|vibe|mission-control)/, { timeout: 15000 });
    await waitForPageLoad(page);
    await captureScreenshot(page, '04-after-login');

    console.log(`✅ Login successful - Redirected to: ${page.url()}`);
  });

  test('3. Dashboard - Verify user dashboard loads', async ({ page }) => {
    console.log('\n🧪 TEST 3: Dashboard');

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();

    // Wait for successful authentication and redirect
    await page.waitForURL(/\/(dashboard|home|chat|vibe|mission-control)/, { timeout: 15000 });
    await waitForPageLoad(page);

    // If not already on dashboard, navigate there
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`);
      await waitForPageLoad(page);
    }

    await captureScreenshot(page, '05-dashboard');

    // Verify we're on dashboard (not login page)
    expect(page.url()).toContain('/dashboard');

    // Check for any text content (more flexible than specific h1/h2)
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome|Overview/i, { timeout: 10000 });

    console.log('✅ Dashboard loaded successfully');
  });

  test('4. Chat Interface - Test chat functionality', async ({ page }) => {
    console.log('\n🧪 TEST 4: Chat Interface (/chat)');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Navigate to chat
    await page.goto(`${BASE_URL}/chat`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '06-chat-interface');

    // Check for chat input
    const chatInput = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="type" i], [contenteditable="true"]').first();

    if (await chatInput.isVisible()) {
      console.log('✅ Chat input found');

      // Type a test message
      await chatInput.fill('Hello! This is an automated test. Can you help me understand your capabilities?');
      await captureScreenshot(page, '07-chat-message-typed');

      // Try to find and click send button
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has([class*="send" i])').first();

      if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sendButton.click();
        console.log('✅ Message sent');

        // Wait for response
        await page.waitForTimeout(3000);
        await captureScreenshot(page, '08-chat-after-send');

        // Check if messages appear
        const messageList = page.locator('[class*="message"], [class*="chat"]');
        const messageCount = await messageList.count();
        console.log(`📊 Messages visible: ${messageCount}`);
      } else {
        console.log('⚠️ Send button not found - chat may use different submission method');
      }
    } else {
      console.log('⚠️ Chat input not immediately visible - may need employee selection first');
      await captureScreenshot(page, '06b-chat-no-input');
    }

    console.log('✅ Chat interface test completed');
  });

  test('5. VIBE Interface - Test multi-agent workspace', async ({ page }) => {
    console.log('\n🧪 TEST 5: VIBE Interface (/vibe)');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Navigate to VIBE
    await page.goto(`${BASE_URL}/vibe`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '09-vibe-interface');

    // Check for VIBE-specific elements
    const vibeLayout = page.locator('[class*="vibe"], [class*="agent"], [class*="workspace"]').first();

    if (await vibeLayout.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ VIBE workspace loaded');

      // Look for agent panel
      const agentPanel = page.locator('[class*="agent-panel"], [class*="agent-status"]').first();
      if (await agentPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Agent panel visible');
        await captureScreenshot(page, '10-vibe-agent-panel');
      }

      // Look for editor/output views
      const editorView = page.locator('[class*="editor"], [class*="monaco"]').first();
      if (await editorView.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Editor view visible');
        await captureScreenshot(page, '11-vibe-editor');
      }

      // Look for message input
      const vibeInput = page.locator('textarea, input[placeholder*="message" i]').first();
      if (await vibeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ VIBE input found');

        // Type a test message
        await vibeInput.fill('Build me a simple React counter component');
        await captureScreenshot(page, '12-vibe-message-typed');

        // Try to send
        const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
        if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sendButton.click();
          console.log('✅ VIBE message sent');

          // Wait for agent response
          await page.waitForTimeout(5000);
          await captureScreenshot(page, '13-vibe-after-send');
        }
      }
    } else {
      console.log('⚠️ VIBE workspace not immediately visible');

      // Check if redirected to workforce (no agents hired)
      if (page.url().includes('/workforce')) {
        console.log('ℹ️ Redirected to workforce - may need to hire agents first');
        await captureScreenshot(page, '09b-vibe-redirect-workforce');
      }
    }

    console.log('✅ VIBE interface test completed');
  });

  test('6. Employee Marketplace - Browse AI employees', async ({ page }) => {
    console.log('\n🧪 TEST 6: Employee Marketplace');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Navigate to marketplace
    await page.goto(`${BASE_URL}/marketplace`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '14-marketplace');

    // Check for employee cards
    const employeeCards = page.locator('[class*="employee"], [class*="card"]');
    const cardCount = await employeeCards.count();
    console.log(`📊 Employee cards found: ${cardCount}`);

    if (cardCount > 0) {
      console.log('✅ Marketplace loaded with employees');

      // Scroll to see more
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);
      await captureScreenshot(page, '15-marketplace-scrolled');
    } else {
      console.log('⚠️ No employee cards found');
    }

    console.log('✅ Marketplace test completed');
  });

  test('7. Mission Control - Test orchestration dashboard', async ({ page }) => {
    console.log('\n🧪 TEST 7: Mission Control');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Navigate to mission control
    await page.goto(`${BASE_URL}/mission-control`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '16-mission-control');

    // Check for mission control elements
    const missionLayout = page.locator('[class*="mission"], [class*="orchestrat"]').first();

    if (await missionLayout.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Mission Control loaded');

      // Look for activity log
      const activityLog = page.locator('[class*="activity"], [class*="log"]').first();
      if (await activityLog.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Activity log visible');
      }

      // Look for employee panel
      const employeePanel = page.locator('[class*="employee"], [class*="status"]').first();
      if (await employeePanel.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Employee panel visible');
      }
    } else {
      console.log('⚠️ Mission Control not immediately visible');
    }

    console.log('✅ Mission Control test completed');
  });

  test('8. Settings - User settings page', async ({ page }) => {
    console.log('\n🧪 TEST 8: Settings');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    await waitForPageLoad(page);
    await captureScreenshot(page, '17-settings');

    // Verify settings page elements
    const settingsHeading = page.locator('h1, h2').first();
    if (await settingsHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Settings page loaded');
    }

    console.log('✅ Settings test completed');
  });

  test('9. Navigation - Test main navigation links', async ({ page }) => {
    console.log('\n🧪 TEST 9: Navigation');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });
    await waitForPageLoad(page);

    // Capture main nav
    await captureScreenshot(page, '18-main-navigation');

    // Find navigation links
    const navLinks = page.locator('nav a, [class*="nav"] a, [class*="sidebar"] a');
    const linkCount = await navLinks.count();
    console.log(`📊 Navigation links found: ${linkCount}`);

    // Test a few key links
    const testLinks = ['Dashboard', 'Chat', 'VIBE', 'Marketplace', 'Mission Control'];

    for (const linkText of testLinks) {
      const link = page.locator(`a:has-text("${linkText}")`).first();
      if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`✅ Link found: ${linkText}`);
      } else {
        console.log(`⚠️ Link not found: ${linkText}`);
      }
    }

    console.log('✅ Navigation test completed');
  });

  test('10. Responsiveness - Test mobile viewport', async ({ page }) => {
    console.log('\n🧪 TEST 10: Responsiveness');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    await waitForPageLoad(page);
    await captureScreenshot(page, '19-mobile-view');

    // Test mobile navigation
    const hamburger = page.locator('button[class*="hamburger"], button[class*="menu"], [class*="mobile-menu"]').first();
    if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Mobile menu button found');
      await hamburger.click();
      await page.waitForTimeout(500);
      await captureScreenshot(page, '20-mobile-menu-open');
    }

    console.log('✅ Responsiveness test completed');
  });
});

test.describe('Bug Detection Tests', () => {
  test('BUG CHECK: Console errors during navigation', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: Console Errors');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Login and navigate
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Visit key pages
    const pages = ['/dashboard', '/chat', '/vibe', '/marketplace'];
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await waitForPageLoad(page);
    }

    // Report findings
    console.log('\n📊 CONSOLE ERROR REPORT:');
    console.log(`❌ Errors found: ${errors.length}`);
    console.log(`⚠️ Warnings found: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n🟡 WARNINGS:');
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`${i + 1}. ${warn.substring(0, 200)}`);
      });
    }
  });

  test('BUG CHECK: Failed network requests', async ({ page }) => {
    console.log('\n🐛 BUG CHECK: Network Requests');

    const failedRequests: any[] = [];

    // Capture failed requests
    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
      });
    });

    // Login and navigate
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\//, { timeout: 15000 });

    // Visit key pages
    const pages = ['/dashboard', '/chat', '/vibe'];
    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await waitForPageLoad(page);
    }

    // Report findings
    console.log('\n📊 NETWORK REQUEST REPORT:');
    console.log(`❌ Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n🔴 FAILED REQUESTS:');
      failedRequests.slice(0, 10).forEach((req, i) => {
        console.log(`${i + 1}. [${req.method}] ${req.url}`);
        console.log(`   Error: ${req.failure}`);
      });
    }
  });
});
