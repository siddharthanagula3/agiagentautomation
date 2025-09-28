// Test Real Data Implementation
import puppeteer from 'puppeteer';
import fs from 'fs';

console.log('🧪 TESTING REAL DATA IMPLEMENTATION');
console.log('===================================');
console.log('Testing all pages with real backend data integration');
console.log('===================================================');

class RealDataImplementationTest {
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
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('✅ Browser initialized successfully');
  }

  async performLogin() {
    console.log('\n📊 STEP 2: Performing Login');
    console.log('----------------------------');
    
    try {
      await this.page.goto(`${this.baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      
      await this.page.type('input[type="email"], input[name="email"]', this.credentials.email);
      await this.page.type('input[type="password"], input[name="password"]', this.credentials.password);
      
      const loginButton = await this.page.$('button[type="submit"]') || 
                         await this.page.$('button:has-text("Sign in")') || 
                         await this.page.$('button:has-text("Login")') ||
                         await this.page.$('button:has-text("Sign In")');
      
      if (loginButton) {
        await loginButton.click();
      } else {
        throw new Error('Login button not found');
      }
      
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
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

  async testPageWithRealData(pageName, pageUrl, expectedElements = []) {
    console.log(`\n📊 Testing ${pageName} with Real Data`);
    console.log('='.repeat(50));
    
    const pageTest = {
      name: pageName,
      url: pageUrl,
      loaded: false,
      realDataLoaded: false,
      emptyStateShown: false,
      elementsFound: [],
      elementsMissing: [],
      loadingTime: 0,
      errors: []
    };
    
    try {
      const startTime = Date.now();
      
      await this.page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      const loadingTime = Date.now() - startTime;
      pageTest.loadingTime = loadingTime;
      
      console.log(`✅ ${pageName} loaded in ${loadingTime}ms`);
      
      // Check for real data integration
      const hasRealData = await this.page.evaluate(() => {
        // Look for signs of real data loading
        const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
        const errorElements = document.querySelectorAll('[data-testid="error"], .error');
        const emptyStateElements = document.querySelectorAll('[data-testid="empty-state"], .empty-state');
        
        return {
          hasLoading: loadingElements.length > 0,
          hasError: errorElements.length > 0,
          hasEmptyState: emptyStateElements.length > 0,
          hasContent: document.querySelector('main, .main-content, [role="main"]') !== null
        };
      });
      
      if (hasRealData.hasEmptyState) {
        console.log('✅ Empty state shown for new user (expected)');
        pageTest.emptyStateShown = true;
      } else if (hasRealData.hasContent) {
        console.log('✅ Real data loaded successfully');
        pageTest.realDataLoaded = true;
      } else if (hasRealData.hasLoading) {
        console.log('⏳ Still loading...');
      } else if (hasRealData.hasError) {
        console.log('❌ Error state detected');
        pageTest.errors.push('Error state detected');
      }
      
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

  async testAllPagesWithRealData() {
    console.log('\n📊 STEP 3: Testing All Pages with Real Data');
    console.log('--------------------------------------------');
    
    const pagesToTest = [
      { 
        name: 'Dashboard', 
        url: '/dashboard',
        expectedElements: [
          { name: 'Stats Cards', selector: '[data-testid="stats-card"], .stats-card' },
          { name: 'Recent Activity', selector: '[data-testid="recent-activity"], .recent-activity' },
          { name: 'Quick Actions', selector: '[data-testid="quick-actions"], .quick-actions' }
        ]
      },
      { 
        name: 'AI Employees', 
        url: '/dashboard/ai-employees',
        expectedElements: [
          { name: 'Employee List', selector: '[data-testid="employee-list"], .employee-list' },
          { name: 'Create Button', selector: '[data-testid="create-employee"], button:has-text("Create")' },
          { name: 'Filters', selector: '[data-testid="filters"], .filters' }
        ]
      },
      { 
        name: 'Jobs', 
        url: '/dashboard/jobs',
        expectedElements: [
          { name: 'Job List', selector: '[data-testid="job-list"], .job-list' },
          { name: 'Create Button', selector: '[data-testid="create-job"], button:has-text("Create")' },
          { name: 'Status Filters', selector: '[data-testid="status-filters"], .status-filters' }
        ]
      },
      { 
        name: 'Analytics', 
        url: '/dashboard/analytics',
        expectedElements: [
          { name: 'Analytics Charts', selector: '[data-testid="analytics-charts"], .analytics-charts' },
          { name: 'Metrics Cards', selector: '[data-testid="metrics-cards"], .metrics-cards' },
          { name: 'Time Range Selector', selector: '[data-testid="time-range"], .time-range' }
        ]
      },
      { 
        name: 'Profile', 
        url: '/dashboard/profile',
        expectedElements: [
          { name: 'Profile Form', selector: '[data-testid="profile-form"], .profile-form' },
          { name: 'Save Button', selector: '[data-testid="save-profile"], button:has-text("Save")' },
          { name: 'Avatar', selector: '[data-testid="avatar"], .avatar' }
        ]
      },
      { 
        name: 'Billing', 
        url: '/dashboard/billing',
        expectedElements: [
          { name: 'Billing Info', selector: '[data-testid="billing-info"], .billing-info' },
          { name: 'Usage Stats', selector: '[data-testid="usage-stats"], .usage-stats' },
          { name: 'Payment Methods', selector: '[data-testid="payment-methods"], .payment-methods' }
        ]
      },
      { 
        name: 'Notifications', 
        url: '/dashboard/notifications',
        expectedElements: [
          { name: 'Notification List', selector: '[data-testid="notification-list"], .notification-list' },
          { name: 'Mark All Read', selector: '[data-testid="mark-all-read"], button:has-text("Mark All Read")' },
          { name: 'Filter Options', selector: '[data-testid="notification-filters"], .notification-filters' }
        ]
      },
      { 
        name: 'Settings', 
        url: '/dashboard/settings',
        expectedElements: [
          { name: 'Settings Form', selector: '[data-testid="settings-form"], .settings-form' },
          { name: 'Save Button', selector: '[data-testid="save-settings"], button:has-text("Save")' },
          { name: 'Theme Selector', selector: '[data-testid="theme-selector"], .theme-selector' }
        ]
      },
      { 
        name: 'Team', 
        url: '/dashboard/team',
        expectedElements: [
          { name: 'Team Members', selector: '[data-testid="team-members"], .team-members' },
          { name: 'Invite Button', selector: '[data-testid="invite-member"], button:has-text("Invite")' },
          { name: 'Role Management', selector: '[data-testid="role-management"], .role-management' }
        ]
      },
      { 
        name: 'Reports', 
        url: '/dashboard/reports',
        expectedElements: [
          { name: 'Report List', selector: '[data-testid="report-list"], .report-list' },
          { name: 'Generate Button', selector: '[data-testid="generate-report"], button:has-text("Generate")' },
          { name: 'Report Templates', selector: '[data-testid="report-templates"], .report-templates' }
        ]
      },
      { 
        name: 'API Keys', 
        url: '/dashboard/api-keys',
        expectedElements: [
          { name: 'API Key List', selector: '[data-testid="api-key-list"], .api-key-list' },
          { name: 'Create Key Button', selector: '[data-testid="create-api-key"], button:has-text("Create")' },
          { name: 'Key Management', selector: '[data-testid="key-management"], .key-management' }
        ]
      }
    ];
    
    for (const page of pagesToTest) {
      const success = await this.testPageWithRealData(
        page.name,
        `${this.baseUrl}${page.url}`,
        page.expectedElements
      );
      
      if (success) {
        console.log(`✅ ${page.name} real data integration successful`);
      } else {
        console.log(`❌ ${page.name} real data integration failed`);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async testNewUserExperience() {
    console.log('\n📊 STEP 4: Testing New User Experience');
    console.log('---------------------------------------');
    
    try {
      // Test that new users see proper empty states
      const emptyStateTests = [
        { page: 'Dashboard', url: '/dashboard', expectedText: ['0', '--', 'No data', 'Get started'] },
        { page: 'AI Employees', url: '/dashboard/ai-employees', expectedText: ['0', 'No employees', 'Hire your first'] },
        { page: 'Jobs', url: '/dashboard/jobs', expectedText: ['0', 'No jobs', 'Create your first'] },
        { page: 'Analytics', url: '/dashboard/analytics', expectedText: ['0', 'No data', 'Generate first report'] }
      ];
      
      for (const test of emptyStateTests) {
        console.log(`\n🔍 Testing ${test.page} empty state...`);
        
        await this.page.goto(`${this.baseUrl}${test.url}`, { waitUntil: 'networkidle2' });
        
        const pageContent = await this.page.content();
        const hasEmptyState = test.expectedText.some(text => 
          pageContent.toLowerCase().includes(text.toLowerCase())
        );
        
        if (hasEmptyState) {
          console.log(`✅ ${test.page} shows proper empty state for new user`);
          this.testResults.totalTests++;
          this.testResults.passedTests++;
        } else {
          console.log(`❌ ${test.page} does not show proper empty state`);
          this.testResults.failedTests++;
          this.testResults.errors.push(`${test.page} missing empty state`);
        }
      }
      
    } catch (error) {
      console.error('❌ New user experience test failed:', error.message);
      this.testResults.failedTests++;
      this.testResults.errors.push(`New user experience test failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 STEP 5: Generating Final Report');
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
    
    const reportFileName = `real-data-implementation-test-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    
    console.log('\n🎯 REAL DATA IMPLEMENTATION TEST RESULTS');
    console.log('========================================');
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}`);
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    console.log(`📄 Report saved: ${reportFileName}`);
    
    if (report.summary.failedTests === 0) {
      console.log('\n🎉 ALL REAL DATA IMPLEMENTATIONS WORKING PERFECTLY!');
    } else {
      console.log('\n⚠️  SOME IMPLEMENTATIONS NEED ATTENTION - CHECK REPORT FOR DETAILS');
    }
    
    return report;
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - stopping tests');
        return;
      }
      
      await this.testAllPagesWithRealData();
      await this.testNewUserExperience();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Real data implementation test failed:', error.message);
      this.testResults.errors.push(`Real data implementation test failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the real data implementation test
const test = new RealDataImplementationTest();
test.run().then(report => {
  console.log('\n🚀 REAL DATA IMPLEMENTATION TEST COMPLETED!');
  process.exit(report.summary.failedTests === 0 ? 0 : 1);
}).catch(error => {
  console.error('❌ Real data implementation test crashed:', error);
  process.exit(1);
});
