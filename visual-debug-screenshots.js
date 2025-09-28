// Visual Debug Screenshots
import puppeteer from 'puppeteer';

console.log('📸 VISUAL DEBUG SCREENSHOTS');
console.log('===========================');

class VisualDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://agiagentautomation.com';
    this.credentials = {
      email: 'founders@agiagentautomation.com',
      password: 'Sid@8790'
    };
    this.screenshots = [];
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

  async takeScreenshots() {
    console.log('\n📊 STEP 3: Taking Visual Debug Screenshots');
    console.log('------------------------------------------');
    
    const pagesToScreenshot = [
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
    
    for (const page of pagesToScreenshot) {
      try {
        console.log(`📸 Taking screenshot of ${page.name}...`);
        
        await this.page.goto(`${this.baseUrl}${page.url}`, { waitUntil: 'networkidle2' });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take full page screenshot
        const screenshotPath = `visual-debug-${page.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        // Take viewport screenshot
        const viewportPath = `visual-debug-${page.name.toLowerCase().replace(/\s+/g, '-')}-viewport-${Date.now()}.png`;
        await this.page.screenshot({ 
          path: viewportPath,
          fullPage: false 
        });
        
        this.screenshots.push({
          page: page.name,
          fullPage: screenshotPath,
          viewport: viewportPath,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Screenshots saved: ${screenshotPath}, ${viewportPath}`);
        
        // Analyze page content
        const pageAnalysis = await this.page.evaluate(() => {
          const body = document.body;
          const text = body.innerText;
          const html = body.innerHTML;
          
          // Look for specific elements
          const titles = document.querySelectorAll('h1, h2, h3');
          const navigation = document.querySelectorAll('nav, .nav, .navigation, .sidebar');
          const mainContent = document.querySelectorAll('main, .main, .content, .main-content');
          const buttons = document.querySelectorAll('button');
          const links = document.querySelectorAll('a');
          
          return {
            hasTitle: titles.length > 0,
            hasNavigation: navigation.length > 0,
            hasMainContent: mainContent.length > 0,
            buttonCount: buttons.length,
            linkCount: links.length,
            textLength: text.length,
            hasText: text.length > 100,
            visibleText: text.substring(0, 500),
            titleText: Array.from(titles).map(t => t.textContent),
            navigationText: Array.from(navigation).map(n => n.textContent),
            mainContentText: Array.from(mainContent).map(m => m.textContent)
          };
        });
        
        console.log(`📊 ${page.name} Analysis:`);
        console.log(`  - Has Title: ${pageAnalysis.hasTitle}`);
        console.log(`  - Has Navigation: ${pageAnalysis.hasNavigation}`);
        console.log(`  - Has Main Content: ${pageAnalysis.hasMainContent}`);
        console.log(`  - Buttons: ${pageAnalysis.buttonCount}`);
        console.log(`  - Links: ${pageAnalysis.linkCount}`);
        console.log(`  - Text Length: ${pageAnalysis.textLength}`);
        console.log(`  - Has Text: ${pageAnalysis.hasText}`);
        
        if (pageAnalysis.titleText.length > 0) {
          console.log(`  - Title Text: ${pageAnalysis.titleText.join(', ')}`);
        }
        
        if (pageAnalysis.navigationText.length > 0) {
          console.log(`  - Navigation Text: ${pageAnalysis.navigationText.join(', ')}`);
        }
        
        if (pageAnalysis.mainContentText.length > 0) {
          console.log(`  - Main Content Text: ${pageAnalysis.mainContentText.join(', ')}`);
        }
        
        console.log(`  - Visible Text: ${pageAnalysis.visibleText}`);
        
      } catch (error) {
        console.error(`❌ Error taking screenshot of ${page.name}:`, error.message);
      }
    }
    
    console.log(`\n📸 Total screenshots taken: ${this.screenshots.length * 2}`);
    console.log('📄 Screenshots saved for visual debugging');
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.performLogin();
      if (!loginSuccess) {
        console.log('❌ Login failed - stopping visual debug');
        return;
      }
      
      await this.takeScreenshots();
      
      console.log('\n🎯 VISUAL DEBUG COMPLETED!');
      console.log('==========================');
      console.log('✅ Screenshots taken for all pages');
      console.log('✅ Page content analyzed');
      console.log('✅ Visual debugging data collected');
      
    } catch (error) {
      console.error('❌ Visual debug failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the visual debugger
const visualDebugger = new VisualDebugger();
visualDebugger.run().catch(error => {
  console.error('❌ Visual debugger crashed:', error);
});
