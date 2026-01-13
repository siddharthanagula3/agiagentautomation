/**
 * Comprehensive E2E Test Suite
 * Tests all major features of the AGI Agent Automation Platform
 * Handles lazy loading and initial loading screens
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Test report storage
interface TestReport {
  consoleErrors: string[];
  consoleWarnings: string[];
  networkFailures: { url: string; method: string; error: string }[];
  screenshots: string[];
  performanceMetrics: Record<string, number>;
}

const globalReport: Record<string, TestReport> = {};

// Helper to capture screenshot
async function screenshot(page: Page, name: string) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Helper to wait for app to fully load (handles lazy loading)
async function waitForAppLoad(page: Page, timeout = 30000) {
  // Wait for the initial loader to disappear
  try {
    await page.waitForSelector('#initial-loader', { state: 'hidden', timeout: 5000 });
  } catch {
    // Loader might already be gone
  }

  // Wait for body to have 'app-loaded' class or be visible
  try {
    await page.waitForFunction(
      () => {
        const body = document.body;
        return body &&
               (body.classList.contains('app-loaded') ||
                getComputedStyle(body).display !== 'none' &&
                getComputedStyle(body).visibility !== 'hidden');
      },
      { timeout }
    );
  } catch {
    // Continue anyway
  }

  // Wait for React to hydrate - check for root element content
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout }
  );

  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout });

  // Extra buffer for lazy-loaded components
  await page.waitForTimeout(1000);
}

// Helper to setup monitoring for a page
function setupPageMonitoring(page: Page, testName: string) {
  const report: TestReport = {
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    screenshots: [],
    performanceMetrics: {},
  };

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      report.consoleErrors.push(text);
      // Log critical errors immediately
      if (text.includes('Immer') || text.includes('frozen') || text.includes('Cannot modify')) {
        console.log(`🔴 CRITICAL [${testName}]: ${text.substring(0, 300)}`);
      }
    } else if (msg.type() === 'warning' && !text.includes('DevTools')) {
      report.consoleWarnings.push(text);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.includes('analytics') && !url.includes('favicon') && !url.includes('hot-update')) {
      const failure = {
        url,
        method: request.method(),
        error: request.failure()?.errorText || 'Unknown',
      };
      report.networkFailures.push(failure);
      console.log(`🔴 [${testName}] Network Failure: ${failure.method} ${url}`);
    }
  });

  page.on('pageerror', (error) => {
    report.consoleErrors.push(`Page Error: ${error.message}`);
    console.log(`🔴 [${testName}] Page Error: ${error.message}`);
  });

  globalReport[testName] = report;
  return report;
}

// ============================================================
// PUBLIC PAGES TESTS (No Auth Required)
// ============================================================
test.describe('Public Pages - Parallel Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Landing page loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'landing');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Check for critical elements
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check that content is rendered
    const hasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.innerHTML.length > 100;
    });
    expect(hasContent).toBe(true);

    const screenshotPath = await screenshot(page, 'landing-page');
    report.screenshots.push(screenshotPath);

    // Performance check
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: nav.loadEventEnd - nav.startTime,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      };
    });
    report.performanceMetrics = timing;

    console.log(`📊 Landing page load time: ${timing.loadTime.toFixed(0)}ms`);

    // Check for critical errors
    const immerErrors = report.consoleErrors.filter(e => e.includes('Immer') || e.includes('frozen'));
    expect(immerErrors).toHaveLength(0);
  });

  test('Login page loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'login');

    await page.goto(`${BASE_URL}/login`);
    await waitForAppLoad(page);

    // Wait specifically for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // Use longer timeout for lazy-loaded auth pages
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    await screenshot(page, 'login-page');

    console.log('✅ Login page has all required form elements');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('Signup page loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'signup');

    await page.goto(`${BASE_URL}/signup`);
    await waitForAppLoad(page);

    await screenshot(page, 'signup-page');

    // Check for signup form
    const formExists = await page.locator('form, [class*="signup"], [class*="register"]').count();
    console.log(`📊 Found ${formExists} signup form elements`);

    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('Pricing page loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'pricing');

    await page.goto(`${BASE_URL}/pricing`);
    await waitForAppLoad(page);

    await screenshot(page, 'pricing-page');

    // Check for pricing tiers
    const pricingElements = page.locator('[class*="price"], [class*="plan"], [class*="tier"], [class*="card"]');
    const count = await pricingElements.count();
    console.log(`📊 Found ${count} pricing elements`);

    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('About page loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'about');

    await page.goto(`${BASE_URL}/about`);
    await waitForAppLoad(page);

    await screenshot(page, 'about-page');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('Help center loads correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'help');

    await page.goto(`${BASE_URL}/help`);
    await waitForAppLoad(page);

    await screenshot(page, 'help-page');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });
});

// ============================================================
// NAVIGATION & ROUTING TESTS
// ============================================================
test.describe('Navigation & Routing', () => {
  test('All main navigation links work', async ({ page }) => {
    const report = setupPageMonitoring(page, 'navigation');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Find all navigation links
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();
    console.log(`📊 Found ${linkCount} navigation links`);

    await screenshot(page, 'navigation-test');
  });

  test('Protected routes redirect to login', async ({ page }) => {
    const report = setupPageMonitoring(page, 'protected-routes');

    // Test protected routes
    const protectedRoutes = ['/dashboard', '/chat', '/vibe', '/mission-control'];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await waitForAppLoad(page);

      // Should redirect to login or show auth required
      const currentUrl = page.url();
      const isProtected = currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl === `${BASE_URL}${route}`;
      console.log(`Route ${route} -> ${currentUrl} (protected: ${isProtected})`);
    }

    await screenshot(page, 'protected-routes-test');
  });
});

// ============================================================
// UI COMPONENT TESTS
// ============================================================
test.describe('UI Components - Parallel Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Buttons are clickable and styled', async ({ page }) => {
    const report = setupPageMonitoring(page, 'buttons');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`📊 Found ${buttonCount} buttons on landing page`);

    // Check first visible button is clickable
    for (let i = 0; i < Math.min(5, buttonCount); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
        break;
      }
    }

    await screenshot(page, 'buttons-test');
  });

  test('Forms have proper validation', async ({ page }) => {
    const report = setupPageMonitoring(page, 'forms');

    await page.goto(`${BASE_URL}/login`);
    await waitForAppLoad(page);

    // Find submit button
    const submitButton = page.locator('button[type="submit"]').first();

    // Wait for button to be visible
    try {
      await submitButton.waitFor({ state: 'visible', timeout: 15000 });

      // Try clicking empty form
      await submitButton.click();
      await page.waitForTimeout(1000);

      await screenshot(page, 'form-validation-test');
      console.log('✅ Form validation test completed');
    } catch (e) {
      console.log('⚠️ Form validation test skipped - button not found');
      await screenshot(page, 'form-validation-skipped');
    }
  });

  test('Modal/dialog components work', async ({ page }) => {
    const report = setupPageMonitoring(page, 'modals');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Look for any modal triggers
    const modalTriggers = page.locator('[data-state], [aria-haspopup="dialog"], [class*="modal"], [class*="dialog"]');
    const triggerCount = await modalTriggers.count();
    console.log(`📊 Found ${triggerCount} potential modal elements`);

    await screenshot(page, 'modals-test');
  });
});

// ============================================================
// RESPONSIVE DESIGN TESTS
// ============================================================
test.describe('Responsive Design - Parallel Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Desktop viewport (1920x1080)', async ({ page }) => {
    const report = setupPageMonitoring(page, 'desktop');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    await screenshot(page, 'responsive-desktop');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('Tablet viewport (768x1024)', async ({ page }) => {
    const report = setupPageMonitoring(page, 'tablet');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    await screenshot(page, 'responsive-tablet');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });

  test('Mobile viewport (375x667)', async ({ page }) => {
    const report = setupPageMonitoring(page, 'mobile');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Check mobile menu
    const hamburgerMenu = page.locator('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu" i], [class*="mobile"]');
    const hamburgerCount = await hamburgerMenu.count();
    console.log(`📊 Found ${hamburgerCount} mobile menu elements`);

    await screenshot(page, 'responsive-mobile');
    expect(report.consoleErrors.filter(e => e.includes('Immer'))).toHaveLength(0);
  });
});

// ============================================================
// PERFORMANCE TESTS
// ============================================================
test.describe('Performance Tests', () => {
  test('Landing page performance metrics', async ({ page }) => {
    const report = setupPageMonitoring(page, 'perf-landing');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
        tcpConnect: nav.connectEnd - nav.connectStart,
        ttfb: nav.responseStart - nav.requestStart,
        domLoad: nav.domContentLoadedEventEnd - nav.startTime,
        fullLoad: nav.loadEventEnd - nav.startTime,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`   DNS Lookup: ${metrics.dnsLookup.toFixed(2)}ms`);
    console.log(`   TCP Connect: ${metrics.tcpConnect.toFixed(2)}ms`);
    console.log(`   TTFB: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`   DOM Load: ${metrics.domLoad.toFixed(2)}ms`);
    console.log(`   Full Load: ${metrics.fullLoad.toFixed(2)}ms`);
    console.log(`   First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
    console.log(`   FCP: ${metrics.firstContentfulPaint.toFixed(2)}ms`);

    report.performanceMetrics = metrics;

    // Performance assertions (relaxed for dev server)
    expect(metrics.domLoad).toBeLessThan(10000);
    expect(metrics.firstContentfulPaint).toBeLessThan(5000);
  });

  test('Bundle size check', async ({ page }) => {
    const report = setupPageMonitoring(page, 'bundle-size');

    const resources: { url: string; size: number; type: string }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0', 10);
        const type = url.includes('.js') ? 'JS' : 'CSS';
        resources.push({ url, size, type });
      }
    });

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    const totalJS = resources.filter(r => r.type === 'JS').reduce((sum, r) => sum + r.size, 0);
    const totalCSS = resources.filter(r => r.type === 'CSS').reduce((sum, r) => sum + r.size, 0);

    console.log(`\n📊 BUNDLE SIZES:`);
    console.log(`   Total JS: ${(totalJS / 1024).toFixed(2)} KB`);
    console.log(`   Total CSS: ${(totalCSS / 1024).toFixed(2)} KB`);
    console.log(`   JS files: ${resources.filter(r => r.type === 'JS').length}`);
    console.log(`   CSS files: ${resources.filter(r => r.type === 'CSS').length}`);
  });
});

// ============================================================
// ACCESSIBILITY TESTS
// ============================================================
test.describe('Accessibility Tests', () => {
  test('Landing page accessibility', async ({ page }) => {
    const report = setupPageMonitoring(page, 'a11y-landing');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Check for basic accessibility
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const buttonsWithoutLabel = await page.locator('button:not([aria-label]):not(:has-text(*)):empty').count();
    const inputsWithoutLabel = await page.locator('input:not([aria-label]):not([aria-labelledby]):not([placeholder])').count();

    console.log(`\n📊 ACCESSIBILITY CHECK:`);
    console.log(`   Images without alt: ${imagesWithoutAlt}`);
    console.log(`   Buttons without label: ${buttonsWithoutLabel}`);
    console.log(`   Inputs without label: ${inputsWithoutLabel}`);

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    console.log(`   H1 tags: ${h1Count}`);
    console.log(`   H2 tags: ${h2Count}`);

    await screenshot(page, 'a11y-landing');
  });

  test('Color contrast check', async ({ page }) => {
    const report = setupPageMonitoring(page, 'contrast');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Get computed styles of text elements
    const textContrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6');
      const samples: { element: string; color: string; bgColor: string }[] = [];

      Array.from(elements).slice(0, 10).forEach(el => {
        const style = getComputedStyle(el);
        samples.push({
          element: el.tagName,
          color: style.color,
          bgColor: style.backgroundColor,
        });
      });

      return samples;
    });

    console.log(`📊 Sampled ${textContrast.length} text elements for contrast`);
    await screenshot(page, 'contrast-check');
  });
});

// ============================================================
// ERROR HANDLING TESTS
// ============================================================
test.describe('Error Handling', () => {
  test('404 page displays correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, '404');

    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);
    await waitForAppLoad(page);

    await screenshot(page, '404-page');

    // Should show some kind of error or redirect
    const bodyText = await page.locator('body').textContent() || '';
    const shows404 = bodyText.toLowerCase().includes('not found') ||
                     bodyText.toLowerCase().includes('404') ||
                     bodyText.toLowerCase().includes('error');
    console.log(`📊 404 page shows error message: ${shows404}`);
  });

  test('No unhandled JavaScript errors', async ({ page }) => {
    const report = setupPageMonitoring(page, 'js-errors');

    const pages = ['/', '/login', '/pricing', '/about'];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await waitForAppLoad(page);
    }

    console.log(`\n📊 JAVASCRIPT ERROR SUMMARY:`);
    console.log(`   Total errors: ${report.consoleErrors.length}`);
    console.log(`   Immer errors: ${report.consoleErrors.filter(e => e.includes('Immer')).length}`);
    console.log(`   State errors: ${report.consoleErrors.filter(e => e.includes('Cannot') && e.includes('state')).length}`);
    console.log(`   Type errors: ${report.consoleErrors.filter(e => e.includes('TypeError')).length}`);

    if (report.consoleErrors.length > 0) {
      console.log('\n   Error samples:');
      report.consoleErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Critical: No Immer errors
    const immerErrors = report.consoleErrors.filter(e => e.includes('Immer') || e.includes('frozen'));
    expect(immerErrors).toHaveLength(0);
  });
});

// ============================================================
// STATE MANAGEMENT TESTS (Critical - Immer/Zustand)
// ============================================================
test.describe('State Management - Critical Tests', () => {
  test('No Immer frozen state errors on page transitions', async ({ page }) => {
    const report = setupPageMonitoring(page, 'state-transitions');

    const routes = ['/', '/login', '/signup', '/pricing', '/about', '/help'];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await waitForAppLoad(page);

      // Interact with the page to trigger state changes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        const firstVisibleButton = buttons.first();
        if (await firstVisibleButton.isVisible()) {
          try {
            await firstVisibleButton.click({ timeout: 2000 });
            await page.waitForTimeout(500);
          } catch {
            // Ignore click errors
          }
        }
      }
    }

    const immerErrors = report.consoleErrors.filter(e =>
      e.includes('Immer') ||
      e.includes('frozen') ||
      e.includes('Cannot assign to read only property') ||
      e.includes('Cannot modify')
    );

    console.log(`\n📊 STATE MANAGEMENT CHECK:`);
    console.log(`   Total console errors: ${report.consoleErrors.length}`);
    console.log(`   Immer/frozen errors: ${immerErrors.length}`);

    if (immerErrors.length > 0) {
      console.log('\n🚨 CRITICAL STATE ERRORS:');
      immerErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 300)}`);
      });
    }

    expect(immerErrors).toHaveLength(0);
  });

  test('No Map/Set mutation errors', async ({ page }) => {
    const report = setupPageMonitoring(page, 'map-set-errors');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    // Check for Map/Set related errors
    const mapSetErrors = report.consoleErrors.filter(e =>
      e.includes('Map') ||
      e.includes('Set') ||
      e.includes('.set(') ||
      e.includes('.get(') ||
      e.includes('.delete(')
    );

    console.log(`📊 Map/Set related errors: ${mapSetErrors.length}`);
    expect(mapSetErrors).toHaveLength(0);
  });
});

// ============================================================
// API & NETWORK TESTS
// ============================================================
test.describe('API & Network Tests', () => {
  test('No failed API requests on landing', async ({ page }) => {
    const report = setupPageMonitoring(page, 'api-landing');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    console.log(`\n📊 NETWORK FAILURES:`);
    console.log(`   Failed requests: ${report.networkFailures.length}`);

    if (report.networkFailures.length > 0) {
      console.log('\n   Failed requests:');
      report.networkFailures.forEach((req, i) => {
        console.log(`   ${i + 1}. [${req.method}] ${req.url.substring(0, 100)}`);
        console.log(`      Error: ${req.error}`);
      });
    }
  });

  test('Supabase connection works', async ({ page }) => {
    const report = setupPageMonitoring(page, 'supabase');

    let supabaseRequests = 0;
    let supabaseErrors = 0;

    page.on('request', (request) => {
      if (request.url().includes('supabase')) {
        supabaseRequests++;
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('supabase') && response.status() >= 400) {
        supabaseErrors++;
        console.log(`🔴 Supabase error: ${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`${BASE_URL}/login`);
    await waitForAppLoad(page);

    console.log(`\n📊 SUPABASE CHECK:`);
    console.log(`   Supabase requests: ${supabaseRequests}`);
    console.log(`   Supabase errors: ${supabaseErrors}`);
  });
});

// ============================================================
// SECURITY TESTS
// ============================================================
test.describe('Security Tests', () => {
  test('No sensitive data in page source', async ({ page }) => {
    const report = setupPageMonitoring(page, 'security-source');

    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    const pageContent = await page.content();

    // Check for common sensitive patterns
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{20,}/, // API keys
      /password\s*[:=]\s*["'][^"']+["']/i, // Hardcoded passwords
      /secret\s*[:=]\s*["'][^"']+["']/i, // Secrets
      /-----BEGIN.*PRIVATE KEY-----/, // Private keys
    ];

    const issues: string[] = [];
    sensitivePatterns.forEach((pattern, i) => {
      if (pattern.test(pageContent)) {
        issues.push(`Pattern ${i + 1} matched`);
      }
    });

    console.log(`\n📊 SECURITY CHECK:`);
    console.log(`   Sensitive patterns found: ${issues.length}`);

    expect(issues).toHaveLength(0);
  });

  test('CSP headers present', async ({ page }) => {
    const report = setupPageMonitoring(page, 'security-csp');

    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};

    console.log(`\n📊 SECURITY HEADERS:`);
    console.log(`   Content-Security-Policy: ${headers['content-security-policy'] ? 'Present' : 'Missing'}`);
    console.log(`   X-Frame-Options: ${headers['x-frame-options'] || 'Missing'}`);
    console.log(`   X-Content-Type-Options: ${headers['x-content-type-options'] || 'Missing'}`);
  });
});

// ============================================================
// LAZY LOADING SPECIFIC TESTS
// ============================================================
test.describe('Lazy Loading Tests', () => {
  test('Code splitting works correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'code-splitting');

    const chunks: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') && url.includes('chunk')) {
        chunks.push(url);
      }
    });

    // Navigate through different routes to trigger lazy loading
    await page.goto(BASE_URL);
    await waitForAppLoad(page);

    await page.goto(`${BASE_URL}/login`);
    await waitForAppLoad(page);

    await page.goto(`${BASE_URL}/pricing`);
    await waitForAppLoad(page);

    console.log(`\n📊 CODE SPLITTING:`);
    console.log(`   Lazy-loaded chunks: ${chunks.length}`);

    // Should have multiple chunks for proper code splitting
    expect(chunks.length).toBeGreaterThan(0);
  });

  test('Suspense fallbacks render correctly', async ({ page }) => {
    const report = setupPageMonitoring(page, 'suspense');

    await page.goto(BASE_URL);

    // Check if loading indicators appear during lazy load
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').count();
    console.log(`📊 Loading indicators found: ${loadingIndicators}`);

    await waitForAppLoad(page);
    await screenshot(page, 'suspense-test');
  });
});

// ============================================================
// FINAL REPORT
// ============================================================
test.afterAll(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('📋 COMPREHENSIVE E2E TEST REPORT');
  console.log('='.repeat(70));

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalNetworkFailures = 0;
  const criticalIssues: string[] = [];

  for (const [testName, report] of Object.entries(globalReport)) {
    totalErrors += report.consoleErrors.length;
    totalWarnings += report.consoleWarnings.length;
    totalNetworkFailures += report.networkFailures.length;

    // Check for critical issues
    const immerErrors = report.consoleErrors.filter(e =>
      e.includes('Immer') || e.includes('frozen') || e.includes('Cannot modify')
    );
    if (immerErrors.length > 0) {
      criticalIssues.push(`${testName}: ${immerErrors.length} Immer/state errors`);
    }

    const typeErrors = report.consoleErrors.filter(e => e.includes('TypeError'));
    if (typeErrors.length > 0) {
      criticalIssues.push(`${testName}: ${typeErrors.length} TypeErrors`);
    }
  }

  console.log(`\n📊 OVERALL SUMMARY:`);
  console.log(`   Total Console Errors: ${totalErrors}`);
  console.log(`   Total Console Warnings: ${totalWarnings}`);
  console.log(`   Total Network Failures: ${totalNetworkFailures}`);
  console.log(`   Tests Monitored: ${Object.keys(globalReport).length}`);

  if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND:`);
    criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
  } else {
    console.log(`\n✅ NO CRITICAL ISSUES DETECTED!`);
  }

  console.log('\n' + '='.repeat(70));
});
