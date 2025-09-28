// Comprehensive Debug Test
import puppeteer from 'puppeteer';

console.log('🔍 COMPREHENSIVE DEBUG TEST');
console.log('===========================');

class ComprehensiveDebugger {
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
    
    // Capture console logs
    this.page.on('console', msg => {
      console.log('CONSOLE:', msg.text());
    });
    
    // Capture network errors
    this.page.on('response', response => {
      if (!response.ok()) {
        console.log('NETWORK ERROR:', response.url(), response.status());
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async performLogin() {
    console.log('\n📊 STEP 2: Performing Login');
    console.log('----------------------------');
    
    try {
      await this.page.goto(`${this.baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      await this.page.type('input[type="email"]', this.credentials.email);
      await this.page.type('input[type="password"]', this.credentials.password);
      
      const loginButton = await this.page.$('button[type="submit"]');
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

  async debugPage(pageName, pageUrl) {
    console.log(`\n🔍 DEBUGGING ${pageName}`);
    console.log('='.repeat(50));
    
    try {
      await this.page.goto(`${this.baseUrl}${pageUrl}`, { waitUntil: 'networkidle2' });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const debugInfo = await this.page.evaluate(() => {
        const body = document.body;
        const text = body.innerText;
        
        // Check for React errors
        const reactErrors = [];
        const errorElements = document.querySelectorAll('[data-react-error]');
        errorElements.forEach(el => {
          reactErrors.push(el.textContent);
        });
        
        // Check for JavaScript errors
        const jsErrors = [];
        const errorScripts = document.querySelectorAll('script');
        errorScripts.forEach(script => {
          if (script.textContent.includes('error') || script.textContent.includes('Error')) {
            jsErrors.push(script.textContent.substring(0, 200));
          }
        });
        
        // Check for specific elements
        const titles = document.querySelectorAll('h1, h2, h3');
        const buttons = document.querySelectorAll('button');
        const cards = document.querySelectorAll('[class*="card"]');
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin');
        
        // Check for React root
        const reactRoot = document.querySelector('#root');
        const reactRootContent = reactRoot ? reactRoot.innerHTML : 'No React root found';
        
        // Check for any JavaScript errors in the page
        const allScripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent);
        const hasErrors = allScripts.some(script => 
          script.includes('TypeError') || 
          script.includes('ReferenceError') || 
          script.includes('SyntaxError')
        );
        
        return {
          textLength: text.length,
          hasText: text.length > 100,
          visibleText: text.substring(0, 1000),
          titleCount: titles.length,
          buttonCount: buttons.length,
          cardCount: cards.length,
          loadingCount: loadingElements.length,
          titleText: Array.from(titles).map(t => t.textContent),
          buttonText: Array.from(buttons).map(b => b.textContent),
          reactErrors: reactErrors,
          jsErrors: jsErrors,
          hasErrors: hasErrors,
          reactRootContent: reactRootContent.substring(0, 500),
          hasReactContent: text.includes('Dashboard') || text.includes('AI Employees') || text.includes('Jobs'),
          isCompletelyEmpty: text.length < 50,
          hasNavigation: document.querySelector('nav') !== null,
          hasSidebar: document.querySelector('[class*="sidebar"]') !== null,
          hasHeader: document.querySelector('header') !== null,
          hasMain: document.querySelector('main') !== null,
          bodyHTML: body.innerHTML.substring(0, 1000)
        };
      });
      
      console.log(`📊 ${pageName} Debug Info:`);
      console.log(`  - Text Length: ${debugInfo.textLength}`);
      console.log(`  - Has Text: ${debugInfo.hasText}`);
      console.log(`  - Is Completely Empty: ${debugInfo.isCompletelyEmpty}`);
      console.log(`  - Has React Content: ${debugInfo.hasReactContent}`);
      console.log(`  - Has Errors: ${debugInfo.hasErrors}`);
      console.log(`  - Titles: ${debugInfo.titleCount}`);
      console.log(`  - Buttons: ${debugInfo.buttonCount}`);
      console.log(`  - Cards: ${debugInfo.cardCount}`);
      console.log(`  - Loading Elements: ${debugInfo.loadingCount}`);
      console.log(`  - Has Navigation: ${debugInfo.hasNavigation}`);
      console.log(`  - Has Sidebar: ${debugInfo.hasSidebar}`);
      console.log(`  - Has Header: ${debugInfo.hasHeader}`);
      console.log(`  - Has Main: ${debugInfo.hasMain}`);
      
      if (debugInfo.reactErrors.length > 0) {
        console.log(`  - React Errors: ${debugInfo.reactErrors.join(', ')}`);
      }
      
      if (debugInfo.jsErrors.length > 0) {
        console.log(`  - JS Errors: ${debugInfo.jsErrors.join(', ')}`);
      }
      
      if (debugInfo.titleText.length > 0) {
        console.log(`  - Title Text: ${debugInfo.titleText.join(', ')}`);
      }
      
      if (debugInfo.buttonText.length > 0) {
        console.log(`  - Button Text: ${debugInfo.buttonText.slice(0, 5).join(', ')}`);
      }
      
      console.log(`  - Visible Text: ${debugInfo.visibleText}`);
      console.log(`  - React Root Content: ${debugInfo.reactRootContent}`);
      console.log(`  - Body HTML: ${debugInfo.bodyHTML}`);
      
      if (debugInfo.isCompletelyEmpty) {
        console.log(`❌ ${pageName}: Completely empty - no content rendered`);
        return false;
      } else if (debugInfo.hasReactContent) {
        console.log(`✅ ${pageName}: Has React content`);
        return true;
      } else {
        console.log(`⚠️  ${pageName}: Some content but may not be React components`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error debugging ${pageName}:`, error.message);
      return false;
    }
  }

  async debugAllPages() {
    console.log('\n📊 STEP 3: Debugging All Pages');
    console.log('------------------------------');
    
    const pagesToDebug = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'AI Employees', url: '/dashboard/ai-employees' },
      { name: 'Jobs', url: '/dashboard/jobs' },
      { name: 'Analytics', url: '/dashboard/analytics' }
    ];
    
    let workingCount = 0;
    let totalCount = pagesToDebug.length;
    
    for (const page of pagesToDebug) {
      const isWorking = await this.debugPage(page.name, page.url);
      if (isWorking) workingCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n📊 DEBUG RESULTS:`);
    console.log(`✅ Working Pages: ${workingCount}/${totalCount}`);
    console.log(`❌ Empty Pages: ${totalCount - workingCount}/${totalCount}`);
    
    return { workingCount, totalCount };
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - cannot debug pages');
        return;
      }
      
      const results = await this.debugAllPages();
      
      console.log('\n🎯 COMPREHENSIVE DEBUG COMPLETED!');
      console.log('==================================');
      console.log(`📊 Results: ${results.workingCount}/${results.totalCount} pages working`);
      
    } catch (error) {
      console.error('❌ Debug test failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the comprehensive debugger
const debuggerInstance = new ComprehensiveDebugger();
debuggerInstance.run().catch(error => {
  console.error('❌ Debug test crashed:', error);
});
