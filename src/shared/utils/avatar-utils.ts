/**
 * Avatar Utilities
 * Handles avatar generation with fallbacks for rate limiting and failures
 */

// Fallback avatar URLs for when DiceBear API is unavailable
// Using robot/AI-themed avatars instead of human faces
const FALLBACK_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-1&backgroundColor=6366f1&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-2&backgroundColor=8b5cf6&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-3&backgroundColor=06b6d4&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-4&backgroundColor=10b981&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-5&backgroundColor=f59e0b&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-6&backgroundColor=ef4444&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-7&backgroundColor=ec4899&eyes=bulging&mouth=smile',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot-8&backgroundColor=84cc16&eyes=bulging&mouth=smile',
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

  // Use DiceBear API with bottts style for AI employees
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=6366f1&eyes=bulging&mouth=smile`;
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
  try {
    // Extract seed from DiceBear URL
    const url = new URL(diceBearUrl);
    const seed = url.searchParams.get('seed') || 'default';
    return getFallbackAvatar(seed);
  } catch (error) {
    // Handle malformed URLs by returning a fallback
    return getFallbackAvatar('default');
  }
}
