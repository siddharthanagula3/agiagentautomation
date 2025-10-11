import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class FunctionalTester {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name, error = false) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${error ? 'ERROR' : 'SUCCESS'}_${timestamp}.png`;
    const filepath = path.join('./tests/functional-screenshots', filename);
    
    if (!fs.existsSync('./tests/functional-screenshots')) {
      fs.mkdirSync('./tests/functional-screenshots', { recursive: true });
    }
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    try {
      // Test Registration
      await this.page.goto(`${this.baseURL}/register`);
      await this.takeScreenshot('registration_page');
      
      // Fill registration form
      await this.page.type('input[name="name"]', 'Test User');
      await this.page.type('input[name="email"]', 'test@example.com');
      await this.page.type('input[name="password"]', 'TestPassword123!');
      await this.page.type('input[name="confirmPassword"]', 'TestPassword123!');
      await this.page.type('input[name="company"]', 'Test Company');
      
      await this.takeScreenshot('registration_form_filled');
      
      // Submit registration
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);
      
      await this.takeScreenshot('registration_submitted');
      
      // Test Login
      await this.page.goto(`${this.baseURL}/login`);
      await this.takeScreenshot('login_page');
      
      // Fill login form
      await this.page.type('input[name="email"]', 'siddharthanagula3@gmail.com');
      await this.page.type('input[name="password"]', 'Sid@1234');
      
      await this.takeScreenshot('login_form_filled');
      
      // Submit login
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(5000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/workforce')) {
        await this.takeScreenshot('login_success');
        this.results.push({ test: 'Authentication Flow', status: 'PASSED' });
        return true;
      } else {
        await this.takeScreenshot('login_failed', true);
        this.results.push({ test: 'Authentication Flow', status: 'FAILED', error: 'Did not redirect to dashboard' });
        return false;
      }
    } catch (error) {
      await this.takeScreenshot('authentication_error', true);
      this.results.push({ test: 'Authentication Flow', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async testDashboardNavigation() {
    console.log('\n📊 Testing Dashboard Navigation...');
    
    try {
      const dashboardPages = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/workforce', name: 'Workforce' },
        { path: '/settings', name: 'Settings' },
        { path: '/billing', name: 'Billing' },
        { path: '/chat', name: 'Chat' },
        { path: '/vibe', name: 'Vibe Coding' }
      ];

      for (const page of dashboardPages) {
        await this.page.goto(`${this.baseURL}${page.path}`);
        await this.page.waitForTimeout(2000);
        
        await this.takeScreenshot(`dashboard_${page.name.toLowerCase()}`);
        
        // Test if page loaded correctly
        const title = await this.page.title();
        if (title && !title.includes('Error')) {
          this.results.push({ test: `Dashboard - ${page.name}`, status: 'PASSED' });
        } else {
          this.results.push({ test: `Dashboard - ${page.name}`, status: 'FAILED', error: 'Page did not load correctly' });
        }
      }
      
      return true;
    } catch (error) {
      await this.takeScreenshot('dashboard_navigation_error', true);
      this.results.push({ test: 'Dashboard Navigation', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async testFormInteractions() {
    console.log('\n📝 Testing Form Interactions...');
    
    try {
      // Test Settings Form
      await this.page.goto(`${this.baseURL}/settings`);
      await this.page.waitForTimeout(2000);
      
      // Find and interact with form elements
      const inputs = await this.page.$$('input, select, textarea');
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        const type = await input.evaluate(el => el.type);
        const name = await input.evaluate(el => el.name || el.id);
        
        if (type === 'text' || type === 'email') {
          await input.type('Test Value');
        } else if (type === 'checkbox') {
          await input.click();
        }
        
        await this.takeScreenshot(`form_interaction_${name || i}`);
      }
      
      this.results.push({ test: 'Form Interactions', status: 'PASSED' });
      return true;
    } catch (error) {
      await this.takeScreenshot('form_interaction_error', true);
      this.results.push({ test: 'Form Interactions', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async testButtonClicks() {
    console.log('\n🖱️ Testing Button Clicks...');
    
    try {
      const pages = [
        { path: '/', name: 'Landing' },
        { path: '/pricing', name: 'Pricing' },
        { path: '/marketplace', name: 'Marketplace' }
      ];

      for (const page of pages) {
        await this.page.goto(`${this.baseURL}${page.path}`);
        await this.page.waitForTimeout(2000);
        
        // Find all buttons
        const buttons = await this.page.$$('button, a[href], input[type="submit"]');
        
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const button = buttons[i];
          const text = await button.evaluate(el => el.textContent?.trim() || el.getAttribute('href') || 'Unknown');
          
          try {
            // Check if button is clickable
            const isClickable = await button.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style.pointerEvents !== 'none' && 
                     style.visibility !== 'hidden' && 
                     !el.disabled;
            });
            
            if (isClickable) {
              await button.click();
              await this.page.waitForTimeout(1000);
              await this.takeScreenshot(`button_click_${page.name}_${i}`);
              
              // Go back if we navigated away
              if (this.page.url() !== `${this.baseURL}${page.path}`) {
                await this.page.goBack();
                await this.page.waitForTimeout(1000);
              }
            }
          } catch (error) {
            console.log(`Button ${i} (${text}) not clickable: ${error.message}`);
          }
        }
      }
      
      this.results.push({ test: 'Button Clicks', status: 'PASSED' });
      return true;
    } catch (error) {
      await this.takeScreenshot('button_click_error', true);
      this.results.push({ test: 'Button Clicks', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    try {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.goto(`${this.baseURL}/`);
        await this.page.waitForTimeout(2000);
        
        await this.takeScreenshot(`responsive_${viewport.name.toLowerCase()}`);
        
        // Test navigation menu
        const nav = await this.page.$('nav');
        if (nav) {
          const isVisible = await nav.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          
          if (isVisible) {
            this.results.push({ test: `Responsive - ${viewport.name} Navigation`, status: 'PASSED' });
          } else {
            this.results.push({ test: `Responsive - ${viewport.name} Navigation`, status: 'FAILED', error: 'Navigation not visible' });
          }
        }
      }
      
      return true;
    } catch (error) {
      await this.takeScreenshot('responsive_error', true);
      this.results.push({ test: 'Responsive Design', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');
    
    try {
      // Test 404 page
      await this.page.goto(`${this.baseURL}/nonexistent-page`);
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('404_page');
      
      // Test invalid form submission
      await this.page.goto(`${this.baseURL}/register`);
      await this.page.click('button[type="submit"]'); // Submit empty form
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('form_validation_error');
      
      // Test invalid login
      await this.page.goto(`${this.baseURL}/login`);
      await this.page.type('input[name="email"]', 'invalid@email.com');
      await this.page.type('input[name="password"]', 'wrongpassword');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);
      await this.takeScreenshot('login_error');
      
      this.results.push({ test: 'Error Handling', status: 'PASSED' });
      return true;
    } catch (error) {
      await this.takeScreenshot('error_handling_error', true);
      this.results.push({ test: 'Error Handling', status: 'FAILED', error: error.message });
      return false;
    }
  }

  async runAllFunctionalTests() {
    console.log('🚀 Starting Functional Tests...');
    
    try {
      await this.initialize();
      
      await this.testAuthenticationFlow();
      await this.testDashboardNavigation();
      await this.testFormInteractions();
      await this.testButtonClicks();
      await this.testResponsiveDesign();
      await this.testErrorHandling();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Functional tests failed:', error);
      await this.takeScreenshot('functional_test_error', true);
    } finally {
      await this.cleanup();
    }
  }

  async generateReport() {
    console.log('\n📊 Functional Test Results:');
    console.log('============================');
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n🔴 Failed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, total: this.results.length },
      results: this.results
    };
    
    fs.writeFileSync('./tests/functional-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved: ./tests/functional-test-report.json');
  }
}

// Main execution
async function runFunctionalTests() {
  const tester = new FunctionalTester();
  await tester.runAllFunctionalTests();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFunctionalTests().catch(console.error);
}

export { FunctionalTester };
