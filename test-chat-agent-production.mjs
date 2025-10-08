/**
 * Puppeteer Production Test - Chat Agent Page
 * Tests the /chat-agent page on agiagentautomation.com
 */

import puppeteer from 'puppeteer';

const TEST_URL = 'https://agiagentautomation.com/chat-agent';
const TIMEOUT = 30000;

async function testChatAgentPage() {
  console.log('🚀 Starting Chat Agent Page Production Test...\n');
  
  let browser;
  const results = {
    pageLoad: false,
    noErrors: false,
    noWarnings: false,
    consoleMessages: [],
    errors: [],
    warnings: [],
    networkErrors: [],
  };

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      
      results.consoleMessages.push({
        type,
        text,
        timestamp: new Date().toISOString(),
      });

      if (type === 'error') {
        results.errors.push(text);
        console.error(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        results.warnings.push(text);
        console.warn(`⚠️  Console Warning: ${text}`);
      } else if (type === 'log') {
        console.log(`📝 Console Log: ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      results.errors.push(error.message);
      console.error(`❌ Page Error: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      const failure = `${request.url()} - ${request.failure()?.errorText}`;
      results.networkErrors.push(failure);
      console.error(`❌ Network Error: ${failure}`);
    });

    // Navigate to chat-agent page
    console.log(`\n🔍 Navigating to ${TEST_URL}...`);
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT,
    });

    // Check response status
    const status = response.status();
    console.log(`📡 Response Status: ${status}`);
    
    if (status === 200) {
      results.pageLoad = true;
      console.log('✅ Page loaded successfully');
    } else {
      console.error(`❌ Page load failed with status ${status}`);
    }

    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for specific elements
    console.log('\n🔍 Checking page elements...');
    
    const checks = {
      rootElement: await page.$('body'),
      reactRoot: await page.$('#root'),
      hasContent: await page.evaluate(() => document.body.innerText.length > 0),
    };

    console.log('📦 Root element:', checks.rootElement ? '✅ Found' : '❌ Missing');
    console.log('⚛️  React root:', checks.reactRoot ? '✅ Found' : '❌ Missing');
    console.log('📄 Has content:', checks.hasContent ? '✅ Yes' : '❌ No');

    // Get page title
    const title = await page.title();
    console.log(`📑 Page Title: "${title}"`);

    // Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: 'chat-agent-production-test.png',
      fullPage: false,
    });
    console.log('✅ Screenshot saved: chat-agent-production-test.png');

    // Get page HTML (first 500 chars)
    const html = await page.content();
    console.log(`\n📄 Page HTML (first 500 chars):\n${html.substring(0, 500)}...`);

    // Check for common error messages in page content
    const pageText = await page.evaluate(() => document.body.innerText);
    const errorKeywords = ['error', 'failed', 'not found', '404', '500', 'something went wrong'];
    const foundErrors = errorKeywords.filter(keyword => 
      pageText.toLowerCase().includes(keyword)
    );
    
    if (foundErrors.length > 0) {
      console.log(`\n⚠️  Found error keywords in page: ${foundErrors.join(', ')}`);
    }

    // Wait a bit more to catch any delayed errors
    console.log('\n⏱️  Waiting for any delayed errors...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Page Load: ${results.pageLoad ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📝 Console Messages: ${results.consoleMessages.length}`);
    console.log(`❌ Errors Found: ${results.errors.length}`);
    console.log(`⚠️  Warnings Found: ${results.warnings.length}`);
    console.log(`🌐 Network Errors: ${results.networkErrors.length}`);

    if (results.errors.length === 0 && results.networkErrors.length === 0) {
      results.noErrors = true;
      console.log('\n🎉 NO ERRORS FOUND! Page is working correctly!');
    } else {
      console.log('\n❌ ERRORS DETECTED - See details above');
    }

    if (results.warnings.length === 0) {
      results.noWarnings = true;
      console.log('✅ NO WARNINGS FOUND!');
    } else {
      console.log(`⚠️  ${results.warnings.length} warnings detected`);
    }

    console.log('='.repeat(60));

    // Save detailed results to JSON
    const fs = await import('fs');
    fs.writeFileSync(
      'chat-agent-test-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n💾 Detailed results saved to: chat-agent-test-results.json');

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH EXCEPTION:');
    console.error(error);
    results.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }

  // Exit with appropriate code
  const exitCode = results.noErrors && results.pageLoad ? 0 : 1;
  console.log(`\n👋 Test complete. Exit code: ${exitCode}\n`);
  process.exit(exitCode);
}

// Run the test
testChatAgentPage();

