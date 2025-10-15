/**
 * Avatar Utilities
 * Handles avatar generation with local emoji-based avatars
 * No external API dependencies for faster, more reliable loading
 */

// Emoji-based avatars for AI employees (no external API needed)
// These work across all browsers and load instantly
const EMOJI_AVATARS = [
  '🤖', // Robot face
  '👨‍💻', // Man technologist
  '👩‍💻', // Woman technologist
  '🧑‍💼', // Person in business suit
  '👨‍🔬', // Man scientist
  '👩‍🔬', // Woman scientist
  '🧑‍🎨', // Person artist
  '👨‍🏫', // Man teacher
  '👩‍🏫', // Woman teacher
  '🧑‍🚀', // Person astronaut
  '👨‍⚕️', // Man health worker
  '👩‍⚕️', // Woman health worker
  '🧑‍⚖️', // Person judge
  '👨‍🌾', // Man farmer
  '👩‍🌾', // Woman farmer
  '🧑‍🍳', // Person cook
];

/**
 * Get a deterministic emoji avatar based on a seed string
 * @param seed - String to use for consistent avatar selection
 * @returns Emoji character for avatar
 */
export function getFallbackAvatar(seed: string): string {
  // Simple hash function to consistently select the same emoji for the same seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % EMOJI_AVATARS.length;

  // Return emoji as data URL SVG for use in img src
  const emoji = EMOJI_AVATARS[index];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="hsl(${hash % 360}, 70%, 95%)"/>
      <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="50">${emoji}</text>
    </svg>`
  )}`;
}

/**
 * Get avatar URL (now uses local emoji-based avatars)
 * @param seed - Seed for avatar generation
 * @param useFallback - Unused parameter (kept for compatibility)
 * @returns Avatar data URL
 */
export function getAvatarUrl(
  seed: string,
  _useFallback: boolean = false
): string {
  return getFallbackAvatar(seed);
}

/**
 * Generate avatar for AI employee
 * @param employeeName - Name of the AI employee
 * @param useFallback - Unused parameter (kept for compatibility)
 * @returns Avatar data URL
 */
export function getAIEmployeeAvatar(
  employeeName: string,
  _useFallback: boolean = false
): string {
  // Create a consistent seed from the employee name
  const seed = employeeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return getAvatarUrl(seed);
}

/**
 * Check if an avatar URL is a data URL (emoji-based)
 * @param url - Avatar URL to check
 * @returns True if URL is a data URL
 */
export function isDiceBearUrl(url: string): boolean {
  // Legacy function - now returns false since we don't use DiceBear
  return url.includes('api.dicebear.com');
}

/**
 * Get fallback avatar (returns emoji-based avatar)
 * @param originalUrl - Original avatar URL
 * @returns Emoji-based avatar data URL
 */
export function getFallbackForDiceBear(originalUrl: string): string {
  try {
    // Try to extract seed from URL
    if (originalUrl.includes('seed=')) {
      const url = new URL(originalUrl);
      const seed = url.searchParams.get('seed') || 'default';
      return getFallbackAvatar(seed);
    }
  } catch (error) {
    // Ignore errors
  }
  return getFallbackAvatar('default');
}
