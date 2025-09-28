// Debug Page Loading Issues
import puppeteer from 'puppeteer';

console.log('🔍 DEBUGGING PAGE LOADING ISSUES');
console.log('=================================');

class PageLoadingDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
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
        return true;
      } else {
        throw new Error('Login failed - not redirected to dashboard');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  }

  async debugPageContent(pageName, pageUrl) {
    console.log(`\n🔍 Debugging ${pageName}`);
    console.log('='.repeat(50));
    
    try {
      await this.page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check what's actually on the page
      const pageContent = await this.page.evaluate(() => {
        const body = document.body;
        const text = body.innerText;
        const html = body.innerHTML;
        
        // Look for loading indicators
        const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner, .animate-spin');
        const errorElements = document.querySelectorAll('[data-testid="error"], .error');
        const emptyStateElements = document.querySelectorAll('[data-testid="empty-state"], .empty-state');
        
        // Look for actual content
        const mainContent = document.querySelector('main, .main-content, [role="main"]');
        const cards = document.querySelectorAll('.card, [data-testid="card"]');
        const buttons = document.querySelectorAll('button');
        const headings = document.querySelectorAll('h1, h2, h3');
        
        return {
          hasLoading: loadingElements.length > 0,
          hasError: errorElements.length > 0,
          hasEmptyState: emptyStateElements.length > 0,
          hasMainContent: mainContent !== null,
          cardCount: cards.length,
          buttonCount: buttons.length,
          headingCount: headings.length,
          textLength: text.length,
          hasText: text.length > 100,
          visibleText: text.substring(0, 500),
          loadingText: Array.from(loadingElements).map(el => el.textContent),
          errorText: Array.from(errorElements).map(el => el.textContent),
          emptyStateText: Array.from(emptyStateElements).map(el => el.textContent)
        };
      });
      
      console.log(`📄 ${pageName} Content Analysis:`);
      console.log(`  - Has Loading: ${pageContent.hasLoading}`);
      console.log(`  - Has Error: ${pageContent.hasError}`);
      console.log(`  - Has Empty State: ${pageContent.hasEmptyState}`);
      console.log(`  - Has Main Content: ${pageContent.hasMainContent}`);
      console.log(`  - Cards: ${pageContent.cardCount}`);
      console.log(`  - Buttons: ${pageContent.buttonCount}`);
      console.log(`  - Headings: ${pageContent.headingCount}`);
      console.log(`  - Text Length: ${pageContent.textLength}`);
      console.log(`  - Has Text: ${pageContent.hasText}`);
      
      if (pageContent.loadingText.length > 0) {
        console.log(`  - Loading Text: ${pageContent.loadingText.join(', ')}`);
      }
      
      if (pageContent.errorText.length > 0) {
        console.log(`  - Error Text: ${pageContent.errorText.join(', ')}`);
      }
      
      if (pageContent.emptyStateText.length > 0) {
        console.log(`  - Empty State Text: ${pageContent.emptyStateText.join(', ')}`);
      }
      
      console.log(`  - Visible Text: ${pageContent.visibleText}`);
      
      // Take a screenshot for visual debugging
      await this.page.screenshot({ 
        path: `debug-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
      
      console.log(`📸 Screenshot saved: debug-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`);
      
    } catch (error) {
      console.error(`❌ Error debugging ${pageName}:`, error.message);
    }
  }

  async debugAllPages() {
    console.log('\n📊 STEP 3: Debugging All Pages');
    console.log('-------------------------------');
    
    const pagesToDebug = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'AI Employees', url: '/dashboard/ai-employees' },
      { name: 'Jobs', url: '/dashboard/jobs' },
      { name: 'Analytics', url: '/dashboard/analytics' },
      { name: 'Profile', url: '/dashboard/profile' },
      { name: 'Billing', url: '/dashboard/billing' },
      { name: 'Notifications', url: '/dashboard/notifications' },
      { name: 'Settings', url: '/dashboard/settings' },
      { name: 'Team', url: '/dashboard/team' },
      { name: 'Reports', url: '/dashboard/reports' },
      { name: 'API Keys', url: '/dashboard/api-keys' }
    ];
    
    for (const page of pagesToDebug) {
      await this.debugPageContent(page.name, `${this.baseUrl}${page.url}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - stopping debug');
        return;
      }
      
      await this.debugAllPages();
      
      console.log('\n🎯 DEBUG COMPLETED!');
      console.log('===================');
      console.log('Check the screenshots and console output above to see what\'s happening on each page.');
      
    } catch (error) {
      console.error('❌ Debug failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the debug
const pageDebugger = new PageLoadingDebugger();
pageDebugger.run().catch(error => {
  console.error('❌ Debug crashed:', error);
});
