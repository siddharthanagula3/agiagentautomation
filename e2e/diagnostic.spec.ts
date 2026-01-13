import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Diagnostic Tests', () => {
  test('Check what the browser sees', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC TEST: Checking browser state');

    // Collect console messages
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Navigate to the page
    console.log('📍 Navigating to:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(5000);

    // Check what's in the DOM
    const htmlContent = await page.content();
    console.log('\n📄 HTML length:', htmlContent.length);
    console.log('📄 HTML preview:', htmlContent.substring(0, 500));

    // Check root element
    const rootExists = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        childrenCount: root?.children.length || 0,
        innerHTML: root?.innerHTML?.substring(0, 500) || 'N/A',
      };
    });
    console.log('\n🌳 Root element:', rootExists);

    // Check for loading indicators
    const loadingIndicators = await page.evaluate(() => {
      return {
        hasInitialLoader: !!document.getElementById('initial-loader'),
        hasLoadingText:
          document.body.innerText.includes('Loading') ||
          document.body.innerText.includes('Initializing'),
        bodyClasses: document.body.className,
        bodyInnerText: document.body.innerText.substring(0, 200),
      };
    });
    console.log('\n⏳ Loading state:', loadingIndicators);

    // Report console messages
    console.log('\n📝 Console messages:', consoleMessages.length);
    consoleMessages.forEach((msg) => console.log('  ', msg));

    if (consoleErrors.length > 0) {
      console.log('\n🚨 Console ERRORS:');
      consoleErrors.forEach((err) => console.log('  ', err));
    }

    if (pageErrors.length > 0) {
      console.log('\n💥 Page ERRORS:');
      pageErrors.forEach((err) => console.log('  ', err));
    }

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/diagnostic.png',
      fullPage: true,
    });
    console.log('\n📸 Screenshot saved: diagnostic.png');

    // Wait more time and check again
    console.log('\n⏳ Waiting 10 more seconds for React to mount...');
    await page.waitForTimeout(10000);

    const rootAfterWait = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        childrenCount: root?.children.length || 0,
        innerHTML: root?.innerHTML?.substring(0, 500) || 'N/A',
      };
    });
    console.log('\n🌳 Root after wait:', rootAfterWait);

    // Final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/diagnostic-after-wait.png',
      fullPage: true,
    });

    // Test should pass - this is just diagnostic
    expect(true).toBe(true);
  });

  test('Check if JavaScript files load', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC TEST: Checking JS file loading');

    const loadedScripts: string[] = [];
    const failedScripts: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.ts')) {
        if (response.ok()) {
          loadedScripts.push(url);
        } else {
          failedScripts.push(`${url} - ${response.status()}`);
        }
      }
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('.js') || url.includes('.ts')) {
        failedScripts.push(`${url} - FAILED`);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    console.log('\n✅ Loaded scripts:', loadedScripts.length);
    loadedScripts.slice(0, 10).forEach((s) => console.log('  ', s));

    if (failedScripts.length > 0) {
      console.log('\n❌ Failed scripts:');
      failedScripts.forEach((s) => console.log('  ', s));
    }

    expect(true).toBe(true);
  });

  test('Simple page load without complex checks', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC TEST: Simple page load');

    // Just go to the page and wait
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/simple-load.png',
      fullPage: true,
    });

    // Check if any visible content exists
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 0;
    });

    console.log('Has visible content:', hasContent);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    expect(true).toBe(true);
  });
});
