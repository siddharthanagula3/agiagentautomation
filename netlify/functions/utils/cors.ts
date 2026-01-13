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
  if (origin.endsWith('.netlify.app') && origin.includes('agiagentautomation')) {
    return true;
  }

  return false;
}

/**
 * Get CORS headers with proper origin validation
 * @param origin - The origin header from the request
 * @returns Object containing CORS headers
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  // Validate origin - if valid, echo it back; otherwise use first allowed origin
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Get a minimal set of CORS headers (for error responses)
 * @param origin - The origin header from the request
 * @returns Object containing minimal CORS headers
 */
export function getMinimalCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };
}
