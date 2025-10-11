import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Comprehensive Test Configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:8080',
  alternativePorts: [8081, 8082, 8083, 8084, 8085, 8086, 8087],
  browser: {
    headless: false, // Set to true for CI/CD
    slowMo: 100, // Slow down for better visibility
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },
  timeouts: {
    navigation: 30000,
    element: 10000,
    action: 5000
  },
  screenshots: {
    path: './tests/automation-screenshots',
    onError: true,
    onSuccess: false
  },
  testCredentials: {
    email: 'siddharthanagula3@gmail.com',
    password: 'Sid@1234',
    testEmail: 'test@example.com',
    testPassword: 'TestPassword123!'
  }
};

// Test Results Storage
let testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  tests: [],
  errors: [],
  screenshots: []
};

// Utility Functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const takeScreenshot = async (page, name, error = false) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${error ? 'ERROR' : 'SUCCESS'}_${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshots.path, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(TEST_CONFIG.screenshots.path)) {
      fs.mkdirSync(TEST_CONFIG.screenshots.path, { recursive: true });
    }
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      type: 'png'
    });
    
    testResults.screenshots.push({
      name,
      filepath,
      error,
      timestamp: new Date().toISOString()
    });
    
    return filepath;
  } catch (err) {
    console.error(`Failed to take screenshot: ${err.message}`);
    return null;
  }
};

const logTestResult = (testName, success, error = null, duration = 0) => {
  const result = {
    name: testName,
    success,
    error: error?.message || error,
    duration,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (success) {
    testResults.summary.passed++;
    console.log(`✅ ${testName} - PASSED (${duration}ms)`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName} - FAILED (${duration}ms): ${error?.message || error}`);
    if (error) {
      testResults.errors.push({
        test: testName,
        error: error.message || error,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Core Test Functions
class ComprehensiveTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentURL = null;
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive Test Framework...');
    
    this.browser = await puppeteer.launch(TEST_CONFIG.browser);
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });
    
    // Handle page errors
    this.page.on('pageerror', error => {
      console.log(`🔴 Page Error: ${error.message}`);
    });
    
    console.log('✅ Test Framework Initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async navigateTo(url, testName = 'Navigation') {
    const startTime = Date.now();
    try {
      console.log(`🧭 Navigating to: ${url}`);
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: TEST_CONFIG.timeouts.navigation 
      });
      
      this.currentURL = url;
      await wait(1000); // Let page settle
      
      const duration = Date.now() - startTime;
      logTestResult(`${testName} - ${url}`, true, null, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      await takeScreenshot(this.page, `navigation_error_${testName}`, true);
      logTestResult(`${testName} - ${url}`, false, error, duration);
      return false;
    }
  }

  async testElementExists(selector, testName) {
    const startTime = Date.now();
    try {
      await this.page.waitForSelector(selector, { 
        timeout: TEST_CONFIG.timeouts.element 
      });
      
      const duration = Date.now() - startTime;
      logTestResult(`${testName} - Element exists: ${selector}`, true, null, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      await takeScreenshot(this.page, `element_missing_${testName}`, true);
      logTestResult(`${testName} - Element missing: ${selector}`, false, error, duration);
      return false;
    }
  }

  async testElementClickable(selector, testName) {
    const startTime = Date.now();
    try {
      const element = await this.page.waitForSelector(selector, { 
        timeout: TEST_CONFIG.timeouts.element 
      });
      
      const isClickable = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.pointerEvents !== 'none' && 
               style.visibility !== 'hidden' && 
               !el.disabled;
      });
      
      if (isClickable) {
        const duration = Date.now() - startTime;
        logTestResult(`${testName} - Element clickable: ${selector}`, true, null, duration);
        return true;
      } else {
        throw new Error('Element is not clickable');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await takeScreenshot(this.page, `element_not_clickable_${testName}`, true);
      logTestResult(`${testName} - Element not clickable: ${selector}`, false, error, duration);
      return false;
    }
  }

  async testFormSubmission(formSelector, testName, formData = {}) {
    const startTime = Date.now();
    try {
      // Fill form fields
      for (const [field, value] of Object.entries(formData)) {
        const input = await this.page.waitForSelector(`[name="${field}"], #${field}`, { 
          timeout: TEST_CONFIG.timeouts.element 
        });
        await input.type(value);
      }
      
      // Submit form
      const submitButton = await this.page.waitForSelector(`${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`, {
        timeout: TEST_CONFIG.timeouts.element
      });
      
      await submitButton.click();
      await wait(2000); // Wait for submission
      
      const duration = Date.now() - startTime;
      logTestResult(`${testName} - Form submission`, true, null, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      await takeScreenshot(this.page, `form_submission_error_${testName}`, true);
      logTestResult(`${testName} - Form submission failed`, false, error, duration);
      return false;
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Flows...');
    
    // Test Registration
    await this.navigateTo(`${TEST_CONFIG.baseURL}/register`, 'Registration Page');
    await this.testElementExists('form', 'Registration Form');
    await this.testElementExists('input[name="email"]', 'Email Input');
    await this.testElementExists('input[name="password"]', 'Password Input');
    await this.testElementExists('input[name="confirmPassword"]', 'Confirm Password Input');
    await this.testElementExists('input[name="name"]', 'Name Input');
    await this.testElementExists('input[name="company"]', 'Company Input');
    await this.testElementClickable('button[type="submit"]', 'Registration Submit Button');
    
    // Test Login
    await this.navigateTo(`${TEST_CONFIG.baseURL}/login`, 'Login Page');
    await this.testElementExists('form', 'Login Form');
    await this.testElementExists('input[name="email"]', 'Login Email Input');
    await this.testElementExists('input[name="password"]', 'Login Password Input');
    await this.testElementClickable('button[type="submit"]', 'Login Submit Button');
    
    // Test actual login
    try {
      await this.page.type('input[name="email"]', TEST_CONFIG.testCredentials.email);
      await this.page.type('input[name="password"]', TEST_CONFIG.testCredentials.password);
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
        this.page.waitForSelector('[role="alert"]', { timeout: 10000 }),
        wait(10000)
      ]);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/workforce')) {
        logTestResult('Authentication - Login Success', true);
        return true;
      } else {
        logTestResult('Authentication - Login Failed', false, 'Did not redirect to dashboard');
        return false;
      }
    } catch (error) {
      await takeScreenshot(this.page, 'login_error', true);
      logTestResult('Authentication - Login Error', false, error);
      return false;
    }
  }

  async testAllPublicPages() {
    console.log('\n🌐 Testing All Public Pages...');
    
    const publicPages = [
      { path: '/', name: 'Landing Page' },
      { path: '/pricing', name: 'Pricing Page' },
      { path: '/marketplace', name: 'Marketplace Page' },
      { path: '/about', name: 'About Page' },
      { path: '/contact-sales', name: 'Contact Sales Page' },
      { path: '/blog', name: 'Blog Page' },
      { path: '/resources', name: 'Resources Page' },
      { path: '/help', name: 'Help Page' },
      { path: '/careers', name: 'Careers Page' },
      { path: '/security', name: 'Security Page' },
      { path: '/documentation', name: 'Documentation Page' },
      { path: '/api-reference', name: 'API Reference Page' },
      { path: '/privacy-policy', name: 'Privacy Policy Page' },
      { path: '/terms-of-service', name: 'Terms of Service Page' },
      { path: '/cookie-policy', name: 'Cookie Policy Page' },
      { path: '/vs-chatgpt', name: 'ChatGPT Comparison Page' },
      { path: '/vs-claude', name: 'Claude Comparison Page' },
      { path: '/chatgpt-alternative', name: 'ChatGPT Alternative Page' },
      { path: '/claude-alternative', name: 'Claude Alternative Page' }
    ];

    for (const page of publicPages) {
      await this.navigateTo(`${TEST_CONFIG.baseURL}${page.path}`, page.name);
      
      // Test common elements
      await this.testElementExists('nav', `${page.name} - Navigation`);
      await this.testElementExists('footer', `${page.name} - Footer`);
      
      // Test buttons and links
      const buttons = await this.page.$$('button, a[href]');
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const button = buttons[i];
        const text = await button.evaluate(el => el.textContent?.trim() || el.getAttribute('href') || 'Unknown');
        await this.testElementClickable(`button:nth-of-type(${i + 1}), a:nth-of-type(${i + 1})`, `${page.name} - Button: ${text}`);
      }
      
      // Test forms if they exist
      const forms = await this.page.$$('form');
      for (let i = 0; i < forms.length; i++) {
        await this.testElementExists(`form:nth-of-type(${i + 1})`, `${page.name} - Form ${i + 1}`);
      }
    }
  }

  async testDashboardFeatures() {
    console.log('\n📊 Testing Dashboard Features...');
    
    // Test Dashboard
    await this.navigateTo(`${TEST_CONFIG.baseURL}/dashboard`, 'Dashboard');
    await this.testElementExists('[data-testid="dashboard"]', 'Dashboard Container');
    
    // Test Workforce
    await this.navigateTo(`${TEST_CONFIG.baseURL}/workforce`, 'Workforce Page');
    await this.testElementExists('[data-testid="workforce"]', 'Workforce Container');
    
    // Test Settings
    await this.navigateTo(`${TEST_CONFIG.baseURL}/settings`, 'Settings Page');
    await this.testElementExists('[data-testid="settings"]', 'Settings Container');
    
    // Test Billing
    await this.navigateTo(`${TEST_CONFIG.baseURL}/billing`, 'Billing Page');
    await this.testElementExists('[data-testid="billing"]', 'Billing Container');
    
    // Test Chat
    await this.navigateTo(`${TEST_CONFIG.baseURL}/chat`, 'Chat Page');
    await this.testElementExists('[data-testid="chat"]', 'Chat Container');
    
    // Test Vibe Coding
    await this.navigateTo(`${TEST_CONFIG.baseURL}/vibe`, 'Vibe Coding Page');
    await this.testElementExists('[data-testid="vibe"]', 'Vibe Container');
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 320, height: 568, name: 'Small Mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.navigateTo(`${TEST_CONFIG.baseURL}/`, `${viewport.name} - Landing Page`);
      
      // Test navigation menu
      await this.testElementExists('nav', `${viewport.name} - Navigation`);
      
      // Test main content
      await this.testElementExists('main, [role="main"]', `${viewport.name} - Main Content`);
      
      await takeScreenshot(this.page, `responsive_${viewport.name.toLowerCase().replace(' ', '_')}`);
    }
  }

  async testErrorScenarios() {
    console.log('\n🚨 Testing Error Scenarios...');
    
    // Test 404 page
    await this.navigateTo(`${TEST_CONFIG.baseURL}/nonexistent-page`, '404 Page');
    
    // Test invalid login
    await this.navigateTo(`${TEST_CONFIG.baseURL}/login`, 'Invalid Login Test');
    await this.page.type('input[name="email"]', 'invalid@email.com');
    await this.page.type('input[name="password"]', 'wrongpassword');
    await this.page.click('button[type="submit"]');
    await wait(2000);
    
    // Test form validation
    await this.navigateTo(`${TEST_CONFIG.baseURL}/register`, 'Form Validation Test');
    await this.page.click('button[type="submit"]'); // Submit empty form
    await wait(1000);
  }

  async runAllTests() {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      // Run all test suites
      await this.testAllPublicPages();
      await this.testAuthentication();
      await this.testDashboardFeatures();
      await this.testResponsiveDesign();
      await this.testErrorScenarios();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await takeScreenshot(this.page, 'test_suite_error', true);
    } finally {
      await this.cleanup();
      
      // Calculate total duration
      testResults.summary.duration = Date.now() - startTime;
      
      // Generate report
      await this.generateReport();
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Comprehensive Test Report...');
    
    const report = {
      ...testResults,
      generated: new Date().toISOString(),
      config: TEST_CONFIG
    };
    
    // Save JSON report
    const reportPath = './tests/automation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = './tests/automation-report.html';
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Print summary
    console.log('\n📈 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⏱️  Duration: ${(testResults.summary.duration / 1000).toFixed(2)}s`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
    console.log(`📄 Reports: ${reportPath}, ${htmlPath}`);
    
    if (testResults.summary.failed > 0) {
      console.log('\n🔴 FAILED TESTS:');
      testResults.tests
        .filter(test => !test.success)
        .forEach(test => console.log(`  - ${test.name}: ${test.error}`));
    }
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Automation Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .test-passed { background: #d4edda; }
        .test-failed { background: #f8d7da; }
        .screenshot { margin: 10px 0; }
        .screenshot img { max-width: 100%; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Automation Test Report</h1>
        <p>Generated: ${report.generated}</p>
        <p>Duration: ${(report.summary.duration / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <h3>Total Tests</h3>
            <p>${report.summary.total}</p>
        </div>
        <div class="stat passed">
            <h3>Passed</h3>
            <p>${report.summary.passed}</p>
        </div>
        <div class="stat failed">
            <h3>Failed</h3>
            <p>${report.summary.failed}</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.tests.map(test => `
        <div class="test-result ${test.success ? 'test-passed' : 'test-failed'}">
            <h4>${test.name}</h4>
            <p>Status: ${test.success ? '✅ PASSED' : '❌ FAILED'}</p>
            <p>Duration: ${test.duration}ms</p>
            ${test.error ? `<p>Error: ${test.error}</p>` : ''}
        </div>
    `).join('')}
    
    <h2>Screenshots</h2>
    ${report.screenshots.map(screenshot => `
        <div class="screenshot">
            <h4>${screenshot.name}</h4>
            <img src="${screenshot.filepath}" alt="${screenshot.name}">
            <p>Type: ${screenshot.error ? 'Error' : 'Success'}</p>
            <p>Time: ${screenshot.timestamp}</p>
        </div>
    `).join('')}
</body>
</html>`;
  }
}

// Main execution
async function runComprehensiveTests() {
  const tester = new ComprehensiveTester();
  await tester.runAllTests();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}

export { ComprehensiveTester, TEST_CONFIG };
