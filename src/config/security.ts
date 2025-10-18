export const SECURITY_CONFIG = {
  // Password requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&',
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Session management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 15 * 60 * 1000, // 15 minutes before expiry
    maxConcurrentSessions: 5,
    requireReauth: ['payments', 'settings', 'admin'],
  },

  // API security
  api: {
    maxRetries: 3,
    timeoutMs: 30000,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxRequestsPerWindow: 1000,
    enableCsrf: true,
    corsOrigins:
      import.meta.env.MODE === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:8080'],
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for React development
      'https://js.stripe.com',
      'https://connect.facebook.net',
      'https://www.google-analytics.com',
    ],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: [
      "'self'",
      'https://api.stripe.com',
      'wss://localhost:*',
      import.meta.env.VITE_API_URL || 'http://localhost:8000',
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  },

  // Data sanitization
  sanitization: {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'br',
      'p',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  },

  // File upload restrictions
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'text/csv',
    ],
    allowedExtensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.txt',
      '.json',
      '.csv',
    ],
    quarantinePath: '/tmp/uploads/quarantine',
    scanForMalware: true,
  },

  // Audit logging
  audit: {
    enabledEvents: [
      'auth.login',
      'auth.logout',
      'auth.failed_login',
      'auth.password_change',
      'auth.account_locked',
      'data.create',
      'data.update',
      'data.delete',
      'payment.initiated',
      'payment.completed',
      'payment.failed',
      'admin.action',
      'security.violation',
    ],
    retentionDays: 365,
    enableRealtime: true,
  },

  // Feature flags for security
  features: {
    twoFactorAuth: import.meta.env.MODE === 'production',
    biometricAuth: false, // Future feature
    deviceFingerprinting: true,
    geoBlocking: false,
    suspiciousActivityDetection: true,
  },

  // Error handling
  errors: {
    exposeStackTrace: import.meta.env.MODE !== 'production',
    logSensitiveData: false,
    enableDetailedErrors: import.meta.env.MODE === 'development',
    sanitizeErrorMessages: true,
  },
} as const;

export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const;

export const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  PREMIUM: 'premium',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const PERMISSIONS = {
  // Chat permissions
  'chat.send': 'Send chat messages',
  'chat.delete': 'Delete chat messages',
  'chat.moderate': 'Moderate chat conversations',

  // Workforce permissions
  'workforce.view': 'View workforce dashboard',
  'workforce.create': 'Create workforce tasks',
  'workforce.manage': 'Manage workforce assignments',
  'workforce.analytics': 'View workforce analytics',

  // Marketplace permissions
  'marketplace.browse': 'Browse employee marketplace',
  'marketplace.purchase': 'Purchase from marketplace',
  'marketplace.sell': 'Sell in marketplace',
  'marketplace.manage': 'Manage marketplace listings',

  // Payment permissions
  'payment.view': 'View payment history',
  'payment.process': 'Process payments',
  'payment.refund': 'Process refunds',
  'payment.admin': 'Admin payment operations',

  // Admin permissions
  'admin.users': 'Manage users',
  'admin.system': 'System administration',
  'admin.audit': 'View audit logs',
  'admin.config': 'Modify system configuration',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.GUEST]: [PERMISSIONS['marketplace.browse']],
  [USER_ROLES.USER]: [
    PERMISSIONS['chat.send'],
    PERMISSIONS['workforce.view'],
    PERMISSIONS['marketplace.browse'],
    PERMISSIONS['marketplace.purchase'],
    PERMISSIONS['payment.view'],
  ],
  [USER_ROLES.PREMIUM]: [
    PERMISSIONS['chat.send'],
    PERMISSIONS['workforce.view'],
    PERMISSIONS['workforce.create'],
    PERMISSIONS['marketplace.browse'],
    PERMISSIONS['marketplace.purchase'],
    PERMISSIONS['marketplace.sell'],
    PERMISSIONS['payment.view'],
    PERMISSIONS['payment.process'],
  ],
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS['chat.send'],
    PERMISSIONS['chat.delete'],
    PERMISSIONS['chat.moderate'],
    PERMISSIONS['workforce.view'],
    PERMISSIONS['workforce.create'],
    PERMISSIONS['workforce.manage'],
    PERMISSIONS['marketplace.browse'],
    PERMISSIONS['marketplace.purchase'],
    PERMISSIONS['marketplace.sell'],
    PERMISSIONS['marketplace.manage'],
    PERMISSIONS['payment.view'],
    PERMISSIONS['payment.process'],
  ],
  [USER_ROLES.ADMIN]: [
    ...Object.values(PERMISSIONS).filter((p) => !p.startsWith('admin.')),
    PERMISSIONS['admin.users'],
    PERMISSIONS['admin.audit'],
  ],
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
} as const;
