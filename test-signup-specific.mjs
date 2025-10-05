/**
 * Quick signup test with specific credentials
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:8081';
const TEST_USER = {
  name: 'Siddhartha Nagula',
  email: 'siddharthanagula3@gmail.com',
  password: 'Sid@123',
  company: 'AGI Ventures',
  role: 'Founder'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function testSignup() {
  console.log(`${colors.cyan}Testing signup with: ${TEST_USER.email}${colors.reset}`);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Navigate to register page
    console.log(`${colors.cyan}Navigating to register page...${colors.reset}`);
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for form
    await page.waitForSelector('input#name', { visible: true, timeout: 10000 });

    // Fill form
    console.log(`${colors.cyan}Filling registration form...${colors.reset}`);
    await page.type('input#name', TEST_USER.name);
    await page.type('input#role', TEST_USER.role);
    await page.type('input#email', TEST_USER.email);
    await page.type('input#company', TEST_USER.company);
    await page.type('input#password', TEST_USER.password);
    await page.type('input#confirmPassword', TEST_USER.password);

    // Accept terms
    await page.click('input[type="checkbox"]#terms');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Enable console logging to see what's happening
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AuthService') || text.includes('error') || text.includes('Error')) {
        console.log(`${colors.yellow}[Browser Console]:${colors.reset} ${text}`);
      }
    });

    // Submit
    console.log(`${colors.cyan}Submitting registration form...${colors.reset}`);
    await page.click('button[type="submit"]');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check result
    const currentUrl = page.url();
    console.log(`${colors.cyan}Current URL: ${currentUrl}${colors.reset}`);

    if (currentUrl.includes('/dashboard')) {
      console.log(`${colors.green}✓ SUCCESS: Redirected to dashboard!${colors.reset}`);
    } else if (currentUrl.includes('/register')) {
      // Check for error or success message
      const pageContent = await page.content();

      if (pageContent.includes('confirmation')) {
        console.log(`${colors.green}✓ SUCCESS: Email confirmation required${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ FAILED: Still on register page${colors.reset}`);

        // Try to get error message
        const errorElement = await page.$('.bg-destructive\\/10');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log(`${colors.red}Error message: ${errorText}${colors.reset}`);
        }
      }
    }

    // Keep browser open for manual inspection
    console.log(`${colors.yellow}Browser will stay open for 30 seconds for inspection...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  } finally {
    await browser.close();
  }
}

testSignup().catch(console.error);
