import puppeteer from 'puppeteer';
import { TEST_CONFIG } from './test-config.js';
import { login } from './test-utils.js';

async function testLogin() {
  console.log('🧪 Quick Login Test');
  console.log('====================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`Testing credentials: ${TEST_CONFIG.credentials.email}`);
    console.log(`URL: ${TEST_CONFIG.baseURL}/login\n`);

    const result = await login(
      page,
      TEST_CONFIG.credentials.email,
      TEST_CONFIG.credentials.password
    );

    console.log('\n📊 Result:');
    console.log(`Success: ${result.success}`);
    console.log(`Current URL: ${result.currentURL}`);
    console.log(`Error: ${result.error || 'None'}`);

    // Take screenshot for debugging
    await page.screenshot({ path: './tests/screenshots/login-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved to: tests/screenshots/login-debug.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLogin();
