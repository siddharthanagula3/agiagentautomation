// Browser console error checking script
import puppeteer from 'puppeteer';

console.log('🔍 BROWSER CONSOLE ERROR CHECKING');
console.log('=================================');

async function checkWebsiteConsoleErrors() {
  let browser;
  
  try {
    console.log('\n📊 STEP 1: Launching Browser');
    console.log('-----------------------------');
    
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set up console message capture
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        errors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  CONSOLE WARNING: ${text}`);
      }
    });
    
    // Capture network errors
    page.on('requestfailed', request => {
      console.log(`❌ NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('✅ Browser launched successfully');
    
    console.log('\n📊 STEP 2: Navigating to Website');
    console.log('--------------------------------');
    
    await page.goto('https://agiagentautomation.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Website loaded');
    
    console.log('\n📊 STEP 3: Testing Login Process');
    console.log('-------------------------------');
    
    // Navigate to login page
    await page.goto('https://agiagentautomation.com/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Login page loaded');
    
    // Fill in login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'founders@agiagentautomation.com');
    await page.type('input[type="password"]', 'Sid@8790');
    
    console.log('✅ Login credentials entered');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    console.log('✅ Login button clicked');
    
    // Wait for navigation or dashboard
    try {
      await page.waitForNavigation({ timeout: 15000 });
      console.log('✅ Navigation completed');
    } catch (e) {
      console.log('⚠️  Navigation timeout - checking current URL');
      console.log('Current URL:', page.url());
    }
    
    console.log('\n📊 STEP 4: Analyzing Console Errors');
    console.log('----------------------------------');
    
    // Wait a bit more for any async operations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`\n📊 CONSOLE ANALYSIS RESULTS:`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No console errors found!');
    }
    
    // Check for specific common errors
    const commonErrors = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'process is not defined',
      'import.meta.env',
      'Module not found',
      'Cannot read property',
      'ReferenceError',
      'TypeError',
      'Uncaught',
      'Failed to load resource',
      'CORS',
      '404',
      '500'
    ];
    
    console.log('\n🔍 CHECKING FOR COMMON ERROR PATTERNS:');
    commonErrors.forEach(pattern => {
      const found = consoleMessages.some(msg => 
        msg.text.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) {
        console.log(`⚠️  Found pattern: ${pattern}`);
      }
    });
    
    console.log('\n📊 STEP 5: Testing Dashboard Functionality');
    console.log('----------------------------------------');
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in and on dashboard');
      
      // Test some dashboard interactions
      try {
        // Look for common dashboard elements
        const dashboardElements = await page.$$('[data-testid], .dashboard, .header, .sidebar');
        console.log(`Found ${dashboardElements.length} dashboard elements`);
        
        // Check for any new errors after dashboard load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (e) {
        console.log('⚠️  Dashboard interaction error:', e.message);
      }
    } else {
      console.log('⚠️  Not on dashboard - current page:', currentUrl);
    }
    
    console.log('\n🎯 FINAL CONSOLE ERROR SUMMARY');
    console.log('==============================');
    
    if (errors.length === 0) {
      console.log('✅ NO CONSOLE ERRORS FOUND!');
      console.log('🎉 Website is running cleanly');
    } else {
      console.log(`❌ FOUND ${errors.length} CONSOLE ERRORS:`);
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error}`);
      });
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Check for missing environment variables');
      console.log('2. Verify all imports are correct');
      console.log('3. Check for undefined variables or properties');
      console.log('4. Ensure all API endpoints are working');
      console.log('5. Verify React component structure');
    }
    
  } catch (error) {
    console.error('💥 Error during browser testing:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Browser closed');
    }
  }
}

// Run the browser test
checkWebsiteConsoleErrors();
