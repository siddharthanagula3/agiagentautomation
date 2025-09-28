const puppeteer = require('puppeteer');

class DeploymentTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing Deployment Status Checker...');
    
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
        '--disable-gpu'
      ]
    });

    const context = await this.browser.createBrowserContext();
    this.page = await context.newPage();
    
    console.log('✅ Browser initialized successfully');
  }

  async checkDeploymentStatus() {
    console.log('🔍 Checking Deployment Status...');
    
    try {
      // Navigate to the website
      await this.page.goto('https://agiagentautomation.com', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Check if the latest build is deployed by looking at asset filenames
      const assetInfo = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const links = Array.from(document.querySelectorAll('link[href]'));
        
        return {
          scripts: scripts.map(s => s.src),
          links: links.map(l => l.href),
          timestamp: new Date().toISOString()
        };
      });

      console.log('📄 Asset Information:');
      console.log('Scripts:', assetInfo.scripts);
      console.log('Links:', assetInfo.links);

      // Check for specific error patterns
      const errorPatterns = await this.page.evaluate(() => {
        const errors = [];
        
        // Check console for specific errors
        const originalError = console.error;
        console.error = function(...args) {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };

        return {
          errors: errors,
          hasReact: typeof window.React !== 'undefined',
          hasRoot: document.getElementById('root') !== null,
          rootChildren: document.getElementById('root')?.children.length || 0
        };
      });

      console.log('🔍 Error Analysis:');
      console.log('Has React:', errorPatterns.hasReact);
      console.log('Has Root:', errorPatterns.hasRoot);
      console.log('Root Children:', errorPatterns.rootChildren);
      console.log('Errors:', errorPatterns.errors);

      // Check if the page is still showing loading state
      const isLoading = await this.page.evaluate(() => {
        const body = document.body;
        return body.classList.contains('loading') || 
               body.querySelector('.loader-container') !== null;
      });

      console.log('⏳ Still Loading:', isLoading);

      // Check for specific error messages in the page content
      const pageContent = await this.page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText,
          hasErrorContainer: document.querySelector('.error-container') !== null,
          errorContainerVisible: document.querySelector('.error-container')?.style.display !== 'none'
        };
      });

      console.log('📄 Page Content:');
      console.log('Title:', pageContent.title);
      console.log('Has Error Container:', pageContent.hasErrorContainer);
      console.log('Error Container Visible:', pageContent.errorContainerVisible);

      if (pageContent.bodyText.includes('Identifier') && pageContent.bodyText.includes('already been declared')) {
        console.log('❌ CRITICAL: Variable declaration error still present in page content');
        return false;
      }

      if (pageContent.bodyText.includes('s is not a function')) {
        console.log('❌ CRITICAL: Function error still present in page content');
        return false;
      }

      if (isLoading && pageContent.title.includes('Loading')) {
        console.log('⚠️ WARNING: Page still in loading state');
        return false;
      }

      console.log('✅ Deployment status check completed');
      return true;

    } catch (error) {
      console.log(`❌ Deployment check failed: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleaned up');
    }
  }

  async runCheck() {
    try {
      console.log('🚀 Starting Deployment Status Check...\n');
      
      await this.initialize();
      const status = await this.checkDeploymentStatus();
      
      console.log('\n🎯 DEPLOYMENT STATUS CHECK COMPLETE!');
      console.log(`Status: ${status ? '✅ SUCCESS' : '❌ ISSUES DETECTED'}`);
      
      return status;
      
    } catch (error) {
      console.log(`❌ Check failed: ${error.message}`);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the check
async function main() {
  const tester = new DeploymentTester();
  const status = await tester.runCheck();
  
  if (status) {
    console.log('\n✅ DEPLOYMENT SUCCESSFUL - Website is working properly');
    process.exit(0);
  } else {
    console.log('\n❌ DEPLOYMENT ISSUES - Website needs further fixes');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentTester;
