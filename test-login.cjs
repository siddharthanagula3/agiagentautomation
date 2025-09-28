
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting Login Test...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🏠 Navigating to login page...');
    await page.goto('http://localhost:5173/auth/login', { waitUntil: 'networkidle2' });
    console.log('✅ Login page loaded.');

    // Test with incorrect credentials
    console.log('🧪 Testing with incorrect credentials...');
    await page.type('input[name="email"]', 'wrong@example.com');
    await page.type('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for error message...');
    await page.waitForSelector('.text-red-500', { timeout: 5000 });
    const errorMessage = await page.$eval('.text-red-500', el => el.textContent);
    if (errorMessage) {
      console.log(`✅ Incorrect credentials test passed. Error message: "${errorMessage}"`);
    } else {
      console.error('❌ Incorrect credentials test failed. No error message displayed.');
    }

    // Clear the form
    await page.evaluate(() => {
      document.querySelector('input[name="email"]').value = '';
      document.querySelector('input[name="password"]').value = '';
    });

    // Test with correct credentials
    console.log('🧪 Testing with correct (demo) credentials...');
    await page.type('input[name="email"]', 'demo@example.com');
    await page.type('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const url = page.url();
    if (url.includes('/dashboard')) {
      console.log('✅ Correct credentials test passed. Navigated to dashboard.');
    } else {
      console.error(`❌ Correct credentials test failed. Unexpected URL: ${url}`);
    }

  } catch (error) {
    console.error('❌ An error occurred during the test:', error);
  } finally {
    await browser.close();
    console.log('🧹 Browser closed.');
  }
})();
