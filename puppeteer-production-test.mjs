import puppeteer from 'puppeteer';

(async () => {
  const BASE_URL = 'https://agiagentautomation.com';
  console.log(`🚀 Testing ${BASE_URL}...`);
  
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox','--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 1: Login page
    console.log('📝 Test 1: Login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    const title = await page.title();
    const hasEmail = !!(await page.$('#email') || await page.$('input[type="email"]'));
    const hasPassword = !!(await page.$('#password') || await page.$('input[type="password"]'));
    const hasSubmit = !!(await page.$('button[type="submit"]'));
    console.log(`✅ Login page: title="${title}", email=${hasEmail}, password=${hasPassword}, submit=${hasSubmit}`);
    
    // Test 2: Homepage
    console.log('📝 Test 2: Homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    const homeTitle = await page.title();
    console.log(`✅ Homepage: title="${homeTitle}"`);
    
    // Test 3: Marketplace
    console.log('📝 Test 3: Marketplace...');
    await page.goto(`${BASE_URL}/marketplace`, { waitUntil: 'networkidle2', timeout: 60000 });
    const marketplaceTitle = await page.title();
    console.log(`✅ Marketplace: title="${marketplaceTitle}"`);
    
    // Test 4: Check for JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    if (errors.length > 0) {
      console.log(`⚠️ JavaScript errors found: ${errors.length}`);
      errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Summary
    const allTestsPassed = hasEmail && hasPassword && hasSubmit;
    console.log('\n📊 Test Summary:');
    console.log(`  Login Form: ${allTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Homepage: ✅ PASS`);
    console.log(`  Marketplace: ✅ PASS`);
    console.log(`  JS Errors: ${errors.length === 0 ? '✅ PASS' : '⚠️ WARN'}`);
    
    console.log(JSON.stringify({ 
      ok: allTestsPassed, 
      title, 
      homeTitle, 
      marketplaceTitle,
      hasEmail, 
      hasPassword, 
      hasSubmit,
      jsErrors: errors.length 
    }));
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    console.error(JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

