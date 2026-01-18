import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  // In CI, run tests in parallel for faster execution
  // Locally, run sequentially for better debugging and consistent screenshots
  fullyParallel: isCI,
  forbidOnly: isCI,
  // More retries in CI to handle flaky tests
  retries: isCI ? 2 : 1,
  // In CI, use more workers for parallel execution; locally use 1 for consistency
  workers: isCI ? 2 : 1,
  // Timeout settings
  timeout: isCI ? 60000 : 30000, // 60s in CI, 30s locally
  expect: {
    timeout: isCI ? 10000 : 5000, // 10s in CI, 5s locally
  },
  reporter: isCI
    ? [['html', { outputFolder: 'playwright-report' }], ['github'], ['list']]
    : [['html'], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    // Only capture trace on failure in CI to save resources
    trace: isCI ? 'retain-on-failure' : 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Headless mode (always true in CI)
    headless: isCI ? true : undefined,
    // Action timeout
    actionTimeout: isCI ? 15000 : 10000,
  },
  // In CI, only run Chromium for faster builds
  // Locally, run all browsers for comprehensive testing
  projects: isCI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    // Longer timeout in CI for cold start
    timeout: isCI ? 120000 : 60000,
  },
});
