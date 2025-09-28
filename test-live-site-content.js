// Test Live Site Content
import puppeteer from 'puppeteer';

console.log('🔍 TESTING LIVE SITE CONTENT');
console.log('============================');

class LiveSiteTester {
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

  async testPage(pageName, pageUrl) {
    console.log(`\n🔍 Testing ${pageName}`);
    console.log('='.repeat(40));
    
    try {
      await this.page.goto(`${this.baseUrl}${pageUrl}`, { waitUntil: 'networkidle2' });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pageAnalysis = await this.page.evaluate(() => {
        const body = document.body;
        const text = body.innerText;
        
        // Check for specific elements
        const titles = document.querySelectorAll('h1, h2, h3');
        const buttons = document.querySelectorAll('button');
        const cards = document.querySelectorAll('[class*="card"]');
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin');
        
        // Check for React errors in console
        const consoleErrors = [];
        
        return {
          textLength: text.length,
          hasText: text.length > 100,
          visibleText: text.substring(0, 500),
          titleCount: titles.length,
          buttonCount: buttons.length,
          cardCount: cards.length,
          loadingCount: loadingElements.length,
          titleText: Array.from(titles).map(t => t.textContent),
          buttonText: Array.from(buttons).map(b => b.textContent),
          hasReactContent: text.includes('Dashboard') || text.includes('AI Employees') || text.includes('Jobs'),
          isCompletelyEmpty: text.length < 50,
          hasNavigation: document.querySelector('nav') !== null,
          hasSidebar: document.querySelector('[class*="sidebar"]') !== null
        };
      });
      
      console.log(`📊 ${pageName} Analysis:`);
      console.log(`  - Text Length: ${pageAnalysis.textLength}`);
      console.log(`  - Has Text: ${pageAnalysis.hasText}`);
      console.log(`  - Is Completely Empty: ${pageAnalysis.isCompletelyEmpty}`);
      console.log(`  - Has React Content: ${pageAnalysis.hasReactContent}`);
      console.log(`  - Titles: ${pageAnalysis.titleCount}`);
      console.log(`  - Buttons: ${pageAnalysis.buttonCount}`);
      console.log(`  - Cards: ${pageAnalysis.cardCount}`);
      console.log(`  - Loading Elements: ${pageAnalysis.loadingCount}`);
      console.log(`  - Has Navigation: ${pageAnalysis.hasNavigation}`);
      console.log(`  - Has Sidebar: ${pageAnalysis.hasSidebar}`);
      
      if (pageAnalysis.titleText.length > 0) {
        console.log(`  - Title Text: ${pageAnalysis.titleText.join(', ')}`);
      }
      
      if (pageAnalysis.buttonText.length > 0) {
        console.log(`  - Button Text: ${pageAnalysis.buttonText.slice(0, 5).join(', ')}`);
      }
      
      console.log(`  - Visible Text: ${pageAnalysis.visibleText}`);
      
      if (pageAnalysis.isCompletelyEmpty) {
        console.log(`❌ ${pageName}: Completely empty - no content rendered`);
        return false;
      } else if (pageAnalysis.hasReactContent) {
        console.log(`✅ ${pageName}: Has React content`);
        return true;
      } else {
        console.log(`⚠️  ${pageName}: Some content but may not be React components`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${pageName}:`, error.message);
      return false;
    }
  }

  async testAllPages() {
    console.log('\n📊 STEP 3: Testing All Pages');
    console.log('-----------------------------');
    
    const pagesToTest = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'AI Employees', url: '/dashboard/ai-employees' },
      { name: 'Jobs', url: '/dashboard/jobs' },
      { name: 'Analytics', url: '/dashboard/analytics' }
    ];
    
    let workingCount = 0;
    let totalCount = pagesToTest.length;
    
    for (const page of pagesToTest) {
      const isWorking = await this.testPage(page.name, page.url);
      if (isWorking) workingCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n📊 TEST RESULTS:`);
    console.log(`✅ Working Pages: ${workingCount}/${totalCount}`);
    console.log(`❌ Empty Pages: ${totalCount - workingCount}/${totalCount}`);
    
    if (workingCount === totalCount) {
      console.log('\n🎉 SUCCESS: All pages are now working!');
    } else if (workingCount > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some pages are working');
    } else {
      console.log('\n❌ FAILED: All pages are still empty');
    }
    
    return { workingCount, totalCount };
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - cannot test pages');
        return;
      }
      
      const results = await this.testAllPages();
      
      console.log('\n🎯 LIVE SITE TEST COMPLETED!');
      console.log('============================');
      console.log(`📊 Results: ${results.workingCount}/${results.totalCount} pages working`);
      
    } catch (error) {
      console.error('❌ Live site test failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the live site tester
const tester = new LiveSiteTester();
tester.run().catch(error => {
  console.error('❌ Live site tester crashed:', error);
});
