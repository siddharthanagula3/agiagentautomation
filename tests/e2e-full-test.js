import puppeteer from 'puppeteer';
import { TEST_CONFIG, ROUTES } from './test-config.js';
import {
  wait,
  takeScreenshot,
  setupConsoleListener,
  setupNetworkListener,
  checkImagesLoaded,
  checkButtonsClickable,
  checkLinks,
  checkSEOTags,
  login,
  createTestResult,
  saveJSONReport,
  categorizeResults
} from './test-utils.js';

/**
 * Test a single route
 */
async function testRoute(page, route, isProtected = false) {
  console.log(`\n🧪 Testing: ${route.name} (${route.path})`);

  const startTime = Date.now();
  const result = {
    duration: 0,
    errors: {
      consoleErrors: [],
      networkErrors: []
    },
    issues: {},
    checks: {}
  };

  try {
    // Set up listeners
    const consoleErrors = setupConsoleListener(page);
    const networkErrors = setupNetworkListener(page);

    // Navigate to route
    const response = await page.goto(`${TEST_CONFIG.baseURL}${route.path}`, {
      waitUntil: 'networkidle2',
      timeout: TEST_CONFIG.timeout.navigation
    });

    // Check response status
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status()} - Page failed to load`);
    }

    // Wait for page to stabilize
    await wait(2000);

    // Run all checks
    result.checks.images = await checkImagesLoaded(page);
    result.checks.buttons = await checkButtonsClickable(page);
    result.checks.links = await checkLinks(page);
    result.checks.seo = await checkSEOTags(page);

    // Collect errors
    result.errors.consoleErrors = consoleErrors;
    result.errors.networkErrors = networkErrors;

    // Determine if test passed
    const hasCriticalErrors = result.errors.consoleErrors.length > 0 ||
                              result.errors.networkErrors.some(e => e.status >= 500);
    const hasImageFailures = result.checks.images.failed.length > 0;
    const hasButtonIssues = result.checks.buttons.issues.length > 0;

    const success = !hasCriticalErrors;

    result.duration = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = await takeScreenshot(page, route.name, success ? 'passed' : 'failed');
    result.screenshot = screenshotPath;

    console.log(`  ✅ Test completed in ${result.duration}ms`);
    console.log(`  📸 Screenshot: ${screenshotPath}`);

    if (!success) {
      console.log(`  ❌ FAILED: ${result.errors.consoleErrors.length} console errors, ${result.errors.networkErrors.length} network errors`);
    }

    return createTestResult(route, success, result);

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = error.message;
    result.stack = error.stack;

    console.log(`  ❌ ERROR: ${error.message}`);

    const screenshotPath = await takeScreenshot(page, route.name, 'error');
    result.screenshot = screenshotPath;

    return createTestResult(route, false, result);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Comprehensive E2E Test Suite');
  console.log('==========================================\n');

  // Wait 45 seconds after GitHub push
  console.log(`⏳ Waiting ${TEST_CONFIG.githubPushWait / 1000} seconds for deployment...`);
  await wait(TEST_CONFIG.githubPushWait);
  console.log('✅ Wait complete, starting tests\n');

  const browser = await puppeteer.launch(TEST_CONFIG.browser);
  const results = {
    startTime: new Date().toISOString(),
    config: {
      baseURL: TEST_CONFIG.baseURL,
      browser: 'chromium',
      headless: TEST_CONFIG.browser.headless
    },
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }
  };

  const startTestTime = Date.now();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Phase 1: Test all public routes
    console.log('\n📋 PHASE 1: Testing Public Routes');
    console.log('==================================');
    for (const route of ROUTES.public) {
      const result = await testRoute(page, route, false);
      results.tests.push(result);
      await wait(1000); // Small delay between tests
    }

    // Phase 2: Test auth routes
    console.log('\n📋 PHASE 2: Testing Auth Routes');
    console.log('================================');
    for (const route of ROUTES.auth) {
      const result = await testRoute(page, route, false);
      results.tests.push(result);
      await wait(1000);
    }

    // Phase 3: Login and test protected routes
    console.log('\n📋 PHASE 3: Testing Protected Routes (After Login)');
    console.log('===================================================');

    console.log('\n🔐 Logging in...');
    const loginResult = await login(
      page,
      TEST_CONFIG.credentials.email,
      TEST_CONFIG.credentials.password
    );

    if (loginResult.success) {
      console.log('✅ Login successful!');

      for (const route of ROUTES.protected) {
        const result = await testRoute(page, route, true);
        results.tests.push(result);
        await wait(1000);
      }
    } else {
      console.log('❌ Login failed:', loginResult.error || 'Unknown error');
      console.log('⚠️  Skipping protected routes');

      // Add failed results for all protected routes
      ROUTES.protected.forEach(route => {
        results.tests.push(createTestResult(route, false, {
          error: 'Could not test - login failed',
          skipped: true
        }));
      });
    }

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    results.fatalError = error.message;
  } finally {
    await browser.close();
  }

  // Calculate summary
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.success).length;
  results.summary.failed = results.tests.filter(t => !t.success).length;
  results.summary.duration = Date.now() - startTestTime;
  results.endTime = new Date().toISOString();

  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⏱️  Duration: ${(results.summary.duration / 1000).toFixed(2)}s`);

  // Categorize results
  const categories = categorizeResults(results.tests);
  console.log(`\n🔥 Critical Failures: ${categories.critical.length}`);
  console.log(`⚠️  High Priority: ${categories.high.length}`);
  console.log(`⚡ Medium Priority: ${categories.medium.length}`);
  console.log(`📝 Low Priority: ${categories.low.length}`);

  // Save JSON report
  console.log(`\n💾 Saving JSON report...`);
  saveJSONReport(results, TEST_CONFIG.reports.json);
  console.log(`✅ JSON report saved: ${TEST_CONFIG.reports.json}`);

  // Save categorized report
  saveJSONReport({
    ...results,
    categorized: categories
  }, TEST_CONFIG.reports.json.replace('.json', '-categorized.json'));

  return results;
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
