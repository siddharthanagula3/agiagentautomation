/**
 * Lighthouse CI Configuration
 * Performance budgets and audit settings for CI/CD pipeline
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test (uses preview server)
      url: ['http://localhost:4173/'],
      // Number of runs for averaging
      numberOfRuns: 3,
      // Static server configuration
      staticDistDir: './dist',
      // Start server command (vite preview)
      startServerCommand: 'npm run preview',
      // Wait for server to be ready
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      // Chrome flags for CI environment
      settings: {
        chromeFlags:
          '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        // Simulate mobile network conditions
        throttlingMethod: 'simulate',
        // Emulate mobile device
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        },
      },
    },
    assert: {
      // Use recommended preset as baseline
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance score must be at least 80%
        'categories:performance': ['error', { minScore: 0.8 }],
        // Accessibility score must be at least 90%
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        // Best practices score must be at least 85%
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        // SEO score must be at least 90%
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals - Performance Metrics
        // First Contentful Paint < 2s
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        // Largest Contentful Paint < 4s
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        // Total Blocking Time < 300ms
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        // Cumulative Layout Shift < 0.1
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        // Speed Index < 4s
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        // Time to Interactive < 5s
        interactive: ['warn', { maxNumericValue: 5000 }],

        // Resource size limits (uncompressed)
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }], // 2MB total

        // JavaScript execution time
        'bootup-time': ['warn', { maxNumericValue: 3000 }],
        // Main thread work
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],

        // Disable some audits that don't apply to SPAs
        'uses-http2': 'off', // Handled by CDN/hosting
        'uses-text-compression': 'off', // Handled by CDN
        'csp-xss': 'off', // CSP configured in netlify.toml

        // PWA audits (informational only)
        'service-worker': 'off',
        'installable-manifest': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'maskable-icon': 'off',

        // Reduce noise from third-party resources
        'third-party-facades': 'off',
        'third-party-summary': 'off',
      },
    },
    upload: {
      // Store results locally for now
      target: 'temporary-public-storage',
    },
  },
};
