// Test New User Dashboard Experience
import puppeteer from 'puppeteer';

console.log('🔍 TESTING NEW USER DASHBOARD EXPERIENCE');
console.log('========================================');

class NewUserDashboardTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {};
  }

  async initialize() {
    console.log('\n📊 STEP 1: Initializing Test Environment');
    console.log('----------------------------------------');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up comprehensive monitoring
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log(`❌ CONSOLE ERROR: ${text}`);
        this.testResults.consoleErrors = this.testResults.consoleErrors || [];
        this.testResults.consoleErrors.push(text);
      }
    });

    this.page.on('requestfailed', request => {
      console.log(`❌ NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
      this.testResults.networkErrors = this.testResults.networkErrors || [];
      this.testResults.networkErrors.push({
        url: request.url(),
        error: request.failure().errorText
      });
    });
    
    console.log('✅ Test environment initialized');
  }

  async testNewUserExperience() {
    console.log('\n📊 STEP 2: Testing New User Experience');
    console.log('--------------------------------------');
    
    try {
      // Test 1: Login as new user
      console.log('🔍 Testing login process...');
      await this.page.goto('https://agiagentautomation.com/auth/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Fill login form
      await this.page.type('input[type="email"]', 'founders@agiagentautomation.com');
      await this.page.type('input[type="password"]', 'Sid@8790');
      
      // Click submit
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ timeout: 15000 });
      
      // Check if we're on dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard');
        this.testResults.login = 'success';
      } else {
        console.log('❌ Login failed - not redirected to dashboard');
        this.testResults.login = 'failed';
        return;
      }

      // Test 2: Check dashboard loads without errors
      console.log('🔍 Testing dashboard load...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for any async operations
      
      // Check for JavaScript errors
      const hasErrors = this.testResults.consoleErrors && this.testResults.consoleErrors.length > 0;
      if (hasErrors) {
        console.log('❌ Dashboard has JavaScript errors');
        this.testResults.dashboardErrors = this.testResults.consoleErrors;
      } else {
        console.log('✅ Dashboard loaded without JavaScript errors');
        this.testResults.dashboardErrors = [];
      }

      // Test 3: Check for "data is not defined" errors
      const dataErrors = this.testResults.consoleErrors?.filter(error => 
        error.includes('data is not defined') || 
        error.includes('data.length') ||
        error.includes('ReferenceError')
      ) || [];
      
      if (dataErrors.length > 0) {
        console.log('❌ Found data-related errors:');
        dataErrors.forEach(error => console.log(`  - ${error}`));
        this.testResults.dataErrors = dataErrors;
      } else {
        console.log('✅ No data-related errors found');
        this.testResults.dataErrors = [];
      }

      // Test 4: Test dashboard pages
      console.log('🔍 Testing dashboard pages...');
      const pages = [
        { path: '/dashboard', name: 'Main Dashboard' },
        { path: '/dashboard/jobs', name: 'Jobs Page' },
        { path: '/dashboard/employees', name: 'Employees Page' },
        { path: '/dashboard/analytics', name: 'Analytics Page' },
        { path: '/dashboard/notifications', name: 'Notifications Page' }
      ];

      for (const page of pages) {
        try {
          console.log(`  🔍 Testing ${page.name}...`);
          
          await this.page.goto(`https://agiagentautomation.com${page.path}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 2000));
          
          const currentUrl = this.page.url();
          if (currentUrl.includes(page.path)) {
            console.log(`    ✅ ${page.name} loaded successfully`);
            this.testResults[page.path] = 'success';
          } else {
            console.log(`    ❌ ${page.name} failed to load`);
            this.testResults[page.path] = 'failed';
          }
          
        } catch (error) {
          console.log(`    ❌ Error testing ${page.name}: ${error.message}`);
          this.testResults[page.path] = 'error';
        }
      }

    } catch (error) {
      console.error('❌ Error during new user testing:', error);
      this.testResults.generalError = error.message;
    }
  }

  async generateTestReport() {
    console.log('\n📊 STEP 3: Generating Test Report');
    console.log('--------------------------------');
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        login: this.testResults.login,
        hasDashboardErrors: this.testResults.dashboardErrors?.length > 0,
        hasDataErrors: this.testResults.dataErrors?.length > 0,
        totalConsoleErrors: this.testResults.consoleErrors?.length || 0,
        totalNetworkErrors: this.testResults.networkErrors?.length || 0
      }
    };

    console.log(`\n📊 NEW USER DASHBOARD TEST REPORT:`);
    console.log(`  🔐 Login Status: ${report.summary.login}`);
    console.log(`  ❌ Dashboard Errors: ${report.summary.hasDashboardErrors ? 'Yes' : 'No'}`);
    console.log(`  📊 Data Errors: ${report.summary.hasDataErrors ? 'Yes' : 'No'}`);
    console.log(`  💥 Console Errors: ${report.summary.totalConsoleErrors}`);
    console.log(`  🌐 Network Errors: ${report.summary.totalNetworkErrors}`);

    if (report.summary.hasDataErrors) {
      console.log(`\n❌ DATA ERRORS FOUND:`);
      this.testResults.dataErrors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    if (report.summary.totalConsoleErrors > 0) {
      console.log(`\n❌ CONSOLE ERRORS FOUND:`);
      this.testResults.consoleErrors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    // Save report
    const fs = await import('fs');
    fs.writeFileSync('new-user-dashboard-test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to new-user-dashboard-test-report.json');
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n✅ Test browser closed');
    }
  }
}

// Main execution
async function runNewUserDashboardTest() {
  const tester = new NewUserDashboardTester();
  
  try {
    await tester.initialize();
    await tester.testNewUserExperience();
    await tester.generateTestReport();
    
    console.log('\n🎯 NEW USER DASHBOARD TEST COMPLETE');
    console.log('===================================');
    console.log('✅ Login process tested');
    console.log('✅ Dashboard loading tested');
    console.log('✅ Data errors checked');
    console.log('✅ All dashboard pages tested');
    console.log('📊 Comprehensive report generated');
    
  } catch (error) {
    console.error('💥 New user dashboard test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run the new user dashboard test
runNewUserDashboardTest();
