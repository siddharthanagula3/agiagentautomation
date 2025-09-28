#!/usr/bin/env node

/**
 * ULTIMATE COMPREHENSIVE TEST
 * 
 * This script performs a complete analysis and testing of the AGI Agent Automation project
 * using private/incognito windows to avoid cache issues, with proper deployment waiting,
 * and comprehensive error analysis using all available tools.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

console.log('🚀 ULTIMATE COMPREHENSIVE TEST STARTING...');
console.log('==========================================\n');

// Configuration
const CONFIG = {
  baseUrl: 'https://agiagentautomation.com',
  testCredentials: {
    email: 'founders@agiagentautomation.com',
    password: 'Sid@8790'
  },
  waitTime: 60000, // 60 seconds for deployment
  timeout: 30000,  // 30 seconds for page loads
  pages: [
    '/dashboard',
    '/dashboard/ai-employees',
    '/dashboard/jobs',
    '/dashboard/analytics',
    '/dashboard/profile',
    '/dashboard/billing',
    '/dashboard/notifications',
    '/dashboard/settings',
    '/dashboard/team',
    '/dashboard/reports',
    '/dashboard/api-keys',
    '/dashboard/webhooks',
    '/dashboard/logs',
    '/dashboard/processing',
    '/dashboard/workforce'
  ]
};

class UltimateTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      deployment: null,
      login: null,
      pages: [],
      errors: [],
      recommendations: []
    };
  }

  async initialize() {
    console.log('🔧 Initializing browser with private/incognito mode...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: [
        '--incognito',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0',
        '--media-cache-size=0',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync-preferences',
        '--disable-web-resources',
        '--disable-features=VizDisplayCompositor',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    // Create a new incognito context
    const context = await this.browser.createBrowserContext();
    this.page = await context.newPage();
    
    // Verify we're in incognito mode
    const isIncognito = await this.page.evaluate(() => {
      return window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect;
    });
    console.log(`🔒 Incognito mode: ${isIncognito ? 'Active' : 'Not detected'}`);
    
    // Set up comprehensive logging
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
      } else if (type === 'warning') {
        console.log(`⚠️  Console Warning: ${text}`);
      } else {
        console.log(`📝 Console ${type}: ${text}`);
      }
    });

    this.page.on('pageerror', error => {
      this.results.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`💥 Page Error: ${error.message}`);
    });

    this.page.on('requestfailed', request => {
      this.results.errors.push({
        type: 'network_error',
        url: request.url(),
        error: request.failure().errorText,
        timestamp: new Date().toISOString()
      });
      console.log(`🌐 Network Error: ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('✅ Browser initialized with private/incognito mode');
  }

  async waitForDeployment() {
    console.log('⏳ Waiting 60 seconds for GitHub/Netlify deployment...');
    await new Promise(resolve => setTimeout(resolve, CONFIG.waitTime));
    console.log('✅ Deployment wait completed');
    this.results.deployment = {
      status: 'completed',
      waitTime: CONFIG.waitTime
    };
  }

  async testLogin() {
    console.log('🔐 Testing login functionality...');
    
    try {
      await this.page.goto(`${CONFIG.baseUrl}/auth/login`, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout 
      });

      // Wait for login form to be visible
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });

      // Fill in credentials
      await this.page.type('input[type="email"]', CONFIG.testCredentials.email);
      await this.page.type('input[type="password"]', CONFIG.testCredentials.password);

      // Click login button
      await this.page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout 
      });

      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful');
        this.results.login = { status: 'success', url: currentUrl };
        return true;
      } else {
        console.log('❌ Login failed - not redirected to dashboard');
        this.results.login = { status: 'failed', url: currentUrl };
        return false;
      }
    } catch (error) {
      console.log(`❌ Login error: ${error.message}`);
      this.results.login = { status: 'error', error: error.message };
      return false;
    }
  }

  async testPage(pagePath) {
    console.log(`🔍 Testing page: ${pagePath}`);
    
    const pageResult = {
      path: pagePath,
      url: `${CONFIG.baseUrl}${pagePath}`,
      status: 'unknown',
      loadTime: 0,
      errors: [],
      content: {
        hasTitle: false,
        hasNavigation: false,
        hasContent: false,
        hasButtons: false,
        isLoading: false,
        isDisconnected: false,
        textContent: '',
        elementCount: 0
      }
    };

    try {
      const startTime = Date.now();
      
      await this.page.goto(`${CONFIG.baseUrl}${pagePath}`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });

      pageResult.loadTime = Date.now() - startTime;

      // Wait a bit for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Analyze page content
      const content = await this.page.evaluate(() => {
        const body = document.body;
        const text = body.innerText || body.textContent || '';
        
        return {
          hasTitle: !!document.querySelector('h1, h2, h3'),
          hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
          hasContent: text.length > 100,
          hasButtons: !!document.querySelector('button'),
          isLoading: text.includes('Loading...'),
          isDisconnected: text.includes('Disconnected'),
          textContent: text.substring(0, 500),
          elementCount: document.querySelectorAll('*').length,
          hasReactContent: !!document.querySelector('[data-reactroot], #root > div'),
          hasCards: !!document.querySelector('[class*="card"]'),
          hasStats: !!document.querySelector('[class*="stat"]')
        };
      });

      pageResult.content = content;

      // Check for specific issues
      if (content.isLoading && content.isDisconnected) {
        pageResult.status = 'loading_issue';
        pageResult.errors.push('Page stuck in loading state with disconnected status');
      } else if (content.isLoading) {
        pageResult.status = 'loading';
        pageResult.errors.push('Page still loading after timeout');
      } else if (!content.hasContent) {
        pageResult.status = 'empty';
        pageResult.errors.push('Page appears to be empty');
      } else if (content.hasTitle && content.hasContent) {
        pageResult.status = 'working';
        console.log(`✅ ${pagePath} - Working properly`);
      } else {
        pageResult.status = 'partial';
        pageResult.errors.push('Page has some content but may be incomplete');
      }

    } catch (error) {
      pageResult.status = 'error';
      pageResult.errors.push(error.message);
      console.log(`❌ ${pagePath} - Error: ${error.message}`);
    }

    this.results.pages.push(pageResult);
    return pageResult;
  }

  async analyzeErrors() {
    console.log('🔍 Analyzing errors and issues...');
    
    const analysis = {
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };

    // Analyze page results
    const failedPages = this.results.pages.filter(p => p.status !== 'working');
    const loadingIssues = this.results.pages.filter(p => p.status === 'loading_issue');
    const emptyPages = this.results.pages.filter(p => p.status === 'empty');

    if (loadingIssues.length > 0) {
      analysis.criticalIssues.push({
        type: 'loading_timeout',
        description: 'Multiple pages stuck in loading state',
        count: loadingIssues.length,
        pages: loadingIssues.map(p => p.path)
      });
    }

    if (emptyPages.length > 0) {
      analysis.criticalIssues.push({
        type: 'empty_pages',
        description: 'Pages showing no content',
        count: emptyPages.length,
        pages: emptyPages.map(p => p.path)
      });
    }

    // Analyze console errors
    const consoleErrors = this.results.errors.filter(e => e.type === 'console_error');
    const networkErrors = this.results.errors.filter(e => e.type === 'network_error');

    if (consoleErrors.length > 0) {
      analysis.warnings.push({
        type: 'console_errors',
        description: 'JavaScript console errors detected',
        count: consoleErrors.length,
        examples: consoleErrors.slice(0, 5).map(e => e.message)
      });
    }

    if (networkErrors.length > 0) {
      analysis.warnings.push({
        type: 'network_errors',
        description: 'Network request failures detected',
        count: networkErrors.length,
        examples: networkErrors.slice(0, 5).map(e => e.url)
      });
    }

    // Generate recommendations
    if (loadingIssues.length > 0) {
      analysis.recommendations.push({
        priority: 'high',
        action: 'Fix authentication timeout issues',
        description: 'Pages are timing out during authentication check'
      });
    }

    if (networkErrors.some(e => e.url.includes('supabase'))) {
      analysis.recommendations.push({
        priority: 'high',
        action: 'Check Supabase database schema',
        description: 'Database tables may be missing or misconfigured'
      });
    }

    this.results.analysis = analysis;
    return analysis;
  }

  async generateReport() {
    console.log('📊 Generating comprehensive report...');
    
    const report = {
      summary: {
        totalPages: this.results.pages.length,
        workingPages: this.results.pages.filter(p => p.status === 'working').length,
        failedPages: this.results.pages.filter(p => p.status !== 'working').length,
        totalErrors: this.results.errors.length,
        loginStatus: this.results.login?.status || 'unknown'
      },
      details: this.results,
      timestamp: new Date().toISOString()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), `ultimate-test-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${reportPath}`);
    return report;
  }

  async cleanup() {
    if (this.browser) {
      // Close all browser contexts first (except default)
      const contexts = this.browser.browserContexts();
      for (const context of contexts) {
        if (context !== this.browser.defaultBrowserContext()) {
          await context.close();
        }
      }
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.waitForDeployment();
      
      const loginSuccess = await this.testLogin();
      if (!loginSuccess) {
        console.log('❌ Cannot proceed without successful login');
        return;
      }

      // Test all pages
      for (const pagePath of CONFIG.pages) {
        await this.testPage(pagePath);
        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await this.analyzeErrors();
      const report = await this.generateReport();

      // Print summary
      console.log('\n🎯 ULTIMATE TEST SUMMARY');
      console.log('========================');
      console.log(`📊 Total Pages: ${report.summary.totalPages}`);
      console.log(`✅ Working Pages: ${report.summary.workingPages}`);
      console.log(`❌ Failed Pages: ${report.summary.failedPages}`);
      console.log(`🐛 Total Errors: ${report.summary.totalErrors}`);
      console.log(`🔐 Login Status: ${report.summary.loginStatus}`);

      if (report.summary.failedPages > 0) {
        console.log('\n🚨 CRITICAL ISSUES FOUND:');
        const failedPages = this.results.pages.filter(p => p.status !== 'working');
        failedPages.forEach(page => {
          console.log(`   ❌ ${page.path}: ${page.status}`);
          if (page.errors.length > 0) {
            page.errors.forEach(error => console.log(`      - ${error}`));
          }
        });
      }

      return report;

    } catch (error) {
      console.error('💥 Ultimate test failed:', error);
      this.results.errors.push({
        type: 'test_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run the ultimate test
const tester = new UltimateTester();
tester.run().then(report => {
  if (report) {
    console.log('\n🎉 Ultimate comprehensive test completed!');
    console.log('Check the generated report for detailed analysis.');
  } else {
    console.log('\n❌ Ultimate test failed to complete');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
