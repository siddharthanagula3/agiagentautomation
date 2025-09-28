// Verify Loading Fix
import puppeteer from 'puppeteer';

console.log('🔍 VERIFYING LOADING FIX');
console.log('========================');

class LoadingFixVerifier {
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

  async verifyPage(pageName, pageUrl) {
    console.log(`\n🔍 Verifying ${pageName}`);
    console.log('='.repeat(40));
    
    try {
      await this.page.goto(`${this.baseUrl}${pageUrl}`, { waitUntil: 'networkidle2' });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pageAnalysis = await this.page.evaluate(() => {
        const body = document.body;
        const text = body.innerText;
        
        // Check for loading states
        const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner, .animate-spin');
        const loadingText = Array.from(loadingElements).map(el => el.textContent).join(' ');
        
        // Look for content
        const titles = document.querySelectorAll('h1, h2, h3');
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        
        return {
          textLength: text.length,
          hasText: text.length > 100,
          visibleText: text.substring(0, 200),
          isLoading: loadingText.includes('Loading') || text.includes('Loading...'),
          titleCount: titles.length,
          buttonCount: buttons.length,
          linkCount: links.length,
          titleText: Array.from(titles).map(t => t.textContent)
        };
      });
      
      console.log(`📊 ${pageName} Analysis:`);
      console.log(`  - Text Length: ${pageAnalysis.textLength}`);
      console.log(`  - Has Text: ${pageAnalysis.hasText}`);
      console.log(`  - Is Loading: ${pageAnalysis.isLoading}`);
      console.log(`  - Titles: ${pageAnalysis.titleCount}`);
      console.log(`  - Buttons: ${pageAnalysis.buttonCount}`);
      console.log(`  - Links: ${pageAnalysis.linkCount}`);
      
      if (pageAnalysis.titleText.length > 0) {
        console.log(`  - Title Text: ${pageAnalysis.titleText.join(', ')}`);
      }
      
      console.log(`  - Visible Text: ${pageAnalysis.visibleText}`);
      
      if (pageAnalysis.isLoading) {
        console.log(`❌ ${pageName}: Still showing loading state`);
        return false;
      } else if (pageAnalysis.hasText) {
        console.log(`✅ ${pageName}: Showing content (not loading)`);
        return true;
      } else {
        console.log(`⚠️  ${pageName}: No content visible`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error verifying ${pageName}:`, error.message);
      return false;
    }
  }

  async verifyAllPages() {
    console.log('\n📊 STEP 3: Verifying All Pages');
    console.log('-------------------------------');
    
    const pagesToVerify = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'AI Employees', url: '/dashboard/ai-employees' },
      { name: 'Jobs', url: '/dashboard/jobs' },
      { name: 'Analytics', url: '/dashboard/analytics' }
    ];
    
    let workingCount = 0;
    let totalCount = pagesToVerify.length;
    
    for (const page of pagesToVerify) {
      const isWorking = await this.verifyPage(page.name, page.url);
      if (isWorking) workingCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`✅ Working Pages: ${workingCount}/${totalCount}`);
    console.log(`❌ Still Loading: ${totalCount - workingCount}/${totalCount}`);
    
    if (workingCount === totalCount) {
      console.log('\n🎉 SUCCESS: All pages are now working!');
    } else if (workingCount > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some pages are working');
    } else {
      console.log('\n❌ FAILED: All pages still showing loading states');
    }
    
    return { workingCount, totalCount };
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - cannot verify pages');
        return;
      }
      
      const results = await this.verifyAllPages();
      
      console.log('\n🎯 LOADING FIX VERIFICATION COMPLETED!');
      console.log('======================================');
      console.log(`📊 Results: ${results.workingCount}/${results.totalCount} pages working`);
      
    } catch (error) {
      console.error('❌ Loading fix verification failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the loading fix verifier
const verifier = new LoadingFixVerifier();
verifier.run().catch(error => {
  console.error('❌ Loading fix verifier crashed:', error);
});
