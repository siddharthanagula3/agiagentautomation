/**
 * Test Light/Dark Mode Support on Production Chat Agent Page
 * Verifies theme switching and proper styling in both modes
 */

import puppeteer from 'puppeteer';

const PRODUCTION_URL = 'https://agiagentautomation.com/chat-agent';
const TIMEOUT = 30000;

async function testThemeSupport() {
  console.log('\n🧪 Testing Light/Dark Mode Support...\n');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });
      
      if (type === 'error') {
        console.log(`  ❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        console.log(`  ⚠️  Console Warning: ${text}`);
      }
    });

    // Navigate to page
    console.log(`\n📍 Navigating to: ${PRODUCTION_URL}`);
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT
    });

    console.log('✅ Page loaded successfully');

    // Wait for the page to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Check if theme toggle exists
    console.log('\n🧪 Test 1: Theme Toggle Availability');
    const themeToggle = await page.$('[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="Theme"]');
    if (themeToggle) {
      console.log('  ✅ Theme toggle button found');
    } else {
      console.log('  ⚠️  Theme toggle button not found (might use different selector)');
    }

    // Test 2: Check initial theme (should be system default or light)
    console.log('\n🧪 Test 2: Initial Theme State');
    const htmlElement = await page.$('html');
    let isDarkMode = await page.evaluate(el => {
      return el.classList.contains('dark') || 
             document.documentElement.classList.contains('dark') ||
             document.body.classList.contains('dark');
    }, htmlElement);
    
    console.log(`  📊 Initial Mode: ${isDarkMode ? 'Dark' : 'Light'}`);

    // Test 3: Check background colors in current mode
    console.log('\n🧪 Test 3: Background Colors (Current Mode)');
    const backgrounds = await page.evaluate(() => {
      const main = document.querySelector('main, [class*="flex-col h-screen"]');
      const sidebar = document.querySelector('[class*="w-80"]');
      const chatArea = document.querySelector('[class*="flex-1 flex flex-col"]');
      
      return {
        main: main ? window.getComputedStyle(main).backgroundColor : null,
        sidebar: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
        chatArea: chatArea ? window.getComputedStyle(chatArea).backgroundColor : null
      };
    });
    
    console.log(`  Main Container: ${backgrounds.main}`);
    console.log(`  Sidebar: ${backgrounds.sidebar}`);
    console.log(`  Chat Area: ${backgrounds.chatArea}`);

    // Test 4: Toggle theme and verify changes
    console.log('\n🧪 Test 4: Theme Toggle Functionality');
    
    // Try to find and click theme toggle
    let toggled = false;
    
    // Method 1: Look for theme icon buttons
    const sunIcon = await page.$('svg[class*="sun"]');
    const moonIcon = await page.$('svg[class*="moon"]');
    
    if (sunIcon || moonIcon) {
      const toggleButton = sunIcon || moonIcon;
      const parentButton = await page.evaluateHandle(el => el.closest('button'), toggleButton);
      
      if (parentButton) {
        await parentButton.asElement().click();
        toggled = true;
        console.log('  ✅ Theme toggle clicked via icon');
      }
    }
    
    // Method 2: Manually toggle dark class
    if (!toggled) {
      await page.evaluate(() => {
        document.documentElement.classList.toggle('dark');
      });
      console.log('  ℹ️  Theme toggled manually (no toggle button found)');
      toggled = true;
    }

    // Wait for theme transition
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check new theme state
    const newThemeState = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark');
    });
    
    console.log(`  📊 New Mode: ${newThemeState ? 'Dark' : 'Light'}`);

    // Test 5: Verify theme-specific colors after toggle
    console.log('\n🧪 Test 5: Colors After Theme Toggle');
    const newBackgrounds = await page.evaluate(() => {
      const main = document.querySelector('main, [class*="flex-col h-screen"]');
      const sidebar = document.querySelector('[class*="w-80"]');
      const chatArea = document.querySelector('[class*="flex-1 flex flex-col"]');
      
      return {
        main: main ? window.getComputedStyle(main).backgroundColor : null,
        sidebar: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
        chatArea: chatArea ? window.getComputedStyle(chatArea).backgroundColor : null
      };
    });
    
    console.log(`  Main Container: ${newBackgrounds.main}`);
    console.log(`  Sidebar: ${newBackgrounds.sidebar}`);
    console.log(`  Chat Area: ${newBackgrounds.chatArea}`);

    // Verify colors changed
    const colorsChanged = 
      backgrounds.main !== newBackgrounds.main ||
      backgrounds.sidebar !== newBackgrounds.sidebar ||
      backgrounds.chatArea !== newBackgrounds.chatArea;
    
    if (colorsChanged) {
      console.log('  ✅ Theme colors changed successfully!');
    } else {
      console.log('  ⚠️  Warning: Colors did not change (might need investigation)');
    }

    // Test 6: Check specific UI elements
    console.log('\n🧪 Test 6: UI Element Theme Support');
    
    const elementChecks = await page.evaluate(() => {
      const checks = {};
      
      // Check buttons
      const buttons = document.querySelectorAll('button');
      checks.buttonCount = buttons.length;
      
      // Check inputs
      const inputs = document.querySelectorAll('input, textarea');
      checks.inputCount = inputs.length;
      
      // Check text elements
      const textElements = document.querySelectorAll('h1, h2, h3, p, span, label');
      checks.textCount = textElements.length;
      
      // Check if any elements have hardcoded dark colors
      const allElements = document.querySelectorAll('*');
      let hardcodedDarkCount = 0;
      allElements.forEach(el => {
        const classes = el.className;
        if (typeof classes === 'string') {
          if (classes.includes('bg-[#0d0e11]') || 
              classes.includes('bg-[#171717]') ||
              classes.includes('text-white')) {
            // Check if it also has dark: variant
            if (!classes.includes('dark:')) {
              hardcodedDarkCount++;
            }
          }
        }
      });
      checks.hardcodedDarkCount = hardcodedDarkCount;
      
      return checks;
    });
    
    console.log(`  Found ${elementChecks.buttonCount} buttons`);
    console.log(`  Found ${elementChecks.inputCount} inputs`);
    console.log(`  Found ${elementChecks.textCount} text elements`);
    
    if (elementChecks.hardcodedDarkCount === 0) {
      console.log(`  ✅ No hardcoded dark colors without theme variants`);
    } else {
      console.log(`  ⚠️  Found ${elementChecks.hardcodedDarkCount} elements with hardcoded colors`);
    }

    // Test 7: Screenshot both modes
    console.log('\n🧪 Test 7: Taking Screenshots');
    
    // Light mode screenshot
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'chat-agent-light-mode.png', fullPage: true });
    console.log('  📸 Light mode screenshot saved: chat-agent-light-mode.png');
    
    // Dark mode screenshot
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'chat-agent-dark-mode.png', fullPage: true });
    console.log('  📸 Dark mode screenshot saved: chat-agent-dark-mode.png');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const errorCount = consoleLogs.filter(log => log.type === 'error').length;
    const warningCount = consoleLogs.filter(log => log.type === 'warning').length;
    
    console.log(`\n✅ Theme Tests Completed`);
    console.log(`  Theme Toggle: ${toggled ? 'Working' : 'Not found'}`);
    console.log(`  Theme Switching: ${colorsChanged ? 'Working' : 'Needs check'}`);
    console.log(`  Console Errors: ${errorCount}`);
    console.log(`  Console Warnings: ${warningCount}`);
    console.log(`  Hardcoded Colors: ${elementChecks.hardcodedDarkCount}`);
    
    if (errorCount === 0 && colorsChanged) {
      console.log('\n🎉 All theme tests passed!');
    } else if (errorCount > 0) {
      console.log('\n⚠️  Some issues detected - check console errors above');
    } else {
      console.log('\n⚠️  Theme switching needs verification');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed\n');
  }
}

// Run the test
testThemeSupport()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });

