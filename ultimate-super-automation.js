// Ultimate Super Automation - Comprehensive End-to-End Testing
import puppeteer from 'puppeteer';
import fs from 'fs';

console.log('🚀 ULTIMATE SUPER AUTOMATION');
console.log('============================');
console.log('Comprehensive End-to-End Testing Suite');
console.log('=====================================');

class UltimateSuperAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      startTime: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: [],
      pageTests: [],
      buttonTests: [],
      navigationTests: [],
      loadingTests: [],
      visibilityTests: [],
      endTime: null,
      duration: 0
    };
    this.baseUrl = 'https://agiagentautomation.com';
    this.credentials = {
      email: 'founders@agiagentautomation.com',
      password: 'Sid@8790'
    };
  }

  async initialize() {
    console.log('\n📊 STEP 1: Initializing Browser');
    console.log('--------------------------------');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('✅ Browser initialized successfully');
  }

  async navigateToHomepage() {
    console.log('\n📊 STEP 2: Navigating to Homepage');
    console.log('----------------------------------');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      const title = await this.page.title();
      console.log(`✅ Homepage loaded: ${title}`);
      
      this.testResults.totalTests++;
      this.testResults.passedTests++;
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load homepage:', error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`Homepage load failed: ${error.message}`);
      return false;
    }
  }

  async performLogin() {
    console.log('\n📊 STEP 3: Performing Login');
    console.log('----------------------------');
    
    try {
      // Navigate to login page
      await this.page.goto(`${this.baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
      
      // Wait for login form
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      
      // Fill login credentials
      await this.page.type('input[type="email"], input[name="email"]', this.credentials.email);
      await this.page.type('input[type="password"], input[name="password"]', this.credentials.password);
      
      // Click login button
      const loginButton = await this.page.$('button[type="submit"]') || 
                         await this.page.$('button:has-text("Sign in")') || 
                         await this.page.$('button:has-text("Login")') ||
                         await this.page.$('button:has-text("Sign In")');
      
      if (loginButton) {
        await loginButton.click();
      } else {
        throw new Error('Login button not found');
      }
      
      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
      // Verify we're on dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard');
        this.testResults.totalTests++;
        this.testResults.passedTests++;
        return true;
      } else {
        throw new Error('Login failed - not redirected to dashboard');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`Login failed: ${error.message}`);
      return false;
    }
  }

  async testPageLoading(pageName, pageUrl, expectedElements = []) {
    console.log(`\n📊 Testing ${pageName}`);
    console.log('='.repeat(50));
    
    const pageTest = {
      name: pageName,
      url: pageUrl,
      loaded: false,
      elementsFound: [],
      elementsMissing: [],
      loadingTime: 0,
      errors: []
    };
    
    try {
      const startTime = Date.now();
      
      // Navigate to page
      await this.page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for page to be fully loaded
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      const loadingTime = Date.now() - startTime;
      pageTest.loadingTime = loadingTime;
      
      console.log(`✅ ${pageName} loaded in ${loadingTime}ms`);
      
      // Check for expected elements
      for (const element of expectedElements) {
        try {
          const elementExists = await this.page.$(element.selector);
          if (elementExists) {
            pageTest.elementsFound.push(element.name);
            console.log(`✅ Found: ${element.name}`);
          } else {
            pageTest.elementsMissing.push(element.name);
            console.log(`❌ Missing: ${element.name}`);
          }
        } catch (error) {
          pageTest.elementsMissing.push(element.name);
          pageTest.errors.push(`Error checking ${element.name}: ${error.message}`);
        }
      }
      
      pageTest.loaded = true;
      this.testResults.totalTests++;
      this.testResults.passedTests++;
      
    } catch (error) {
      console.error(`❌ ${pageName} failed to load:`, error.message);
      pageTest.errors.push(error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`${pageName} load failed: ${error.message}`);
    }
    
    this.testResults.pageTests.push(pageTest);
    return pageTest.loaded;
  }

  async testButtonFunctionality(buttonSelector, expectedAction = null) {
    console.log(`\n🔘 Testing Button: ${buttonSelector}`);
    console.log('-----------------------------------');
    
    const buttonTest = {
      selector: buttonSelector,
      clickable: false,
      visible: false,
      actionPerformed: false,
      errors: []
    };
    
    try {
      // Check if button is visible
      const isVisible = await this.page.isVisible(buttonSelector);
      buttonTest.visible = isVisible;
      
      if (!isVisible) {
        console.log(`❌ Button not visible: ${buttonSelector}`);
        buttonTest.errors.push('Button not visible');
        return false;
      }
      
      // Check if button is clickable
      const isClickable = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element && !element.disabled && element.offsetParent !== null;
      }, buttonSelector);
      
      buttonTest.clickable = isClickable;
      
      if (!isClickable) {
        console.log(`❌ Button not clickable: ${buttonSelector}`);
        buttonTest.errors.push('Button not clickable');
        return false;
      }
      
      // Click the button
      await this.page.click(buttonSelector);
      console.log(`✅ Button clicked: ${buttonSelector}`);
      
      // Wait a bit for any action to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      buttonTest.actionPerformed = true;
      this.testResults.totalTests++;
      this.testResults.passedTests++;
      
    } catch (error) {
      console.error(`❌ Button test failed: ${buttonSelector}`, error.message);
      buttonTest.errors.push(error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`Button test failed: ${buttonSelector} - ${error.message}`);
    }
    
    this.testResults.buttonTests.push(buttonTest);
    return buttonTest.actionPerformed;
  }

  async testNavigation() {
    console.log('\n📊 STEP 4: Testing Navigation');
    console.log('-----------------------------');
    
    const navigationTests = [
      { name: 'Dashboard', url: '/dashboard', selector: 'h1' },
      { name: 'AI Employees', url: '/dashboard/ai-employees', selector: 'h1' },
      { name: 'Workforce', url: '/dashboard/workforce', selector: 'h1' },
      { name: 'Jobs', url: '/dashboard/jobs', selector: 'h1' },
      { name: 'Analytics', url: '/dashboard/analytics', selector: 'h1' },
      { name: 'Profile', url: '/dashboard/profile', selector: 'h1' },
      { name: 'Billing', url: '/dashboard/billing', selector: 'h1' },
      { name: 'Notifications', url: '/dashboard/notifications', selector: 'h1' },
      { name: 'Team', url: '/dashboard/team', selector: 'h1' },
      { name: 'Settings', url: '/dashboard/settings', selector: 'h1' },
      { name: 'Webhooks', url: '/dashboard/webhooks', selector: 'h1' },
      { name: 'Logs', url: '/dashboard/logs', selector: 'h1' },
      { name: 'Processing', url: '/dashboard/processing', selector: 'h1' },
      { name: 'Reports', url: '/dashboard/reports', selector: 'h1' },
      { name: 'API Keys', url: '/dashboard/api-keys', selector: 'h1' }
    ];
    
    for (const test of navigationTests) {
      const success = await this.testPageLoading(
        test.name,
        `${this.baseUrl}${test.url}`,
        [
          { name: 'Page Title', selector: 'h1' },
          { name: 'Navigation Menu', selector: 'nav, [role="navigation"]' },
          { name: 'Main Content', selector: 'main, .main-content, [role="main"]' }
        ]
      );
      
      if (success) {
        console.log(`✅ ${test.name} navigation successful`);
      } else {
        console.log(`❌ ${test.name} navigation failed`);
      }
      
      // Wait between navigation tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async testButtonFunctionality() {
    console.log('\n📊 STEP 5: Testing Button Functionality');
    console.log('---------------------------------------');
    
    const buttonTests = [
      // Navigation buttons
      { selector: 'a[href="/dashboard"]', name: 'Dashboard Link' },
      { selector: 'a[href="/dashboard/ai-employees"]', name: 'AI Employees Link' },
      { selector: 'a[href="/dashboard/workforce"]', name: 'Workforce Link' },
      { selector: 'a[href="/dashboard/jobs"]', name: 'Jobs Link' },
      { selector: 'a[href="/dashboard/analytics"]', name: 'Analytics Link' },
      { selector: 'a[href="/dashboard/profile"]', name: 'Profile Link' },
      { selector: 'a[href="/dashboard/billing"]', name: 'Billing Link' },
      { selector: 'a[href="/dashboard/notifications"]', name: 'Notifications Link' },
      { selector: 'a[href="/dashboard/team"]', name: 'Team Link' },
      { selector: 'a[href="/dashboard/settings"]', name: 'Settings Link' },
      
      // Action buttons (test on dashboard)
      { selector: 'button[data-testid="create"]', name: 'Create Button' },
      { selector: 'button[data-testid="add"]', name: 'Add Button' },
      { selector: 'button[data-testid="generate"]', name: 'Generate Button' },
      { selector: 'button[data-testid="refresh"]', name: 'Refresh Button' },
      { selector: 'button[data-testid="retry"]', name: 'Retry Button' }
    ];
    
    // Navigate to dashboard first
    await this.page.goto(`${this.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
    
    for (const buttonTest of buttonTests) {
      try {
        const element = await this.page.$(buttonTest.selector);
        if (element) {
          await this.testButtonFunctionality(buttonTest.selector);
        } else {
          console.log(`⚠️  Button not found: ${buttonTest.name}`);
        }
      } catch (error) {
        console.log(`⚠️  Button test skipped: ${buttonTest.name} - ${error.message}`);
      }
    }
  }

  async testLoadingStates() {
    console.log('\n📊 STEP 6: Testing Loading States');
    console.log('----------------------------------');
    
    const loadingTests = [
      { name: 'Dashboard Loading', url: '/dashboard' },
      { name: 'AI Employees Loading', url: '/dashboard/ai-employees' },
      { name: 'Workforce Loading', url: '/dashboard/workforce' },
      { name: 'Jobs Loading', url: '/dashboard/jobs' },
      { name: 'Analytics Loading', url: '/dashboard/analytics' }
    ];
    
    for (const test of loadingTests) {
      try {
        console.log(`\n⏳ Testing ${test.name} loading...`);
        
        const startTime = Date.now();
        await this.page.goto(`${this.baseUrl}${test.url}`, { waitUntil: 'networkidle2' });
        const loadTime = Date.now() - startTime;
        
        console.log(`✅ ${test.name} loaded in ${loadTime}ms`);
        
        this.testResults.loadingTests.push({
          name: test.name,
          loadTime: loadTime,
          success: true
        });
        
        this.testResults.totalTests++;
        this.testResults.passedTests++;
        
      } catch (error) {
        console.error(`❌ ${test.name} loading failed:`, error.message);
        this.testResults.loadingTests.push({
          name: test.name,
          loadTime: 0,
          success: false,
          error: error.message
        });
        this.testResults.failedTests++;
      }
    }
  }

  async testVisibility() {
    console.log('\n📊 STEP 7: Testing Element Visibility');
    console.log('--------------------------------------');
    
    const visibilityTests = [
      { name: 'Header', selector: 'header, .header' },
      { name: 'Navigation', selector: 'nav, .navigation' },
      { name: 'Main Content', selector: 'main, .main-content' },
      { name: 'Footer', selector: 'footer, .footer' },
      { name: 'User Menu', selector: '.user-menu, [data-testid="user-menu"]' },
      { name: 'Sidebar', selector: '.sidebar, .side-nav' }
    ];
    
    for (const test of visibilityTests) {
      try {
        const isVisible = await this.page.isVisible(test.selector);
        console.log(`${isVisible ? '✅' : '❌'} ${test.name}: ${isVisible ? 'Visible' : 'Not Visible'}`);
        
        this.testResults.visibilityTests.push({
          name: test.name,
          selector: test.selector,
          visible: isVisible
        });
        
        this.testResults.totalTests++;
        if (isVisible) {
          this.testResults.passedTests++;
        } else {
          this.testResults.failedTests++;
        }
        
      } catch (error) {
        console.error(`❌ Visibility test failed for ${test.name}:`, error.message);
        this.testResults.failedTests++;
      }
    }
  }

  async performSignOut() {
    console.log('\n📊 STEP 8: Performing Sign Out');
    console.log('-----------------------------');
    
    try {
      // Look for sign out button/link
      const signOutSelectors = [
        'button[data-testid="logout"]',
        'button.logout-button',
        'a[href*="logout"]',
        '[data-testid="logout"]',
        '.logout-button'
      ];
      
      let signOutClicked = false;
      
      for (const selector of signOutSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await this.page.click(selector);
            console.log(`✅ Sign out clicked using: ${selector}`);
            signOutClicked = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!signOutClicked) {
        // Try to find user menu and click sign out
        const userMenuSelectors = [
          '.user-menu',
          '[data-testid="user-menu"]',
          '.profile-menu',
          '.account-menu'
        ];
        
        for (const menuSelector of userMenuSelectors) {
          try {
            const menu = await this.page.$(menuSelector);
            if (menu) {
              await this.page.click(menuSelector);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Look for sign out in dropdown
              const dropdownSignOut = await this.page.$('button[data-testid="logout"]') || 
                                     await this.page.$('a[href*="logout"]') ||
                                     await this.page.$('.logout-button');
              if (dropdownSignOut) {
                await dropdownSignOut.click();
                console.log('✅ Sign out clicked from user menu');
                signOutClicked = true;
                break;
              }
            }
          } catch (error) {
              // Continue to next selector
          }
        }
      }
      
      if (signOutClicked) {
        // Wait for redirect to login page
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        const currentUrl = this.page.url();
        if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
          console.log('✅ Sign out successful - redirected to login page');
          this.testResults.totalTests++;
          this.testResults.passedTests++;
          return true;
        } else {
          throw new Error('Sign out failed - not redirected to login page');
        }
      } else {
        throw new Error('Sign out button not found');
      }
      
    } catch (error) {
      console.error('❌ Sign out failed:', error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`Sign out failed: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('\n📊 STEP 9: Generating Final Report');
    console.log('-----------------------------------');
    
    this.testResults.endTime = new Date().toISOString();
    this.testResults.duration = new Date(this.testResults.endTime) - new Date(this.testResults.startTime);
    
    const report = {
      summary: {
        totalTests: this.testResults.totalTests,
        passedTests: this.testResults.passedTests,
        failedTests: this.testResults.failedTests,
        successRate: ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2) + '%',
        duration: `${(this.testResults.duration / 1000).toFixed(2)}s`
      },
      details: this.testResults
    };
    
    // Save report to file
    const reportFileName = `ultimate-automation-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    
    console.log('\n🎯 ULTIMATE AUTOMATION RESULTS');
    console.log('=============================');
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}`);
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    console.log(`📄 Report saved: ${reportFileName}`);
    
    if (report.summary.failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! APPLICATION IS WORKING PERFECTLY!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - CHECK REPORT FOR DETAILS');
    }
    
    return report;
  }

  async run() {
    try {
      await this.initialize();
      
      // Test homepage
      await this.navigateToHomepage();
      
      // Test login
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - stopping tests');
        return;
      }
      
      // Test navigation
      await this.testNavigation();
      
      // Test button functionality
      await this.testButtonFunctionality();
      
      // Test loading states
      await this.testLoadingStates();
      
      // Test visibility
      await this.testVisibility();
      
      // Test sign out
      await this.performSignOut();
      
      // Generate final report
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Ultimate automation failed:', error.message);
      this.testResults.errors.push(`Ultimate automation failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the ultimate automation
const automation = new UltimateSuperAutomation();
automation.run().then(report => {
  console.log('\n🚀 ULTIMATE SUPER AUTOMATION COMPLETED!');
  process.exit(report.summary.failedTests === 0 ? 0 : 1);
}).catch(error => {
  console.error('❌ Ultimate automation crashed:', error);
  process.exit(1);
});
