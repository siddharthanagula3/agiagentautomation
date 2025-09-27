// Comprehensive Automated Testing and Repair System
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

console.log('🤖 COMPREHENSIVE AUTOMATED TESTING & REPAIR SYSTEM');
console.log('==================================================');

class AutomatedTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
    this.fixes = [];
    this.testResults = {};
  }

  async initialize() {
    console.log('\n📊 STEP 1: Initializing Browser');
    console.log('-------------------------------');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up comprehensive monitoring
    await this.setupMonitoring();
    
    console.log('✅ Browser initialized successfully');
  }

  async setupMonitoring() {
    // Monitor console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.issues.push({
          type: 'console_error',
          message: text,
          severity: 'high',
          category: 'javascript'
        });
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        this.issues.push({
          type: 'console_warning',
          message: text,
          severity: 'medium',
          category: 'javascript'
        });
        console.log(`⚠️  CONSOLE WARNING: ${text}`);
      }
    });

    // Monitor network failures
    this.page.on('requestfailed', request => {
      this.issues.push({
        type: 'network_error',
        message: `Failed to load: ${request.url()}`,
        severity: 'high',
        category: 'network',
        url: request.url(),
        error: request.failure().errorText
      });
      console.log(`❌ NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
    });

    // Monitor page errors
    this.page.on('pageerror', error => {
      this.issues.push({
        type: 'page_error',
        message: error.message,
        severity: 'high',
        category: 'javascript',
        stack: error.stack
      });
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });
  }

  async testWebsite() {
    console.log('\n📊 STEP 2: Testing Website Functionality');
    console.log('----------------------------------------');
    
    try {
      // Test 1: Homepage Load
      console.log('🔍 Testing homepage load...');
      await this.page.goto('https://agiagentautomation.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('✅ Homepage loaded successfully');

      // Test 2: Login Page
      console.log('🔍 Testing login page...');
      await this.page.goto('https://agiagentautomation.com/auth/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('✅ Login page loaded successfully');

      // Test 3: Login Process
      console.log('🔍 Testing login process...');
      await this.testLogin();

      // Test 4: Dashboard Functionality
      console.log('🔍 Testing dashboard functionality...');
      await this.testDashboard();

      // Test 5: Sign Out Functionality
      console.log('🔍 Testing sign out functionality...');
      await this.testSignOut();

      // Test 6: Navigation
      console.log('🔍 Testing navigation...');
      await this.testNavigation();

    } catch (error) {
      console.error('💥 Error during website testing:', error);
      this.issues.push({
        type: 'test_error',
        message: error.message,
        severity: 'high',
        category: 'testing'
      });
    }
  }

  async testLogin() {
    try {
      // Check if login form exists
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const submitButton = await this.page.$('button[type="submit"]');

      if (!emailInput || !passwordInput || !submitButton) {
        this.issues.push({
          type: 'missing_elements',
          message: 'Login form elements missing',
          severity: 'high',
          category: 'ui'
        });
        return false;
      }

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
        console.log('✅ Login successful');
        this.testResults.login = 'success';
        return true;
      } else {
        console.log('❌ Login failed - not redirected to dashboard');
        this.issues.push({
          type: 'login_failure',
          message: 'Login did not redirect to dashboard',
          severity: 'high',
          category: 'authentication'
        });
        this.testResults.login = 'failed';
        return false;
      }
    } catch (error) {
      console.error('❌ Login test error:', error);
      this.issues.push({
        type: 'login_error',
        message: error.message,
        severity: 'high',
        category: 'authentication'
      });
      this.testResults.login = 'error';
      return false;
    }
  }

  async testDashboard() {
    try {
      // Check if we're on dashboard
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/dashboard')) {
        console.log('⚠️  Not on dashboard, skipping dashboard tests');
        return false;
      }

      // Test dashboard elements
      const dashboardElements = await this.page.$$('[data-testid], .dashboard, .header, .sidebar');
      console.log(`Found ${dashboardElements.length} dashboard elements`);

      // Test user menu
      const userMenu = await this.page.$('[data-testid="user-menu"], .user-menu, [aria-label*="user"]');
      if (userMenu) {
        console.log('✅ User menu found');
        this.testResults.dashboard = 'success';
      } else {
        console.log('⚠️  User menu not found');
        this.issues.push({
          type: 'missing_user_menu',
          message: 'User menu not found on dashboard',
          severity: 'medium',
          category: 'ui'
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Dashboard test error:', error);
      this.issues.push({
        type: 'dashboard_error',
        message: error.message,
        severity: 'high',
        category: 'ui'
      });
      return false;
    }
  }

  async testSignOut() {
    try {
      // Look for sign out button
      const signOutButton = await this.page.$('button:has-text("Sign out"), button:has-text("Log out"), [data-testid*="logout"]');
      
      if (!signOutButton) {
        // Try to find user menu first
        const userMenu = await this.page.$('[data-testid="user-menu"], .user-menu, [aria-label*="user"]');
        if (userMenu) {
          await userMenu.click();
          await this.page.waitForTimeout(1000);
          
          // Look for sign out in dropdown
          const signOutInDropdown = await this.page.$('button:has-text("Sign out"), button:has-text("Log out")');
          if (signOutInDropdown) {
            await signOutInDropdown.click();
            console.log('✅ Sign out button clicked');
            
            // Wait for navigation
            await this.page.waitForNavigation({ timeout: 10000 });
            
            // Check if redirected to login
            const currentUrl = this.page.url();
            if (currentUrl.includes('/auth/login')) {
              console.log('✅ Sign out successful - redirected to login');
              this.testResults.signOut = 'success';
              return true;
            } else {
              console.log('❌ Sign out failed - not redirected to login');
              this.issues.push({
                type: 'signout_failure',
                message: 'Sign out did not redirect to login page',
                severity: 'high',
                category: 'authentication'
              });
              this.testResults.signOut = 'failed';
              return false;
            }
          }
        }
        
        this.issues.push({
          type: 'missing_signout_button',
          message: 'Sign out button not found',
          severity: 'high',
          category: 'ui'
        });
        this.testResults.signOut = 'failed';
        return false;
      } else {
        await signOutButton.click();
        console.log('✅ Sign out button clicked');
        
        // Wait for navigation
        await this.page.waitForNavigation({ timeout: 10000 });
        
        // Check if redirected to login
        const currentUrl = this.page.url();
        if (currentUrl.includes('/auth/login')) {
          console.log('✅ Sign out successful - redirected to login');
          this.testResults.signOut = 'success';
          return true;
        } else {
          console.log('❌ Sign out failed - not redirected to login');
          this.issues.push({
            type: 'signout_failure',
            message: 'Sign out did not redirect to login page',
            severity: 'high',
            category: 'authentication'
          });
          this.testResults.signOut = 'failed';
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Sign out test error:', error);
      this.issues.push({
        type: 'signout_error',
        message: error.message,
        severity: 'high',
        category: 'authentication'
      });
      this.testResults.signOut = 'error';
      return false;
    }
  }

  async testNavigation() {
    try {
      // Test navigation between pages
      const pages = [
        '/dashboard',
        '/auth/login',
        '/'
      ];

      for (const pagePath of pages) {
        console.log(`🔍 Testing navigation to ${pagePath}...`);
        await this.page.goto(`https://agiagentautomation.com${pagePath}`, {
          waitUntil: 'networkidle2',
          timeout: 15000
        });
        
        const currentUrl = this.page.url();
        if (currentUrl.includes(pagePath)) {
          console.log(`✅ Navigation to ${pagePath} successful`);
        } else {
          console.log(`❌ Navigation to ${pagePath} failed`);
          this.issues.push({
            type: 'navigation_failure',
            message: `Failed to navigate to ${pagePath}`,
            severity: 'medium',
            category: 'navigation'
          });
        }
      }

      this.testResults.navigation = 'success';
      return true;
    } catch (error) {
      console.error('❌ Navigation test error:', error);
      this.issues.push({
        type: 'navigation_error',
        message: error.message,
        severity: 'high',
        category: 'navigation'
      });
      this.testResults.navigation = 'error';
      return false;
    }
  }

  async analyzeIssues() {
    console.log('\n📊 STEP 3: Analyzing Issues');
    console.log('----------------------------');
    
    console.log(`Found ${this.issues.length} issues:`);
    
    // Categorize issues
    const categories = {};
    this.issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = [];
      }
      categories[issue.category].push(issue);
    });

    Object.keys(categories).forEach(category => {
      console.log(`\n📋 ${category.toUpperCase()} ISSUES (${categories[category].length}):`);
      categories[category].forEach(issue => {
        console.log(`  ${issue.severity === 'high' ? '❌' : '⚠️ '} ${issue.message}`);
      });
    });

    return categories;
  }

  async generateFixes() {
    console.log('\n📊 STEP 4: Generating Fixes');
    console.log('----------------------------');
    
    const fixes = [];
    
    this.issues.forEach(issue => {
      switch (issue.type) {
        case 'console_error':
          fixes.push({
            type: 'error_handling',
            description: 'Add better error handling for console errors',
            file: 'src/components/ErrorBoundary.tsx',
            action: 'improve_error_boundary'
          });
          break;
          
        case 'network_error':
          fixes.push({
            type: 'asset_fix',
            description: 'Fix missing assets causing 404 errors',
            file: 'public/',
            action: 'add_missing_assets'
          });
          break;
          
        case 'login_failure':
          fixes.push({
            type: 'auth_fix',
            description: 'Fix login authentication issues',
            file: 'src/services/authService.ts',
            action: 'improve_auth_flow'
          });
          break;
          
        case 'signout_failure':
          fixes.push({
            type: 'logout_fix',
            description: 'Fix sign out functionality',
            file: 'src/components/layout/DashboardHeader.tsx',
            action: 'fix_logout_button'
          });
          break;
          
        case 'missing_elements':
          fixes.push({
            type: 'ui_fix',
            description: 'Fix missing UI elements',
            file: 'src/components/',
            action: 'add_missing_elements'
          });
          break;
      }
    });

    console.log(`Generated ${fixes.length} potential fixes:`);
    fixes.forEach(fix => {
      console.log(`🔧 ${fix.description} (${fix.file})`);
    });

    return fixes;
  }

  async generateReport() {
    console.log('\n📊 STEP 5: Generating Comprehensive Report');
    console.log('------------------------------------------');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      testResults: this.testResults,
      issues: this.issues,
      summary: {
        critical: this.issues.filter(i => i.severity === 'high').length,
        warnings: this.issues.filter(i => i.severity === 'medium').length,
        info: this.issues.filter(i => i.severity === 'low').length
      }
    };

    // Save report to file
    const reportPath = 'automated-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to ${reportPath}`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ❌ Critical Issues: ${report.summary.critical}`);
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`  ℹ️  Info: ${report.summary.info}`);
    console.log(`  📋 Total Issues: ${report.totalIssues}`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n✅ Browser closed');
    }
  }
}

// Main execution
async function runAutomatedTesting() {
  const tester = new AutomatedTester();
  
  try {
    await tester.initialize();
    await tester.testWebsite();
    await tester.analyzeIssues();
    await tester.generateFixes();
    await tester.generateReport();
    
    console.log('\n🎯 AUTOMATED TESTING COMPLETE');
    console.log('============================');
    console.log('✅ All tests completed');
    console.log('📊 Issues identified and categorized');
    console.log('🔧 Fixes generated');
    console.log('📄 Report created');
    
  } catch (error) {
    console.error('💥 Automated testing failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run the automated testing
runAutomatedTesting();
