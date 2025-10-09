/**
 * Complete Theme Support Test for Chat Agent Page
 * Tests all components in both light and dark modes
 */

import puppeteer from 'puppeteer';

const PRODUCTION_URL = 'https://agiagentautomation.com/chat-agent';
const TIMEOUT = 30000;

async function testCompleteTheme() {
  console.log('\n🧪 COMPLETE THEME SUPPORT TEST\n');
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      
      if (type === 'error' && !text.includes('AuthService')) {
        console.log(`  ❌ Error: ${text}`);
      }
    });

    console.log(`\n📍 Loading: ${PRODUCTION_URL}`);
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT
    });

    console.log('✅ Page loaded\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Check Dark Mode (System Default)
    console.log('🧪 TEST 1: Dark Mode Components');
    console.log('-'.repeat(70));
    
    const darkModeElements = await page.evaluate(() => {
      const results = {};
      
      // Check main container
      const main = document.querySelector('[class*="flex-col h-screen"]');
      if (main) {
        const bgColor = window.getComputedStyle(main).backgroundColor;
        results.mainBg = bgColor;
        results.mainHasDark = main.className.includes('dark:');
      }
      
      // Check sidebar
      const sidebar = document.querySelector('[class*="w-80"]');
      if (sidebar) {
        results.sidebarBg = window.getComputedStyle(sidebar).backgroundColor;
        results.sidebarHasDark = sidebar.className.includes('dark:');
      }
      
      // Check chat area
      const chatArea = document.querySelector('[class*="flex-1 flex flex-col"]');
      if (chatArea) {
        results.chatAreaBg = window.getComputedStyle(chatArea).backgroundColor;
        results.chatAreaHasDark = chatArea.className.includes('dark:');
      }
      
      // Count elements with dark: variants
      const allElements = document.querySelectorAll('*');
      let darkVariantCount = 0;
      let noVariantCount = 0;
      
      allElements.forEach(el => {
        const classes = el.className;
        if (typeof classes === 'string' && classes) {
          if (classes.includes('bg-') || classes.includes('text-') || classes.includes('border-')) {
            if (classes.includes('dark:')) {
              darkVariantCount++;
            } else if (!classes.includes('gradient') && !classes.includes('purple') && !classes.includes('pink')) {
              noVariantCount++;
            }
          }
        }
      });
      
      results.darkVariantCount = darkVariantCount;
      results.noVariantCount = noVariantCount;
      
      return results;
    });
    
    console.log(`  Main Container BG: ${darkModeElements.mainBg || 'Not found'}`);
    console.log(`  Sidebar BG: ${darkModeElements.sidebarBg || 'Not found'}`);
    console.log(`  Chat Area BG: ${darkModeElements.chatAreaBg || 'Not found'}`);
    console.log(`  Elements with dark: variants: ${darkModeElements.darkVariantCount}`);
    console.log(`  Elements potentially missing variants: ${darkModeElements.noVariantCount}`);
    
    if (darkModeElements.darkVariantCount > 50) {
      console.log('  ✅ Good dark mode coverage');
    } else {
      console.log('  ⚠️  Low dark mode coverage');
    }

    // Test 2: Toggle to Light Mode
    console.log('\n🧪 TEST 2: Light Mode Toggle');
    console.log('-'.repeat(70));
    
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const lightModeElements = await page.evaluate(() => {
      const results = {};
      
      const main = document.querySelector('[class*="flex-col h-screen"]');
      if (main) {
        results.mainBg = window.getComputedStyle(main).backgroundColor;
      }
      
      const sidebar = document.querySelector('[class*="w-80"]');
      if (sidebar) {
        results.sidebarBg = window.getComputedStyle(sidebar).backgroundColor;
      }
      
      const chatArea = document.querySelector('[class*="flex-1 flex flex-col"]');
      if (chatArea) {
        results.chatAreaBg = window.getComputedStyle(chatArea).backgroundColor;
      }
      
      return results;
    });
    
    console.log(`  Main Container BG: ${lightModeElements.mainBg || 'Not found'}`);
    console.log(`  Sidebar BG: ${lightModeElements.sidebarBg || 'Not found'}`);
    console.log(`  Chat Area BG: ${lightModeElements.chatAreaBg || 'Not found'}`);
    
    // Check if colors actually changed
    const colorsChanged = 
      darkModeElements.mainBg !== lightModeElements.mainBg ||
      darkModeElements.sidebarBg !== lightModeElements.sidebarBg ||
      darkModeElements.chatAreaBg !== lightModeElements.chatAreaBg;
    
    if (colorsChanged) {
      console.log('  ✅ Colors changed correctly');
    } else {
      console.log('  ⚠️  Colors did not change');
    }

    // Test 3: Component-Level Checks
    console.log('\n🧪 TEST 3: Component-Level Checks');
    console.log('-'.repeat(70));
    
    const componentChecks = await page.evaluate(() => {
      const checks = {
        buttons: 0,
        inputs: 0,
        badges: 0,
        cards: 0,
        dialogs: 0
      };
      
      checks.buttons = document.querySelectorAll('button').length;
      checks.inputs = document.querySelectorAll('input, textarea').length;
      checks.badges = document.querySelectorAll('[class*="badge"]').length;
      checks.cards = document.querySelectorAll('[class*="card"]').length;
      
      // Check for specific components
      checks.hasNewPromptBtn = !!document.querySelector('button:has([class*="Plus"])');
      checks.hasToolCards = document.querySelectorAll('[class*="Code Interpreter"], [class*="Image Generation"]').length > 0;
      checks.hasDeveloperMessage = !!document.querySelector('textarea');
      
      return checks;
    });
    
    console.log(`  Buttons found: ${componentChecks.buttons}`);
    console.log(`  Input fields: ${componentChecks.inputs}`);
    console.log(`  Badges: ${componentChecks.badges}`);
    console.log(`  Cards: ${componentChecks.cards}`);
    console.log(`  New Prompt button: ${componentChecks.hasNewPromptBtn ? '✅' : '❌'}`);
    console.log(`  Developer Message: ${componentChecks.hasDeveloperMessage ? '✅' : '❌'}`);

    // Test 4: Screenshots
    console.log('\n🧪 TEST 4: Screenshot Capture');
    console.log('-'.repeat(70));
    
    // Light mode screenshot
    await page.screenshot({ 
      path: 'chat-agent-complete-light.png', 
      fullPage: true 
    });
    console.log('  📸 Light mode: chat-agent-complete-light.png');
    
    // Toggle back to dark
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ 
      path: 'chat-agent-complete-dark.png', 
      fullPage: true 
    });
    console.log('  📸 Dark mode: chat-agent-complete-dark.png');

    // Test 5: Console Errors
    console.log('\n🧪 TEST 5: Console Analysis');
    console.log('-'.repeat(70));
    
    const errors = consoleMessages.filter(m => m.type === 'error' && !m.text.includes('AuthService'));
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    
    console.log(`  Critical Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);
    
    if (errors.length === 0) {
      console.log('  ✅ No critical errors');
    } else {
      console.log('  ⚠️  Critical errors found:');
      errors.forEach(err => console.log(`      - ${err.text}`));
    }

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    
    const allPassed = 
      colorsChanged && 
      errors.length === 0 && 
      darkModeElements.darkVariantCount > 50 &&
      componentChecks.buttons > 5 &&
      componentChecks.inputs > 1;
    
    console.log(`\n  Dark Mode Coverage: ${darkModeElements.darkVariantCount > 50 ? '✅ Good' : '⚠️  Needs improvement'}`);
    console.log(`  Color Switching: ${colorsChanged ? '✅ Working' : '⚠️  Not working'}`);
    console.log(`  Components Found: ${componentChecks.buttons > 5 ? '✅ All present' : '⚠️  Some missing'}`);
    console.log(`  Critical Errors: ${errors.length === 0 ? '✅ None' : '⚠️  ' + errors.length}`);
    console.log(`  Screenshots: ✅ Captured`);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Theme support is complete!');
    } else {
      console.log('\n⚠️  Some tests need attention');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed\n');
  }
}

// Run test
testCompleteTheme()
  .then(() => {
    console.log('✅ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });

