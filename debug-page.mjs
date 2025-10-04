import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  console.log('Navigating to login page...');
  await page.goto('http://localhost:8080/auth/login', {
    waitUntil: 'networkidle2'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Take a screenshot
  await page.screenshot({ path: 'login-page.png', fullPage: true });
  console.log('Screenshot saved to login-page.png');

  // Get page content
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());

  // Check for specific elements
  const emailInput = await page.$('#email');
  const passwordInput = await page.$('#password');
  const submitButton = await page.$('button[type="submit"]');
  const forgotLink = await page.$('a[href="/auth/forgot-password"]');

  console.log('Email input found:', !!emailInput);
  console.log('Password input found:', !!passwordInput);
  console.log('Submit button found:', !!submitButton);
  console.log('Forgot password link found:', !!forgotLink);

  // Keep browser open
  console.log('\\nBrowser will stay open for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  await browser.close();
})();
