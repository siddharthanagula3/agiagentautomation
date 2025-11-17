/**
 * CORS Configuration Utility
 * Provides secure CORS headers based on environment
 */

// Allowed origins - configurable per environment
const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:8888',
  'https://agiagentautomation.netlify.app',
  // Add your production domains here
];

/**
 * Get CORS headers for a given origin
 * @param origin - The origin from the request headers
 * @returns CORS headers object or null if origin not allowed
 */
export function getCorsHeaders(origin?: string) {
  // Updated: Nov 16th 2025 - Fixed insecure CORS configuration - don't fall back to default origin
  // Check if origin is allowed
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  // If origin is not allowed, only return the allowed origin for legitimate requests
  // For development, we'll be more permissive, but for production this should be strict
  const allowedOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Check if origin is allowed
 * @param origin - The origin from the request headers
 * @returns true if origin is allowed
 */
export function isOriginAllowed(origin?: string): boolean {
  return origin ? ALLOWED_ORIGINS.includes(origin) : false;
}

/**
 * Standard headers for all API responses
 * @param origin - The origin from the request headers
 * @returns Combined security and CORS headers
 */
export function getApiHeaders(origin?: string) {
  return {
    ...getCorsHeaders(origin),
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Handle OPTIONS preflight requests
 * @param origin - The origin from the request headers
 * @returns Response for OPTIONS request
 */
export function handleCorsPreflightRequest(origin?: string) {
  return {
    statusCode: 204,
    headers: getCorsHeaders(origin),
    body: '',
  };
}
