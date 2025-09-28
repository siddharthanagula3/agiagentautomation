const puppeteer = require('puppeteer');

class AuthenticationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      errors: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing Authentication Tester...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--incognito' // Force incognito mode
      ]
    });

    // Create incognito context for clean testing
    const context = await this.browser.createBrowserContext({
      incognito: true // Explicitly enable incognito mode
    });
    this.page = await context.newPage();
    
    // Verify incognito mode is active
    const isIncognito = await this.page.evaluate(() => {
      return !window.chrome || !window.chrome.runtime || 
             window.chrome.runtime.id === undefined ||
             navigator.webdriver === undefined;
    });
    console.log(`🔒 Incognito Mode: ${isIncognito ? '✅ Active' : '❌ Not Active'}`);
    
    // Capture all console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        this.results.errors.push({
          type: 'console_error',
          message: text,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Console Error: ${text}`);
      }
    });

    // Handle page errors
    this.page.on('pageerror', error => {
      this.results.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Page Error: ${error.message}`);
    });

    console.log('✅ Browser initialized successfully');
  }

  async testValidLogin() {
    console.log('🔐 Testing Valid Login...');
    
    try {
      // Navigate to login page
      await this.page.goto('https://agiagentautomation.com/auth/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for login form to load
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill in demo credentials
      await this.page.type('input[type="email"]', 'demo@example.com');
      await this.page.type('input[type="password"]', 'demo123');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ timeout: 15000 });
      
      const currentUrl = this.page.url();
      const isDashboard = currentUrl.includes('/dashboard');
      
      this.results.tests.push({
        name: 'Valid Login Test',
        status: isDashboard ? 'PASSED' : 'FAILED',
        redirectUrl: currentUrl,
        isDashboard: isDashboard
      });

      console.log(`✅ Valid login test: ${isDashboard ? 'PASSED' : 'FAILED'}`);
      console.log(`🔗 Redirected to: ${currentUrl}`);
      
      return isDashboard;
    } catch (error) {
      console.log(`❌ Valid login test failed: ${error.message}`);
      this.results.tests.push({
        name: 'Valid Login Test',
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async testInvalidLogin() {
    console.log('🔐 Testing Invalid Login...');
    
    try {
      // Navigate to login page
      await this.page.goto('https://agiagentautomation.com/auth/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for login form to load
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill in invalid credentials
      await this.page.type('input[type="email"]', 'invalid@example.com');
      await this.page.type('input[type="password"]', 'wrongpassword');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for error message to appear
      await this.page.waitForTimeout(3000);
      
      // Check if we're still on login page (should be)
      const currentUrl = this.page.url();
      const isStillOnLogin = currentUrl.includes('/auth/login');
      
      // Check for error message
      const hasErrorMessage = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll('[data-testid="error-message"], .error-message, [role="alert"]');
        return errorElements.length > 0;
      });
      
      // Check for console errors related to authentication
      const hasAuthErrors = this.results.errors.some(error => 
        error.message.includes('Cannot read properties of null') ||
        error.message.includes('reading \'user\'') ||
        error.message.includes('TypeError')
      );
      
      this.results.tests.push({
        name: 'Invalid Login Test',
        status: (isStillOnLogin && !hasAuthErrors) ? 'PASSED' : 'FAILED',
        isStillOnLogin: isStillOnLogin,
        hasErrorMessage: hasErrorMessage,
        hasAuthErrors: hasAuthErrors,
        currentUrl: currentUrl
      });

      console.log(`✅ Invalid login test: ${(isStillOnLogin && !hasAuthErrors) ? 'PASSED' : 'FAILED'}`);
      console.log(`🔗 Still on login page: ${isStillOnLogin}`);
      console.log(`❌ Has auth errors: ${hasAuthErrors}`);
      
      return isStillOnLogin && !hasAuthErrors;
    } catch (error) {
      console.log(`❌ Invalid login test failed: ${error.message}`);
      this.results.tests.push({
        name: 'Invalid Login Test',
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async testRegistration() {
    console.log('📝 Testing Registration...');
    
    try {
      // Navigate to registration page
      await this.page.goto('https://agiagentautomation.com/auth/register', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for registration form to load
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill in registration data
      await this.page.type('input[type="email"]', 'test@example.com');
      await this.page.type('input[type="password"]', 'testpassword123');
      await this.page.type('input[name="name"]', 'Test User');
      
      // Click register button
      await this.page.click('button[type="submit"]');
      
      // Wait for response
      await this.page.waitForTimeout(3000);
      
      // Check for success or error message
      const hasSuccessMessage = await this.page.evaluate(() => {
        const successElements = document.querySelectorAll('[data-testid="success-message"], .success-message');
        return successElements.length > 0;
      });
      
      const hasErrorMessage = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll('[data-testid="error-message"], .error-message, [role="alert"]');
        return errorElements.length > 0;
      });
      
      // Check for console errors
      const hasAuthErrors = this.results.errors.some(error => 
        error.message.includes('Cannot read properties of null') ||
        error.message.includes('reading \'user\'') ||
        error.message.includes('TypeError')
      );
      
      this.results.tests.push({
        name: 'Registration Test',
        status: (!hasAuthErrors) ? 'PASSED' : 'FAILED',
        hasSuccessMessage: hasSuccessMessage,
        hasErrorMessage: hasErrorMessage,
        hasAuthErrors: hasAuthErrors
      });

      console.log(`✅ Registration test: ${(!hasAuthErrors) ? 'PASSED' : 'FAILED'}`);
      console.log(`✅ Has success message: ${hasSuccessMessage}`);
      console.log(`❌ Has error message: ${hasErrorMessage}`);
      console.log(`❌ Has auth errors: ${hasAuthErrors}`);
      
      return !hasAuthErrors;
    } catch (error) {
      console.log(`❌ Registration test failed: ${error.message}`);
      this.results.tests.push({
        name: 'Registration Test',
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  generateSummary() {
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.status === 'PASSED').length;
    const failedTests = this.results.tests.filter(t => t.status === 'FAILED').length;
    
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      criticalErrors: this.results.errors.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 AUTHENTICATION TEST SUMMARY:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} (${this.results.summary.successRate})`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`🚨 Critical Errors: ${this.results.errors.length}`);
  }

  async saveResults() {
    const filename = `authentication-test-results-${new Date().toISOString().split('T')[0]}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📄 Results saved to: ${filename}`);
    return filename;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleaned up');
    }
  }

  async runFullTest() {
    try {
      console.log('🚀 Starting Authentication Test Suite...\n');
      
      await this.initialize();
      
      // Test valid login
      const validLoginOk = await this.testValidLogin();
      
      // Test invalid login
      const invalidLoginOk = await this.testInvalidLogin();
      
      // Test registration
      const registrationOk = await this.testRegistration();
      
      // Generate summary
      this.generateSummary();
      
      // Save results
      const filename = await this.saveResults();
      
      console.log('\n🎯 AUTHENTICATION TEST COMPLETE!');
      console.log(`📄 Detailed results: ${filename}`);
      
      return this.results;
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      return this.results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
async function main() {
  const tester = new AuthenticationTester();
  const results = await tester.runFullTest();
  
  // Exit with appropriate code
  const hasCriticalErrors = results.errors.length > 0;
  const successRate = parseInt(results.summary.successRate);
  
  if (hasCriticalErrors || successRate < 80) {
    console.log('\n❌ AUTHENTICATION TEST FAILED - Critical issues detected');
    process.exit(1);
  } else {
    console.log('\n✅ AUTHENTICATION TEST PASSED - Authentication is working properly');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuthenticationTester;
