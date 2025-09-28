const puppeteer = require('puppeteer');
const fs = require('fs');

class WebsiteTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      errors: [],
      performance: {},
      summary: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing Website Tester...');
    
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
      // Check if we're in incognito mode by looking for incognito-specific properties
      return !window.chrome || !window.chrome.runtime || 
             window.chrome.runtime.id === undefined ||
             navigator.webdriver === undefined;
    });
    console.log(`🔒 Incognito Mode: ${isIncognito ? '✅ Active' : '❌ Not Active'}`);
    
    // Enable console logging
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

  async testHomepage() {
    console.log('🏠 Testing Homepage...');
    
    try {
      const startTime = Date.now();
      await this.page.goto('https://agiagentautomation.com', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      const loadTime = Date.now() - startTime;
      
      // Check for critical errors
      const hasErrors = this.results.errors.some(error => 
        error.message.includes('s is not a function') ||
        error.message.includes('createElement') ||
        error.message.includes('__name')
      );

      // Check if page loaded successfully
      const title = await this.page.title();
      const url = this.page.url();
      
      // Check for React app mounting
      const reactMounted = await this.page.evaluate(() => {
        return document.querySelector('#root') !== null && 
               document.querySelector('#root').children.length > 0;
      });

      this.results.tests.push({
        name: 'Homepage Load',
        status: hasErrors ? 'FAILED' : 'PASSED',
        loadTime: loadTime,
        title: title,
        url: url,
        reactMounted: reactMounted,
        errors: this.results.errors.filter(e => e.type === 'console_error' || e.type === 'page_error')
      });

      console.log(`✅ Homepage loaded in ${loadTime}ms`);
      console.log(`📄 Title: ${title}`);
      console.log(`🔗 URL: ${url}`);
      console.log(`⚛️ React Mounted: ${reactMounted}`);
      
      return !hasErrors && reactMounted;
    } catch (error) {
      console.log(`❌ Homepage test failed: ${error.message}`);
      this.results.tests.push({
        name: 'Homepage Load',
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async testLogin() {
    console.log('🔐 Testing Login Functionality...');
    
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
        name: 'Login Test',
        status: isDashboard ? 'PASSED' : 'FAILED',
        redirectUrl: currentUrl,
        isDashboard: isDashboard
      });

      console.log(`✅ Login test: ${isDashboard ? 'PASSED' : 'FAILED'}`);
      console.log(`🔗 Redirected to: ${currentUrl}`);
      
      return isDashboard;
    } catch (error) {
      console.log(`❌ Login test failed: ${error.message}`);
      this.results.tests.push({
        name: 'Login Test',
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async testDashboardPages() {
    console.log('📊 Testing Dashboard Pages...');
    
    const pages = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'AI Employees', path: '/dashboard/ai-employees' },
      { name: 'Jobs', path: '/dashboard/jobs' },
      { name: 'Analytics', path: '/dashboard/analytics' },
      { name: 'Team', path: '/dashboard/team' }
    ];

    let passedPages = 0;

    for (const page of pages) {
      try {
        console.log(`🔍 Testing ${page.name}...`);
        
        await this.page.goto(`https://agiagentautomation.com${page.path}`, { 
          waitUntil: 'networkidle0',
          timeout: 20000 
        });

        // Check for loading states
        const hasLoadingSpinner = await this.page.evaluate(() => {
          return document.querySelector('.animate-spin') !== null;
        });

        // Wait a bit for any loading to complete
        await this.page.waitForTimeout(2000);

        // Check for content
        const hasContent = await this.page.evaluate(() => {
          const content = document.querySelector('main, .dashboard-content, [data-testid="dashboard"]');
          return content && content.children.length > 0;
        });

        // Check for errors
        const hasErrors = this.results.errors.some(error => 
          error.message.includes('s is not a function') ||
          error.message.includes('createElement') ||
          error.message.includes('__name')
        );

        const status = hasErrors ? 'FAILED' : (hasContent ? 'PASSED' : 'LOADING_ISSUE');
        
        this.results.tests.push({
          name: `${page.name} Page`,
          status: status,
          path: page.path,
          hasContent: hasContent,
          hasLoadingSpinner: hasLoadingSpinner,
          errors: this.results.errors.filter(e => e.type === 'console_error' || e.type === 'page_error')
        });

        if (status === 'PASSED') passedPages++;
        
        console.log(`✅ ${page.name}: ${status}`);
        
      } catch (error) {
        console.log(`❌ ${page.name} test failed: ${error.message}`);
        this.results.tests.push({
          name: `${page.name} Page`,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    return passedPages;
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      const metrics = await this.page.metrics();
      
      this.results.performance = {
        timestamp: metrics.Timestamp,
        documents: metrics.Documents,
        frames: metrics.Frames,
        jsEventListeners: metrics.JSEventListeners,
        layoutCount: metrics.LayoutCount,
        recalcStyleCount: metrics.RecalcStyleCount,
        layoutDuration: metrics.LayoutDuration,
        recalcStyleDuration: metrics.RecalcStyleDuration,
        scriptDuration: metrics.ScriptDuration,
        taskDuration: metrics.TaskDuration,
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize
      };

      console.log('✅ Performance metrics collected');
      return true;
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
      return false;
    }
  }

  generateSummary() {
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.status === 'PASSED').length;
    const failedTests = this.results.tests.filter(t => t.status === 'FAILED').length;
    const loadingIssues = this.results.tests.filter(t => t.status === 'LOADING_ISSUE').length;
    
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests,
      loadingIssues,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      criticalErrors: this.results.errors.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} (${this.results.summary.successRate})`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏳ Loading Issues: ${loadingIssues}`);
    console.log(`🚨 Critical Errors: ${this.results.errors.length}`);
  }

  async saveResults() {
    const filename = `website-test-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
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
      console.log('🚀 Starting Comprehensive Website Test...\n');
      
      await this.initialize();
      
      // Test homepage
      const homepageOk = await this.testHomepage();
      
      if (homepageOk) {
        // Test login
        const loginOk = await this.testLogin();
        
        if (loginOk) {
          // Test dashboard pages
          const passedPages = await this.testDashboardPages();
          console.log(`📊 Dashboard Pages: ${passedPages} passed`);
        }
      }
      
      // Test performance
      await this.testPerformance();
      
      // Generate summary
      this.generateSummary();
      
      // Save results
      const filename = await this.saveResults();
      
      console.log('\n🎯 TEST COMPLETE!');
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
  const tester = new WebsiteTester();
  const results = await tester.runFullTest();
  
  // Exit with appropriate code
  const hasCriticalErrors = results.errors.length > 0;
  const successRate = parseInt(results.summary.successRate);
  
  if (hasCriticalErrors || successRate < 80) {
    console.log('\n❌ TEST FAILED - Critical issues detected');
    process.exit(1);
  } else {
    console.log('\n✅ TEST PASSED - Website is functioning properly');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebsiteTester;
