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
 * @returns CORS headers object
 */
export function getCorsHeaders(origin?: string) {
  // Check if origin is allowed
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
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
