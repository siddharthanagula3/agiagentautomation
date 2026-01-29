/**
 * CORS Utility for Netlify Functions
 * Provides secure origin validation instead of wildcard CORS
 * Created: Jan 6th 2026
 */

// List of allowed origins for CORS
const ALLOWED_ORIGINS: string[] = [
  // Production domains
  'https://agiagentautomation.netlify.app',
  'https://agiagentautomation.com',
  'https://www.agiagentautomation.com',
  // Development
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8888',
];

/**
 * Validates an origin against the allowed origins list
 * @param origin - The origin header from the request
 * @returns true if the origin is allowed
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  // Check exact match first
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Check for Netlify deploy previews and branch deploys
  // Format: https://deploy-preview-123--agiagentautomation.netlify.app
  // Or: https://branch-name--agiagentautomation.netlify.app
  // SECURITY FIX: Use strict suffix matching to prevent subdomain spoofing
  // e.g., agiagentautomation-evil.netlify.app would NOT be allowed
  if (origin.endsWith('.netlify.app')) {
    // Extract the site name part (everything before .netlify.app)
    const sitePart = origin.replace('https://', '').replace('.netlify.app', '');
    // Valid patterns:
    // - "agiagentautomation" (main site)
    // - "deploy-preview-123--agiagentautomation" (deploy previews)
    // - "branch-name--agiagentautomation" (branch deploys)
    // Must either BE "agiagentautomation" or END with "--agiagentautomation"
    if (sitePart === 'agiagentautomation' || sitePart.endsWith('--agiagentautomation')) {
      return true;
    }
  }

  return false;
}

/**
 * Get CORS headers with proper origin validation
 * @param origin - The origin header from the request
 * @returns Object containing CORS headers, or null if origin not allowed
 * Updated: Jan 13th 2026 - Fixed: Return null for unauthorized origins instead of falling back
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> | null {
  // SECURITY FIX: If origin is not allowed, return null instead of falling back
  // This prevents CORS bypass attacks
  if (!isAllowedOrigin(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Get a minimal set of CORS headers (for error responses)
 * @param origin - The origin header from the request
 * @returns Object containing minimal CORS headers for allowed origins, or security headers only
 * Updated: Jan 13th 2026 - Fixed: Return null for unauthorized origins
 * Updated: Jan 29th 2026 - Changed to always return headers (security headers fallback)
 */
export function getMinimalCorsHeaders(origin: string | undefined): Record<string, string> {
  // SECURITY FIX: If origin is not allowed, return security headers only (no CORS)
  if (!isAllowedOrigin(origin)) {
    return getSecurityHeaders();
  }

  return {
    'Access-Control-Allow-Origin': origin!,
    'Vary': 'Origin',
    ...getSecurityHeaders(),
  };
}

/**
 * Get security headers (for responses to unauthorized origins)
 * @returns Object containing security headers without CORS
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * SAFE HELPER: Get CORS headers with fallback to security-only headers
 * Use this when you need headers that are safe to spread even for unauthorized origins
 * Returns CORS headers for allowed origins, or just security headers for unauthorized
 *
 * This is safer than getCorsHeaders() which returns null for unauthorized origins
 * @param origin - The origin header from the request
 * @returns Object containing headers (CORS if allowed, security-only if not)
 */
export function getSafeCorsHeaders(origin: string | undefined): Record<string, string> {
  const corsHeaders = getCorsHeaders(origin);
  if (corsHeaders) {
    return {
      ...corsHeaders,
      ...getSecurityHeaders(),
    };
  }
  // Return security headers without CORS for unauthorized origins
  // This is safe to spread and won't cause crashes
  return getSecurityHeaders();
}

/**
 * Check if origin should be blocked and return appropriate error response
 * Use at the start of handlers to early-exit for unauthorized origins
 * @param origin - The origin header from the request
 * @returns Error response object if origin is unauthorized, null if allowed
 */
export function checkOriginAndBlock(origin: string | undefined): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} | null {
  if (!isAllowedOrigin(origin)) {
    console.warn('[CORS] Blocked request from unauthorized origin:', origin || 'none');
    return {
      statusCode: 403,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Forbidden',
        message: 'Origin not allowed',
      }),
    };
  }
  return null;
}
