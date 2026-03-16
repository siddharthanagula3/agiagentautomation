/**
 * Generate a cryptographically secure random ID string.
 * Replacement for insecure Math.random().toString(36) pattern.
 */
export function generateSecureId(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}
