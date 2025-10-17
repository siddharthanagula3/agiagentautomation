/**
 * Avatar Utilities
 * Provides deterministic DiceBear avatar URLs with graceful fallbacks.
 */

const DICEBEAR_BASE_URL = 'https://api.dicebear.com/7.x';
const DEFAULT_COLLECTION = 'bottts';
const DEFAULT_SEED = 'ai-workforce';

const DEFAULT_QUERY_PARAMS = {
  backgroundColor: ['EEF2FF', 'E0F2FE', 'F0F9FF'].join(','), // calm gradient palette
  radius: '50',
  size: '128',
};

const DICEBEAR_URL_REGEX =
  /^https:\/\/api\.dicebear\.com\/\d+\.x\/[^/]+\/svg\?(.+)/;

function normaliseSeed(rawSeed: string): string {
  const trimmed = rawSeed.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_SEED;
}

function buildDiceBearUrl(seed: string): string {
  const params = new URLSearchParams({
    seed: normaliseSeed(seed),
    backgroundColor: DEFAULT_QUERY_PARAMS.backgroundColor,
    radius: DEFAULT_QUERY_PARAMS.radius,
    size: DEFAULT_QUERY_PARAMS.size,
  });

  const query = params.toString().replace(/\+/g, '%20');
  return `${DICEBEAR_BASE_URL}/${DEFAULT_COLLECTION}/svg?${query}`;
}

/**
 * Get a deterministic DiceBear avatar URL for a given seed.
 */
export function getFallbackAvatar(seed: string): string {
  return buildDiceBearUrl(seed);
}

/**
 * Primary avatar helper used across the app.
 * When `useFallback` is true we still return a DiceBear URL so existing callers
 * can continue to serve the same asset while we track the intent flag.
 */
export function getAvatarUrl(
  seed: string,
  useFallback: boolean = false
): string {
  if (useFallback) {
    return getFallbackAvatar(seed);
  }

  return buildDiceBearUrl(seed);
}

/**
 * Deterministic avatar for AI employees.
 */
export function getAIEmployeeAvatar(
  employeeName: string,
  useFallback: boolean = false
): string {
  const normalised = employeeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '');

  return getAvatarUrl(normalised || DEFAULT_SEED, useFallback);
}

/**
 * Basic DiceBear URL detection.
 */
export function isDiceBearUrl(url: string): boolean {
  return DICEBEAR_URL_REGEX.test(url);
}

/**
 * Extracts the original seed (if present) and produces a DiceBear URL so the UI
 * can gracefully recover from slow or failed image fetches.
 */
export function getFallbackForDiceBear(originalUrl: string): string {
  try {
    const sourceUrl = new URL(originalUrl);
    const seed = sourceUrl.searchParams.get('seed');
    if (seed) {
      return getFallbackAvatar(decodeURIComponent(seed));
    }
  } catch (_error) {
    // Swallow parsing errors and fall back to a deterministic default.
  }

  return getFallbackAvatar(DEFAULT_SEED);
}
