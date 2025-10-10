import path from 'path';
import fs from 'fs';
import { TEST_CONFIG } from './test-config.js';

/**
 * Wait for specified milliseconds
 */
export async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page, testName, status = 'failed') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName.replace(/\s+/g, '-')}_${status}_${timestamp}.png`;
  const filepath = path.join(TEST_CONFIG.screenshots.path, filename);

  await page.screenshot({
    path: filepath,
    fullPage: TEST_CONFIG.screenshots.fullPage,
    type: TEST_CONFIG.screenshots.type
  });

  return filepath;
}

/**
 * Check for console errors
 */
export function setupConsoleListener(page) {
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: 'console-error',
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push({
      type: 'page-error',
      message: error.message,
      stack: error.stack
    });
  });

  return consoleErrors;
}

/**
 * Check for network errors (404s, 500s)
 */
export function setupNetworkListener(page) {
  const networkErrors = [];

  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({
        url: response.url(),
        status: status,
        statusText: response.statusText()
      });
    }
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      error: request.failure().errorText
    });
  });

  return networkErrors;
}

/**
 * Test if all images loaded
 */
export async function checkImagesLoaded(page) {
  return await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const failed = images.filter(img => !img.complete || img.naturalHeight === 0);

    return {
      total: images.length,
      failed: failed.map(img => ({
        src: img.src,
        alt: img.alt
      }))
    };
  });
}

/**
 * Check if all buttons are clickable
 */
export async function checkButtonsClickable(page) {
  return await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const issues = [];

    buttons.forEach((btn, index) => {
      const rect = btn.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';

      if (!isVisible && !isDisabled) {
        issues.push({
          index,
          text: btn.textContent?.trim().substring(0, 50),
          issue: 'Button not visible'
        });
      }
    });

    return {
      total: buttons.length,
      issues
    };
  });
}

/**
 * Check if all links work (basic check)
 */
export async function checkLinks(page) {
  return await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const issues = [];

    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') {
        issues.push({
          index,
          text: link.textContent?.trim().substring(0, 50),
          href: href,
          issue: 'Invalid or empty href'
        });
      }
    });

    return {
      total: links.length,
      issues
    };
  });
}

/**
 * Check SEO meta tags
 */
export async function checkSEOTags(page) {
  return await page.evaluate(() => {
    const tags = {
      title: document.querySelector('title')?.textContent,
      description: document.querySelector('meta[name="description"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      robots: document.querySelector('meta[name="robots"]')?.content
    };

    const missing = [];
    if (!tags.title) missing.push('title');
    if (!tags.description) missing.push('description');
    if (!tags.ogTitle) missing.push('og:title');
    if (!tags.canonical) missing.push('canonical');

    return {
      tags,
      missing,
      hasSEO: missing.length === 0
    };
  });
}

/**
 * Login to the application
 */
export async function login(page, email, password) {
  try {
    await page.goto(`${TEST_CONFIG.baseURL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: TEST_CONFIG.timeout.navigation
    });

    // Wait for form
    await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeout.element });

    // Fill credentials
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);

    // Click submit button and wait for either navigation OR error message
    await page.click('button[type="submit"]');

    // Wait for either navigation or error (whichever comes first)
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
      page.waitForSelector('[role="alert"]', { timeout: 10000 }).catch(() => {}),
      page.waitForSelector('.error', { timeout: 10000 }).catch(() => {}),
      wait(10000) // Fallback: wait 10 seconds
    ]);

    // Give the page time to settle
    await wait(2000);

    // Check if login successful (should redirect to dashboard)
    const url = page.url();
    const isLoggedIn = url.includes('/dashboard') || url.includes('/workforce') || url.includes('/vibe');

    // If login failed, try to get error message for debugging
    let errorMessage = null;
    if (!isLoggedIn) {
      try {
        errorMessage = await page.evaluate(() => {
          const alert = document.querySelector('[role="alert"]');
          const error = document.querySelector('.error, .text-destructive, .text-red-500');
          return alert?.textContent || error?.textContent || 'No error message found';
        });
      } catch (e) {
        errorMessage = 'Could not extract error message';
      }
    }

    return {
      success: isLoggedIn,
      currentURL: url,
      error: isLoggedIn ? null : errorMessage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create test result object
 */
export function createTestResult(route, success, data = {}) {
  return {
    route: route.path,
    name: route.name,
    critical: route.critical,
    success,
    timestamp: new Date().toISOString(),
    ...data
  };
}

/**
 * Save JSON report
 */
export function saveJSONReport(results, filepath) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
}

/**
 * Categorize test results by severity
 */
export function categorizeResults(results) {
  const categories = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    passed: []
  };

  results.forEach(result => {
    if (result.success) {
      categories.passed.push(result);
    } else if (result.critical) {
      categories.critical.push(result);
    } else if (result.errors?.networkErrors?.length > 0 || result.errors?.consoleErrors?.length > 0) {
      categories.high.push(result);
    } else if (result.issues?.images?.failed?.length > 0 || result.issues?.buttons?.issues?.length > 0) {
      categories.medium.push(result);
    } else {
      categories.low.push(result);
    }
  });

  return categories;
}
