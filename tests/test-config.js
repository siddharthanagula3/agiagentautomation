// E2E Test Configuration
export const TEST_CONFIG = {
  // Base URL - testing production deployment
  baseURL: 'https://agiagentautomation.com',

  // Test credentials
  credentials: {
    email: 'siddharthanagula@gmail.com',
    password: 'Sid@1234'
  },

  // Wait time after GitHub push (45 seconds)
  githubPushWait: 45000,

  // Timeouts
  timeout: {
    navigation: 30000,
    element: 10000,
    ajax: 15000
  },

  // Browser options
  browser: {
    headless: true, // Set to false for debugging
    slowMo: 50, // Slow down by 50ms for stability
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  },

  // Screenshot options
  screenshots: {
    path: './tests/screenshots',
    fullPage: true,
    type: 'png'
  },

  // Report options
  reports: {
    json: './tests/reports/test-results.json',
    html: './tests/reports/test-results.html'
  }
};

// All routes to test
export const ROUTES = {
  public: [
    { path: '/', name: 'Landing Page', critical: true },
    { path: '/blog', name: 'Blog', critical: false },
    { path: '/resources', name: 'Resources', critical: false },
    { path: '/help', name: 'Help', critical: false },
    { path: '/pricing', name: 'Pricing', critical: true },
    { path: '/contact-sales', name: 'Contact Sales', critical: true },
    { path: '/about', name: 'About', critical: false },
    { path: '/careers', name: 'Careers', critical: false },
    { path: '/security', name: 'Security', critical: false },
    { path: '/documentation', name: 'Documentation', critical: false },
    { path: '/api-reference', name: 'API Reference', critical: false },
    { path: '/marketplace', name: 'Marketplace', critical: true },
    { path: '/privacy-policy', name: 'Privacy Policy', critical: false },
    { path: '/terms-of-service', name: 'Terms of Service', critical: false },
    { path: '/cookie-policy', name: 'Cookie Policy', critical: false },
    { path: '/use-cases/startups', name: 'Startups Use Case', critical: false },
    { path: '/use-cases/it-service-providers', name: 'IT Service Providers', critical: false },
    { path: '/use-cases/sales-teams', name: 'Sales Teams', critical: false },
    { path: '/use-cases/consulting-businesses', name: 'Consulting Businesses', critical: false },
    { path: '/features/ai-chat', name: 'AI Chat Feature', critical: false },
    { path: '/features/ai-dashboards', name: 'AI Dashboards Feature', critical: false },
    { path: '/features/ai-project-manager', name: 'AI Project Manager', critical: false },
    { path: '/vs-chatgpt', name: 'ChatGPT Comparison', critical: false },
    { path: '/vs-claude', name: 'Claude Comparison', critical: false },
    { path: '/chatgpt-alternative', name: 'ChatGPT Alternative', critical: false },
    { path: '/claude-alternative', name: 'Claude Alternative', critical: false }
  ],

  auth: [
    { path: '/login', name: 'Login', critical: true },
    { path: '/register', name: 'Register', critical: true },
    { path: '/forgot-password', name: 'Forgot Password', critical: false },
    { path: '/reset-password', name: 'Reset Password', critical: false }
  ],

  protected: [
    { path: '/dashboard', name: 'Dashboard', critical: true },
    { path: '/workforce', name: 'Workforce', critical: true },
    { path: '/vibe', name: 'Vibe Coding', critical: true },
    { path: '/chat', name: 'Chat', critical: true },
    { path: '/chat-agent', name: 'Chat Agent', critical: false },
    { path: '/chat-multi', name: 'Multi Chat', critical: false },
    { path: '/settings', name: 'Settings', critical: true },
    { path: '/settings/ai-configuration', name: 'AI Configuration', critical: false },
    { path: '/billing', name: 'Billing', critical: true },
    { path: '/support', name: 'Support', critical: false }
  ]
};

// Test checklist for each page
export const TEST_CHECKLIST = {
  pageLoad: 'Page loads without errors',
  noConsoleErrors: 'No console errors',
  no404s: 'No 404 network errors',
  seoMeta: 'SEO meta tags present',
  imagesLoad: 'All images load',
  buttonsClickable: 'All buttons are clickable',
  linksWork: 'All links navigate correctly',
  formsValidate: 'Forms validate correctly',
  responsive: 'Responsive design works'
};
