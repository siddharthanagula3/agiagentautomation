import puppeteer from 'puppeteer';

async function runSimpleTest() {
  console.log('🚀 Starting Simple Test...');
  
  try {
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 100
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navigating to localhost:8080...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: './tests/simple-test-screenshot.png', 
      fullPage: true 
    });
    
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    const url = page.url();
    console.log(`🔗 Current URL: ${url}`);
    
    // Test if page loaded
    if (title && title !== '') {
      console.log('✅ Page loaded successfully!');
    } else {
      console.log('❌ Page did not load properly');
    }
    
    await browser.close();
    console.log('✅ Simple test completed!');
    
  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
  }
}

runSimpleTest();
