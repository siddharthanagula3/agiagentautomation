const puppeteer = require('puppeteer');

class LiveErrorDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing Live Error Debugger...');
    
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
    
    // Capture all console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`📝 Console [${type}]: ${text}`);
    });

    // Capture page errors
    this.page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
      console.log(`📍 Stack: ${error.stack}`);
    });

    console.log('✅ Browser initialized successfully');
  }

  async debugLiveErrors() {
    console.log('🔍 Debugging Live Website Errors...');
    
    try {
      // Navigate to the website
      await this.page.goto('https://agiagentautomation.com', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait a bit for any errors to appear
      await this.page.waitForTimeout(3000);

      // Check if error container is visible and get its content
      const errorDetails = await this.page.evaluate(() => {
        const errorContainer = document.querySelector('.error-container');
        const errorDetails = document.querySelector('.error-details');
        
        return {
          hasErrorContainer: errorContainer !== null,
          isVisible: errorContainer?.style.display !== 'none',
          errorContent: errorDetails?.innerHTML || '',
          bodyText: document.body.innerText,
          title: document.title
        };
      });

      console.log('🔍 Error Container Analysis:');
      console.log('Has Error Container:', errorDetails.hasErrorContainer);
      console.log('Is Visible:', errorDetails.isVisible);
      console.log('Error Content:', errorDetails.errorContent);
      console.log('Title:', errorDetails.title);

      // Take a screenshot for visual debugging
      await this.page.screenshot({ 
        path: 'live-website-debug.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: live-website-debug.png');

      // Check the actual JavaScript files for errors
      const scriptErrors = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.map(script => ({
          src: script.src,
          loaded: script.readyState === 'complete' || script.readyState === 'loaded'
        }));
      });

      console.log('📜 Script Loading Status:');
      scriptErrors.forEach(script => {
        console.log(`  ${script.src}: ${script.loaded ? '✅ Loaded' : '❌ Not Loaded'}`);
      });

      // Check if React is trying to mount
      const reactStatus = await this.page.evaluate(() => {
        return {
          hasReact: typeof window.React !== 'undefined',
          hasReactDOM: typeof window.ReactDOM !== 'undefined',
          rootElement: document.getElementById('root'),
          rootChildren: document.getElementById('root')?.children.length || 0,
          bodyClasses: document.body.className
        };
      });

      console.log('⚛️ React Status:');
      console.log('Has React:', reactStatus.hasReact);
      console.log('Has ReactDOM:', reactStatus.hasReactDOM);
      console.log('Root Element:', reactStatus.rootElement ? '✅ Found' : '❌ Not Found');
      console.log('Root Children:', reactStatus.rootChildren);
      console.log('Body Classes:', reactStatus.bodyClasses);

      return {
        errorDetails,
        scriptErrors,
        reactStatus
      };

    } catch (error) {
      console.log(`❌ Debug failed: ${error.message}`);
      return null;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleaned up');
    }
  }

  async runDebug() {
    try {
      console.log('🚀 Starting Live Error Debug...\n');
      
      await this.initialize();
      const results = await this.debugLiveErrors();
      
      console.log('\n🎯 LIVE ERROR DEBUG COMPLETE!');
      
      if (results) {
        console.log('📊 Debug Results:');
        console.log('- Error Container Visible:', results.errorDetails.isVisible);
        console.log('- React Available:', results.reactStatus.hasReact);
        console.log('- Root Element:', results.reactStatus.rootElement ? 'Found' : 'Missing');
        console.log('- Scripts Loaded:', results.scriptErrors.filter(s => s.loaded).length);
      }
      
      return results;
      
    } catch (error) {
      console.log(`❌ Debug failed: ${error.message}`);
      return null;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the debug
async function main() {
  const errorDebugger = new LiveErrorDebugger();
  const results = await errorDebugger.runDebug();
  
  if (results && results.errorDetails.isVisible) {
    console.log('\n❌ ERRORS DETECTED - Website has critical issues');
    process.exit(1);
  } else {
    console.log('\n✅ NO CRITICAL ERRORS - Website appears to be working');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LiveErrorDebugger;
