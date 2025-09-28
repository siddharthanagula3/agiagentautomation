const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class WebsiteTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  async init() {
    console.log('🚀 Starting Puppeteer Website Test Suite...\n');

    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();

    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Enable request interception for monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      if (request.url().includes('.js') || request.url().includes('.css')) {
        console.log(`📄 Loading: ${request.url().split('/').pop()}`);
      }
      request.continue();
    });

    // Listen for console messages and errors
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.log(`❌ Console Error: ${text}`);
        this.testResults.summary.errors.push({
          type: 'console',
          message: text,
          timestamp: new Date().toISOString()
        });
      } else if (type === 'warn') {
        console.log(`⚠️  Console Warning: ${text}`);
      } else if (text.includes('TDZ') || text.includes('protection')) {
        console.log(`🛡️  TDZ Protection: ${text}`);
      }
    });

    this.page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
      this.testResults.summary.errors.push({
        type: 'runtime',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.summary.total++;
    const startTime = Date.now();

    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFunction();

      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      this.testResults.summary.passed++;
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      this.testResults.summary.failed++;
      console.log(`❌ FAILED: ${testName} - ${error.message} (${duration}ms)`);
    }
  }

  async testWebsiteLoading() {
    await this.runTest('Website Loading & TDZ Error Check', async () => {
      // Test both local preview and live website
      const urls = [
        'http://localhost:8085', // Local preview
        'https://agiagentautomation.com' // Live website
      ];

      for (const url of urls) {
        console.log(`  📍 Testing: ${url}`);

        try {
          // Navigate with extended timeout
          await this.page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });

          // Wait for potential errors to surface
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Check if we're seeing the error screen
          const errorContainer = await this.page.$('.error-container');
          const isErrorVisible = errorContainer ? await this.page.evaluate(el =>
            getComputedStyle(el).display !== 'none', errorContainer) : false;

          if (isErrorVisible) {
            const errorText = await this.page.$eval('.error-details', el => el.textContent);
            throw new Error(`Error screen visible: ${errorText}`);
          }

          // Check if React app has mounted (root has children)
          const hasAppMounted = await this.page.evaluate(() => {
            const root = document.getElementById('root');
            return root && root.children.length > 0;
          });

          if (!hasAppMounted) {
            throw new Error('React app failed to mount');
          }

          // Check for TDZ protection
          const tdzProtectionActive = await this.page.evaluate(() => {
            return typeof window.__preventTDZ === 'function' && typeof window.C !== 'undefined';
          });

          if (!tdzProtectionActive) {
            console.log('  ⚠️  TDZ protection not detected');
          } else {
            console.log('  🛡️  TDZ protection active');
          }

          console.log(`  ✅ ${url} loaded successfully`);

        } catch (error) {
          if (url.includes('localhost')) {
            console.log(`  ⚠️  Local server not available: ${url}`);
          } else {
            throw error; // Re-throw for live website failures
          }
        }
      }
    });
  }

  async testPageNavigation() {
    await this.runTest('Page Navigation Test', async () => {
      // Test navigation to key pages
      const pages = [
        { name: 'Landing Page', selector: 'h1', expectedText: ['AGI', 'Agent', 'Automation'] },
        { name: 'About Page', path: '/about', selector: 'h1' },
        { name: 'Features Page', path: '/features', selector: 'h1' },
        { name: 'Contact Page', path: '/contact', selector: 'h1' },
        { name: 'Auth Login', path: '/auth/login', selector: 'form' },
        { name: 'Auth Register', path: '/auth/register', selector: 'form' }
      ];

      for (const pageTest of pages) {
        try {
          const url = pageTest.path ?
            `https://agiagentautomation.com${pageTest.path}` :
            'https://agiagentautomation.com';

          await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check if the expected element exists
          const element = await this.page.$(pageTest.selector);
          if (!element) {
            throw new Error(`Expected element "${pageTest.selector}" not found on ${pageTest.name}`);
          }

          // For landing page, check specific text content
          if (pageTest.expectedText) {
            const text = await this.page.$eval(pageTest.selector, el => el.textContent);
            const hasExpectedText = pageTest.expectedText.some(expected =>
              text.toLowerCase().includes(expected.toLowerCase())
            );

            if (!hasExpectedText) {
              throw new Error(`Expected text not found on ${pageTest.name}. Found: "${text}"`);
            }
          }

          console.log(`  ✅ ${pageTest.name} navigation successful`);

        } catch (error) {
          console.log(`  ❌ ${pageTest.name} failed: ${error.message}`);
          throw error;
        }
      }
    });
  }

  async testResponsiveness() {
    await this.runTest('Responsive Design Test', async () => {
      const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.goto('https://agiagentautomation.com', {
          waitUntil: 'networkidle0',
          timeout: 15000
        });

        // Check if content is visible
        const contentVisible = await this.page.evaluate(() => {
          const root = document.getElementById('root');
          return root && root.offsetHeight > 0;
        });

        if (!contentVisible) {
          throw new Error(`Content not visible on ${viewport.name}`);
        }

        console.log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height}) responsive`);
      }

      // Reset to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
    });
  }

  async testPerformance() {
    await this.runTest('Performance Metrics', async () => {
      await this.page.goto('https://agiagentautomation.com', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const metrics = await this.page.metrics();
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      console.log(`  📊 Load Time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
      console.log(`  📊 DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`  📊 First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
      console.log(`  📊 First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`  📊 JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);

      // Performance thresholds
      if (performanceMetrics.loadTime > 5000) {
        throw new Error(`Load time too slow: ${performanceMetrics.loadTime}ms`);
      }

      if (performanceMetrics.firstContentfulPaint > 3000) {
        throw new Error(`First Contentful Paint too slow: ${performanceMetrics.firstContentfulPaint}ms`);
      }
    });
  }

  async testAccessibility() {
    await this.runTest('Basic Accessibility Check', async () => {
      await this.page.goto('https://agiagentautomation.com', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Check for basic accessibility features
      const a11yChecks = await this.page.evaluate(() => {
        return {
          hasTitle: document.title && document.title.trim().length > 0,
          hasLang: document.documentElement.lang && document.documentElement.lang.trim().length > 0,
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasSkipLinks: document.querySelectorAll('a[href^="#"]').length > 0,
          hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0
        };
      });

      console.log(`  📋 Title present: ${a11yChecks.hasTitle}`);
      console.log(`  📋 Language attribute: ${a11yChecks.hasLang}`);
      console.log(`  📋 Heading structure: ${a11yChecks.hasHeadings}`);
      console.log(`  📋 Skip links: ${a11yChecks.hasSkipLinks}`);
      console.log(`  📋 ARIA labels: ${a11yChecks.hasAriaLabels}`);

      if (!a11yChecks.hasTitle) {
        throw new Error('Page title missing');
      }

      if (!a11yChecks.hasHeadings) {
        throw new Error('No heading elements found');
      }
    });
  }

  async generateReport() {
    const reportData = {
      ...this.testResults,
      summary: {
        ...this.testResults.summary,
        successRate: `${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}%`
      }
    };

    // Generate JSON report
    fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Website Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test.passed { border-left-color: #28a745; }
        .test.failed { border-left-color: #dc3545; }
        .errors { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Website Test Report</h1>
        <p><strong>Generated:</strong> ${reportData.timestamp}</p>
        <p><strong>Website:</strong> agiagentautomation.com</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 24px; font-weight: bold;">${reportData.summary.total}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${reportData.summary.passed}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${reportData.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 24px; font-weight: bold;">${reportData.summary.successRate}</div>
        </div>
    </div>

    <h2>📋 Test Results</h2>
    ${reportData.tests.map(test => `
        <div class="test ${test.status.toLowerCase()}">
            <h4>${test.name} <span style="float: right;">${test.status} (${test.duration})</span></h4>
            ${test.error ? `<p style="color: #dc3545;"><strong>Error:</strong> ${test.error}</p>` : ''}
        </div>
    `).join('')}

    ${reportData.summary.errors.length > 0 ? `
        <div class="errors">
            <h3>⚠️ Runtime Errors Detected</h3>
            ${reportData.summary.errors.map(error => `
                <p><strong>${error.type}:</strong> ${error.message} <em>(${error.timestamp})</em></p>
            `).join('')}
        </div>
    ` : ''}

    <footer style="margin-top: 40px; text-align: center; color: #666;">
        <p>Generated by Puppeteer Website Test Suite</p>
    </footer>
</body>
</html>`;

    fs.writeFileSync('test-report.html', htmlReport);

    console.log('\n📊 Test Report Generated:');
    console.log('  • test-report.json (detailed JSON data)');
    console.log('  • test-report.html (visual report)');
  }

  async run() {
    try {
      await this.init();

      // Run all test suites
      await this.testWebsiteLoading();
      await this.testPageNavigation();
      await this.testResponsiveness();
      await this.testPerformance();
      await this.testAccessibility();

      // Generate reports
      await this.generateReport();

      // Print summary
      console.log('\n🎯 TEST SUMMARY:');
      console.log(`   Total Tests: ${this.testResults.summary.total}`);
      console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
      console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
      console.log(`   📈 Success Rate: ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}%`);

      if (this.testResults.summary.errors.length > 0) {
        console.log(`   ⚠️  Runtime Errors: ${this.testResults.summary.errors.length}`);
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test suite
const testSuite = new WebsiteTestSuite();
testSuite.run().then(() => {
  console.log('\n🎉 Test suite completed!');
}).catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});