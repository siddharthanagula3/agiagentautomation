/**
 * Avatar Utilities
 * Handles avatar generation with fallbacks for rate limiting and failures
 */

// Fallback avatar URLs for when DiceBear API is unavailable
const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
];

/**
 * Get a fallback avatar URL based on a seed string
 * @param seed - String to use for consistent avatar selection
 * @returns Fallback avatar URL
 */
export function getFallbackAvatar(seed: string): string {
  // Simple hash function to consistently select the same fallback for the same seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % FALLBACK_AVATARS.length;
  return FALLBACK_AVATARS[index];
}

/**
 * Get avatar URL with fallback handling
 * @param seed - Seed for avatar generation
 * @param useFallback - Whether to use fallback instead of DiceBear
 * @returns Avatar URL
 */
export function getAvatarUrl(
  seed: string,
  useFallback: boolean = false
): string {
  if (useFallback) {
    return getFallbackAvatar(seed);
  }

  // Use DiceBear API with fallback
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Generate avatar URL for AI employee
 * @param employeeName - Name of the AI employee
 * @param useFallback - Whether to use fallback instead of DiceBear
 * @returns Avatar URL
 */
export function getAIEmployeeAvatar(
  employeeName: string,
  useFallback: boolean = false
): string {
  // Create a consistent seed from the employee name
  const seed = employeeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return getAvatarUrl(seed, useFallback);
}

/**
 * Check if an avatar URL is from DiceBear API
 * @param url - Avatar URL to check
 * @returns True if URL is from DiceBear API
 */
export function isDiceBearUrl(url: string): boolean {
  return url.includes('api.dicebear.com');
}

/**
 * Get fallback URL for a DiceBear URL
 * @param diceBearUrl - Original DiceBear URL
 * @returns Fallback avatar URL
 */
export function getFallbackForDiceBear(diceBearUrl: string): string {
  // Extract seed from DiceBear URL
  const url = new URL(diceBearUrl);
  const seed = url.searchParams.get('seed') || 'default';
  return getFallbackAvatar(seed);
}
