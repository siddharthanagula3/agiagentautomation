/**
 * Security utilities for data protection and safe operations
 * Handles XSS prevention, data sanitization, and security headers
 */

import DOMPurify from 'dompurify';

// ========================================
// XSS Protection and Data Sanitization
// ========================================

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedSchemes?: string[];
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: boolean;
}

export class SecurityManager {
  private static defaultSanitizeConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'a', 'b', 'strong', 'i', 'em', 'u', 'span', 'div', 'p', 'br',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody',
      'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'class', 'id', 'target',
      'rel', 'width', 'height', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  };

  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(
    html: string,
    options: SanitizeOptions = {}
  ): string {
    if (!html) return '';

    const config: DOMPurify.Config = {
      ...this.defaultSanitizeConfig,
      ...(options.allowedTags && { ALLOWED_TAGS: options.allowedTags }),
      ...(options.allowedAttributes && { ALLOWED_ATTR: options.allowedAttributes }),
    };

    return DOMPurify.sanitize(html, config);
  }

  // Sanitize text for safe display (removes all HTML)
  static sanitizeText(text: string): string {
    if (!text) return '';

    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  // Sanitize URL to prevent javascript: and data: schemes
  static sanitizeUrl(url: string): string {
    if (!url) return '';

    // Remove dangerous schemes
    const sanitized = url.replace(/^(javascript|data|vbscript):/i, '');

    // Ensure it starts with allowed schemes or is relative
    if (!/^(https?:|mailto:|tel:|#|\/)/i.test(sanitized)) {
      return `https://${sanitized}`;
    }

    return sanitized;
  }

  // Escape HTML entities in text
  static escapeHtml(text: string): string {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Unescape HTML entities
  static unescapeHtml(html: string): string {
    if (!html) return '';

    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Validate and sanitize JSON input
  static sanitizeJson<T = unknown>(
    jsonString: string,
    maxDepth: number = 10
  ): T | null {
    try {
      const parsed = JSON.parse(jsonString);
      return this.deepSanitize(parsed, maxDepth);
    } catch (error) {
      console.error('JSON sanitization failed:', error);
      return null;
    }
  }

  // Deep sanitize object recursively
  private static deepSanitize(obj: unknown, maxDepth: number, currentDepth = 0): unknown {
    if (currentDepth >= maxDepth) {
      return null;
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item, maxDepth, currentDepth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize object keys as well
        const cleanKey = this.sanitizeText(key);
        if (cleanKey) {
          sanitized[cleanKey] = this.deepSanitize(value, maxDepth, currentDepth + 1);
        }
      }
      return sanitized;
    }

    return null;
  }

  // Validate file upload security
  static validateFileUpload(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Check file size
    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('File type not allowed based on extension');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate secure random string
  static generateSecureId(length: number = 32): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for older browsers
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Hash sensitive data (client-side hashing for non-security-critical use)
  static async hashString(input: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Simple fallback hash (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/i, // repeated characters
      /123456|password|qwerty|admin/i, // common weak passwords
      /(.)(.)\1\2/i, // alternating patterns
    ];

    if (weakPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Password contains weak patterns');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  // Rate limiting implementation
  static createRateLimiter(windowMs: number, maxRequests: number) {
    const requests = new Map<string, number[]>();

    return (key: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this key
      const keyRequests = requests.get(key) || [];

      // Filter out requests outside the time window
      const validRequests = keyRequests.filter(time => time > windowStart);

      // Check if limit exceeded
      if (validRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      validRequests.push(now);
      requests.set(key, validRequests);

      return true;
    };
  }
}

// ========================================
// Content Security Policy (CSP) Helper
// ========================================

export class CSPManager {
  private static policies: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https:'],
    'connect-src': ["'self'", 'wss:', 'https:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  static addSource(directive: string, source: string): void {
    if (!this.policies[directive]) {
      this.policies[directive] = [];
    }
    if (!this.policies[directive].includes(source)) {
      this.policies[directive].push(source);
    }
  }

  static removeSource(directive: string, source: string): void {
    if (this.policies[directive]) {
      this.policies[directive] = this.policies[directive].filter(s => s !== source);
    }
  }

  static generateCSPString(): string {
    return Object.entries(this.policies)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  static setCSPMeta(): void {
    if (typeof document === 'undefined') return;

    // Remove existing CSP meta tag
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existing) {
      existing.remove();
    }

    // Add new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSPString();
    document.head.appendChild(meta);
  }
}

// ========================================
// Secure Storage Utility
// ========================================

export class SecureStorage {
  private static readonly ENCRYPTION_KEY_NAME = 'agi_secure_key';

  // Generate or retrieve encryption key
  private static async getEncryptionKey(): Promise<CryptoKey | null> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      return null;
    }

    try {
      // Try to import existing key
      const keyData = localStorage.getItem(this.ENCRYPTION_KEY_NAME);
      if (keyData) {
        const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
        return await window.crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
      }

      // Generate new key
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Export and store key
      const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
      const keyString = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
      localStorage.setItem(this.ENCRYPTION_KEY_NAME, keyString);

      return key;
    } catch (error) {
      console.error('Encryption key generation failed:', error);
      return null;
    }
  }

  // Encrypt and store data
  static async setItem(key: string, value: unknown): Promise<boolean> {
    try {
      const encryptionKey = await this.getEncryptionKey();
      if (!encryptionKey) {
        // Fallback to regular localStorage
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(JSON.stringify(value));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        encodedData
      );

      const encryptedData = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedBuffer)),
      };

      localStorage.setItem(key, btoa(JSON.stringify(encryptedData)));
      return true;
    } catch (error) {
      console.error('Secure storage set failed:', error);
      return false;
    }
  }

  // Retrieve and decrypt data
  static async getItem<T = unknown>(key: string): Promise<T | null> {
    try {
      const storedData = localStorage.getItem(key);
      if (!storedData) return null;

      const encryptionKey = await this.getEncryptionKey();
      if (!encryptionKey) {
        // Fallback to regular localStorage
        return JSON.parse(storedData);
      }

      const encryptedData = JSON.parse(atob(storedData));
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        data
      );

      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      // Try fallback to regular parsing
      try {
        const storedData = localStorage.getItem(key);
        return storedData ? JSON.parse(storedData) : null;
      } catch {
        return null;
      }
    }
  }

  // Remove item
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all secure data
  static clear(): void {
    localStorage.clear();
  }
}

// ========================================
// Security Headers Validation
// ========================================

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Strict-Transport-Security'?: string;
}

export class SecurityHeaderValidator {
  private static recommendedHeaders: SecurityHeaders = {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  static validateResponse(response: Response): {
    score: number;
    missing: string[];
    present: string[];
  } {
    const missing: string[] = [];
    const present: string[] = [];

    Object.keys(this.recommendedHeaders).forEach(header => {
      if (response.headers.has(header)) {
        present.push(header);
      } else {
        missing.push(header);
      }
    });

    const score = (present.length / Object.keys(this.recommendedHeaders).length) * 100;

    return { score, missing, present };
  }

  static getRecommendations(): SecurityHeaders {
    return { ...this.recommendedHeaders };
  }
}

// ========================================
// Export all security utilities
// ========================================

export {
  SecurityManager as Security,
  CSPManager as CSP,
};

// Create default instance
export const securityManager = new SecurityManager();

export default SecurityManager;