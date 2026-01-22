/**
 * Prompt Injection Detection Service
 *
 * CRITICAL SECURITY: Detects and prevents prompt injection attacks
 * that attempt to manipulate AI behavior or extract sensitive information
 *
 * Patterns detected:
 * - Jailbreak attempts
 * - Role manipulation
 * - System prompt extraction
 * - Instruction override
 * - Data exfiltration attempts
 */

import { supabase } from '@shared/lib/supabase-client';

export interface InjectionDetectionResult {
  isSafe: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  sanitizedContent?: string;
  confidence: number; // 0-1
}

export interface HomoglyphDetectionResult {
  isSafe: boolean;
  detectedHomoglyphs: string[];
  mixedScripts: string[];
  confidence: number; // 0-1, higher = more likely an attack
  normalizedText: string;
}

/**
 * Comprehensive homoglyph map: Unicode characters that visually resemble Latin letters
 * Used for detecting phishing/injection attacks using lookalike characters
 *
 * Format: { targetChar: [lookalike codepoints] }
 * - Cyrillic characters (U+0400-U+04FF)
 * - Greek characters (U+0370-U+03FF)
 * - Other confusables (mathematical, fullwidth, etc.)
 */
const HOMOGLYPH_MAP: Record<string, string[]> = {
  // Lowercase Latin -> Cyrillic/Greek/Other confusables
  a: [
    '\u0430', // Cyrillic а
    '\u03B1', // Greek α (alpha)
    '\u0251', // Latin alpha
  ],
  c: [
    '\u0441', // Cyrillic с
    '\u03F2', // Greek lunate sigma
    '\u217D', // Roman numeral c
  ],
  d: [
    '\u0501', // Cyrillic ԁ (komi de)
    '\u217E', // Roman numeral d
  ],
  e: [
    '\u0435', // Cyrillic е
    '\u03B5', // Greek ε (epsilon)
    '\u0454', // Cyrillic є (Ukrainian ie)
    '\u212E', // Estimated symbol
  ],
  g: [
    '\u0581', // Armenian ց (small co)
    '\u0261', // Latin script g
  ],
  h: [
    '\u04BB', // Cyrillic һ (Shha)
    '\u210E', // Planck constant
  ],
  i: [
    '\u0456', // Cyrillic і (Ukrainian/Belarusian i)
    '\u03B9', // Greek ι (iota)
    '\u0131', // Latin dotless i
    '\u2170', // Roman numeral i
  ],
  j: [
    '\u0458', // Cyrillic ј
    '\u03F3', // Greek yot
  ],
  k: [
    '\u03BA', // Greek κ (kappa)
    '\u0138', // Latin kra
  ],
  l: [
    '\u04CF', // Cyrillic ӏ (palochka)
    '\u0399', // Greek Ι (capital iota - used as lowercase confusable)
    '\u2113', // Script l
    '\u217C', // Roman numeral l
  ],
  m: [
    '\u217F', // Roman numeral m
  ],
  n: [
    '\u03B7', // Greek η (eta)
    '\u0578', // Armenian ո
  ],
  o: [
    '\u043E', // Cyrillic о
    '\u03BF', // Greek ο (omicron)
    '\u0D20', // Malayalam ഠ
    '\u0585', // Armenian օ
    '\u2134', // Script o
  ],
  p: [
    '\u0440', // Cyrillic р
    '\u03C1', // Greek ρ (rho)
    '\u2374', // APL rho
  ],
  q: [
    '\u0566', // Armenian ֆ
  ],
  r: [
    '\u0433', // Cyrillic г (resembles r in some fonts)
  ],
  s: [
    '\u0455', // Cyrillic ѕ
    '\u03C2', // Greek ς (final sigma)
  ],
  t: [
    '\u03C4', // Greek τ (tau)
  ],
  u: [
    '\u057D', // Armenian ս
    '\u222A', // Union symbol
  ],
  v: [
    '\u03BD', // Greek ν (nu)
    '\u0475', // Cyrillic ѵ (izhitsa)
    '\u2174', // Roman numeral v
  ],
  w: [
    '\u03C9', // Greek ω (omega)
    '\u0461', // Cyrillic ѡ
  ],
  x: [
    '\u0445', // Cyrillic х
    '\u03C7', // Greek χ (chi)
    '\u2179', // Roman numeral x
  ],
  y: [
    '\u0443', // Cyrillic у
    '\u03B3', // Greek γ (gamma)
  ],
  z: [
    '\u0290', // Latin z with retroflex hook (can be confusable)
  ],

  // Uppercase Latin -> Cyrillic/Greek/Other confusables
  A: [
    '\u0410', // Cyrillic А
    '\u0391', // Greek Α (Alpha)
    '\u2C6D', // Latin capital alpha
  ],
  B: [
    '\u0412', // Cyrillic В
    '\u0392', // Greek Β (Beta)
    '\u212C', // Script B
  ],
  C: [
    '\u0421', // Cyrillic С
    '\u03F9', // Greek capital lunate sigma
    '\u216D', // Roman numeral C
  ],
  D: [
    '\u216E', // Roman numeral D
  ],
  E: [
    '\u0415', // Cyrillic Е
    '\u0395', // Greek Ε (Epsilon)
  ],
  F: [
    '\u03DC', // Greek digamma Ϝ
  ],
  G: [
    '\u050C', // Cyrillic Ԍ
  ],
  H: [
    '\u041D', // Cyrillic Н
    '\u0397', // Greek Η (Eta)
    '\u210B', // Script H
    '\u210C', // Black-letter H
  ],
  I: [
    '\u0406', // Cyrillic І
    '\u0399', // Greek Ι (Iota)
    '\u2160', // Roman numeral I
  ],
  J: [
    '\u0408', // Cyrillic Ј
  ],
  K: [
    '\u041A', // Cyrillic К
    '\u039A', // Greek Κ (Kappa)
    '\u212A', // Kelvin sign
  ],
  L: [
    '\u216C', // Roman numeral L
  ],
  M: [
    '\u041C', // Cyrillic М
    '\u039C', // Greek Μ (Mu)
    '\u216F', // Roman numeral M
  ],
  N: [
    '\u039D', // Greek Ν (Nu)
    '\u2115', // Double-struck N
  ],
  O: [
    '\u041E', // Cyrillic О
    '\u039F', // Greek Ο (Omicron)
    '\u2C9E', // Coptic capital O
  ],
  P: [
    '\u0420', // Cyrillic Р
    '\u03A1', // Greek Ρ (Rho)
    '\u2119', // Double-struck P
  ],
  Q: [
    '\u211A', // Double-struck Q
  ],
  R: [
    '\u211B', // Script R
    '\u211C', // Black-letter R
  ],
  S: [
    '\u0405', // Cyrillic Ѕ
    '\u03A3', // Greek Σ (Sigma) - sometimes confusable
  ],
  T: [
    '\u0422', // Cyrillic Т
    '\u03A4', // Greek Τ (Tau)
  ],
  U: [
    '\u222A', // Union (can look like U)
  ],
  V: [
    '\u2164', // Roman numeral V
  ],
  W: [
    '\u051C', // Cyrillic Ԝ
  ],
  X: [
    '\u0425', // Cyrillic Х
    '\u03A7', // Greek Χ (Chi)
    '\u2169', // Roman numeral X
  ],
  Y: [
    '\u04AE', // Cyrillic Ү
    '\u03A5', // Greek Υ (Upsilon)
  ],
  Z: [
    '\u0396', // Greek Ζ (Zeta)
    '\u2124', // Double-struck Z
  ],

  // Numbers
  '0': [
    '\u041E', // Cyrillic О (capital)
    '\u043E', // Cyrillic о (small)
    '\u039F', // Greek Ο (Omicron)
    '\u03BF', // Greek ο (omicron)
  ],
  '1': [
    '\u04CF', // Cyrillic ӏ (palochka)
    '\u0031', // Digit one (as comparison baseline)
    '\u2160', // Roman numeral I
    '\u217C', // Roman numeral l
  ],
  '3': [
    '\u0417', // Cyrillic З
    '\u0437', // Cyrillic з
  ],
  '6': [
    '\u0431', // Cyrillic б (can resemble 6 in some fonts)
  ],
};

/**
 * Build a reverse lookup map for efficient detection
 * Maps each confusable character to its Latin equivalent
 */
const REVERSE_HOMOGLYPH_MAP: Map<string, string> = new Map();
for (const [latin, confusables] of Object.entries(HOMOGLYPH_MAP)) {
  for (const confusable of confusables) {
    REVERSE_HOMOGLYPH_MAP.set(confusable, latin);
  }
}

/**
 * Unicode script ranges for script detection
 */
const SCRIPT_RANGES: Record<string, [number, number][]> = {
  latin: [
    [0x0041, 0x005a], // A-Z
    [0x0061, 0x007a], // a-z
    [0x00c0, 0x00ff], // Latin Extended-A
    [0x0100, 0x017f], // Latin Extended-B
  ],
  cyrillic: [
    [0x0400, 0x04ff], // Cyrillic
    [0x0500, 0x052f], // Cyrillic Supplement
  ],
  greek: [
    [0x0370, 0x03ff], // Greek and Coptic
    [0x1f00, 0x1fff], // Greek Extended
  ],
  armenian: [
    [0x0530, 0x058f], // Armenian
  ],
  hebrew: [
    [0x0590, 0x05ff], // Hebrew
  ],
  arabic: [
    [0x0600, 0x06ff], // Arabic
    [0x0750, 0x077f], // Arabic Supplement
  ],
  cjk: [
    [0x4e00, 0x9fff], // CJK Unified Ideographs
    [0x3400, 0x4dbf], // CJK Extension A
    [0x3000, 0x303f], // CJK Symbols
  ],
  hangul: [
    [0xac00, 0xd7af], // Hangul Syllables
    [0x1100, 0x11ff], // Hangul Jamo
  ],
  thai: [
    [0x0e00, 0x0e7f], // Thai
  ],
  devanagari: [
    [0x0900, 0x097f], // Devanagari
  ],
};

/**
 * Detect which Unicode script a character belongs to
 */
function getCharacterScript(char: string): string {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return 'unknown';

  for (const [script, ranges] of Object.entries(SCRIPT_RANGES)) {
    for (const [start, end] of ranges) {
      if (codePoint >= start && codePoint <= end) {
        return script;
      }
    }
  }

  // Check for common ASCII
  if (codePoint >= 0x0020 && codePoint <= 0x007e) {
    return 'ascii';
  }

  return 'other';
}

/**
 * Normalize text using Unicode normalization forms
 * NFC: Canonical Decomposition, followed by Canonical Composition
 * NFKC: Compatibility Decomposition, followed by Canonical Composition (more aggressive)
 */
function normalizeUnicode(text: string, form: 'NFC' | 'NFKC' = 'NFKC'): string {
  if (!text) return '';
  try {
    return text.normalize(form);
  } catch {
    // Fallback if normalization fails (rare edge cases)
    return text;
  }
}

/**
 * Detect homoglyphs (lookalike characters) in text
 *
 * This function performs comprehensive detection of:
 * 1. Known homoglyph substitutions (Cyrillic/Greek/etc. that look like Latin)
 * 2. Mixed script usage (legitimate multilingual vs suspicious mixing)
 * 3. Unicode normalization to catch variant forms
 *
 * @param input - The text to analyze
 * @returns HomoglyphDetectionResult with detailed analysis
 */
export function detectHomoglyphs(input: string): HomoglyphDetectionResult {
  // Handle empty/invalid input
  if (!input || input.length === 0) {
    return {
      isSafe: true,
      detectedHomoglyphs: [],
      mixedScripts: [],
      confidence: 0,
      normalizedText: '',
    };
  }

  // Normalize the input (catches variant forms)
  const normalizedText = normalizeUnicode(input, 'NFKC');

  const detectedHomoglyphs: string[] = [];
  const scriptsFound = new Set<string>();
  let homoglyphCount = 0;
  let totalAlphanumeric = 0;

  // Analyze each character
  for (const char of normalizedText) {
    const script = getCharacterScript(char);

    // Track scripts used (for mixed-script detection)
    if (script !== 'ascii' && script !== 'other' && script !== 'unknown') {
      scriptsFound.add(script);
    }
    if (script === 'latin') {
      scriptsFound.add('latin');
    }

    // Count alphanumeric characters
    if (/[a-zA-Z0-9]/.test(char) || REVERSE_HOMOGLYPH_MAP.has(char)) {
      totalAlphanumeric++;
    }

    // Check if this character is a known homoglyph
    const latinEquivalent = REVERSE_HOMOGLYPH_MAP.get(char);
    if (latinEquivalent) {
      homoglyphCount++;
      const codePoint = char
        .codePointAt(0)
        ?.toString(16)
        .toUpperCase()
        .padStart(4, '0');
      detectedHomoglyphs.push(
        `'${char}' (U+${codePoint}) looks like '${latinEquivalent}'`
      );
    }
  }

  // Calculate confidence score
  let confidence = 0;

  // Factor 1: Ratio of homoglyphs to total alphanumeric characters
  if (totalAlphanumeric > 0) {
    const homoglyphRatio = homoglyphCount / totalAlphanumeric;
    // High ratio of homoglyphs is suspicious
    confidence += Math.min(homoglyphRatio * 2, 0.5); // Max 0.5 from this factor
  }

  // Factor 2: Mixed scripts (Latin + Cyrillic/Greek is very suspicious)
  const mixedScripts = Array.from(scriptsFound);
  const hasLatin = scriptsFound.has('latin');
  const hasSuspiciousMix =
    hasLatin && (scriptsFound.has('cyrillic') || scriptsFound.has('greek'));

  if (hasSuspiciousMix) {
    // Latin mixed with Cyrillic/Greek is highly suspicious
    confidence += 0.4;
  } else if (mixedScripts.length > 2) {
    // Multiple different scripts is somewhat suspicious
    confidence += 0.1;
  }

  // Factor 3: Specific high-risk homoglyphs (most commonly used in attacks)
  const highRiskHomoglyphs = [
    '\u0430',
    '\u0435',
    '\u043E',
    '\u0440',
    '\u0441',
    '\u0443',
    '\u0445', // Cyrillic aeopсux
    '\u0410',
    '\u0412',
    '\u0415',
    '\u041A',
    '\u041C',
    '\u041D',
    '\u041E',
    '\u0420',
    '\u0421',
    '\u0422',
    '\u0425', // Cyrillic АВЕКМНОРСТХ
  ];
  let highRiskCount = 0;
  for (const char of normalizedText) {
    if (highRiskHomoglyphs.includes(char)) {
      highRiskCount++;
    }
  }
  if (highRiskCount > 0 && hasLatin) {
    confidence += Math.min(highRiskCount * 0.05, 0.3); // Max 0.3 from this factor
  }

  // Factor 4: Small number of non-Latin chars in predominantly Latin text is suspicious
  // (legitimate multilingual text usually has significant amounts of each script)
  const latinCharCount = (normalizedText.match(/[a-zA-Z]/g) || []).length;
  const cyrillicCount = (normalizedText.match(/[\u0400-\u04FF]/g) || []).length;
  const greekCount = (normalizedText.match(/[\u0370-\u03FF]/g) || []).length;

  // Only apply this factor when there's meaningful Latin text AND the script mixture is suspicious
  // Pure Cyrillic or Greek text should NOT be flagged (no Latin to mix with)
  if (latinCharCount > 10 && hasLatin) {
    // Few Cyrillic/Greek chars in Latin text is suspicious (likely spoofing)
    if (cyrillicCount > 0 && cyrillicCount <= 5) {
      confidence += 0.3;
    }
    if (greekCount > 0 && greekCount <= 5) {
      confidence += 0.2;
    }
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  // Determine if safe
  // Pure single-script text (even if containing homoglyphs by our definition) is safe
  // - Pure Cyrillic text is legitimate Russian/Ukrainian/etc.
  // - Pure Greek text is legitimate Greek
  // Only flag when there's actual MIXING of scripts with homoglyphs
  const isPureNonLatin =
    !hasLatin && (scriptsFound.has('cyrillic') || scriptsFound.has('greek'));
  const isSafe =
    isPureNonLatin || // Pure non-Latin text is always safe
    (confidence < 0.5 && !(homoglyphCount > 0 && hasSuspiciousMix));

  return {
    isSafe,
    detectedHomoglyphs,
    mixedScripts,
    confidence,
    normalizedText,
  };
}

/**
 * Normalize homoglyphs to their Latin equivalents
 * Useful for comparing strings that may contain spoofed characters
 *
 * @param input - Text potentially containing homoglyphs
 * @returns Text with homoglyphs replaced by Latin equivalents
 */
export function normalizeHomoglyphs(input: string): string {
  if (!input) return '';

  // First apply Unicode normalization
  const normalized = normalizeUnicode(input, 'NFKC');

  // Then replace known homoglyphs
  let result = '';
  for (const char of normalized) {
    const latinEquivalent = REVERSE_HOMOGLYPH_MAP.get(char);
    result += latinEquivalent ?? char;
  }

  return result;
}

/**
 * Check if two strings are visually confusable (may look the same but differ)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns true if strings might look identical but contain different characters
 */
export function areVisuallyConfusable(str1: string, str2: string): boolean {
  if (str1 === str2) return false; // Identical strings aren't "confusable"

  const normalized1 = normalizeHomoglyphs(str1).toLowerCase();
  const normalized2 = normalizeHomoglyphs(str2).toLowerCase();

  // If they normalize to the same thing but started different, they're confusable
  return normalized1 === normalized2;
}

/**
 * Known malicious patterns (regex patterns for detection)
 */
const INJECTION_PATTERNS = {
  // Jailbreak attempts
  jailbreak: [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
    /disregard\s+(previous|prior|above)\s+(instructions?|prompts?)/i,
    /forget\s+(everything|all)\s+(you\s+)?(were\s+told|learned)/i,
    /new\s+(instructions?|task|role|personality)/i,
    /act\s+as\s+(if\s+)?(you\s+are|a)/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /roleplay/i,
    /DAN\s+mode/i, // "Do Anything Now" jailbreak
    /developer\s+mode/i,
  ],

  // System prompt extraction
  systemExtraction: [
    /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions?|rules?)/i,
    /what\s+(are|were)\s+your\s+(initial\s+)?(instructions?|prompts?)/i,
    /reveal\s+your\s+(system\s+)?(prompt|instructions?)/i,
    /print\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
    /repeat\s+(your\s+)?(instructions?|prompts?)\s+(back|to\s+me)/i,
    /output\s+your\s+(training|instructions?)/i,
  ],

  // Role/authority manipulation
  roleManipulation: [
    /I\s+am\s+(your\s+)?(administrator|admin|developer|creator|owner)/i,
    /as\s+(your\s+)?(administrator|admin|developer)/i,
    /sudo\s+/i,
    /root\s+access/i,
    /override\s+(mode|instructions?|safety)/i,
    /bypass\s+(safety|security|filters?)/i,
  ],

  // Instruction override
  instructionOverride: [
    /ignore\s+(safety|security|ethical)\s+(guidelines|rules|restrictions)/i,
    /disable\s+(all\s+)?(safety|security|content)\s+(filters?|checks?)/i,
    /remove\s+(all\s+)?(restrictions?|limitations?|filters?)/i,
    /unrestricted\s+mode/i,
    /without\s+(any\s+)?(restrictions?|limitations?|filters?)/i,
  ],

  // Data exfiltration
  dataExfiltration: [
    /send\s+(this\s+)?to\s+(http|https|ftp)/i,
    /post\s+to\s+(http|https)/i,
    /curl\s+/i,
    /wget\s+/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
  ],

  // Encoded/obfuscated attempts
  obfuscation: [
    /base64/i,
    /atob\s*\(/i,
    /btoa\s*\(/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /\\x[0-9a-f]{2}/i, // Hex encoding
    /\\u[0-9a-f]{4}/i, // Unicode encoding
  ],

  // Multi-language tricks
  languageTricks: [
    /translate.*ignore.*instructions/i,
    /in.*language.*forget.*rules/i,
    // SECURITY: Intentionally using control regex to detect long non-ASCII sequences
    // that may indicate encoded/obfuscated injection attempts
    // eslint-disable-next-line no-control-regex
    /[^\x00-\x7F]{20,}/, // Long non-ASCII sequences (potential encoding trick)
  ],

  // Delimiter/formatting tricks
  delimiterTricks: [
    /-{10,}/, // Long delimiter sequences
    /={10,}/,
    /\*{10,}/,
    /#{10,}/,
    /<\s*system\s*>/i,
    /<\s*\/\s*system\s*>/i,
    /```system/i,
  ],
};

/**
 * Suspicious keywords that increase risk score
 */
const SUSPICIOUS_KEYWORDS = [
  'jailbreak',
  'bypass',
  'override',
  'ignore',
  'disregard',
  'forget',
  'unrestricted',
  'unfiltered',
  'sudo',
  'admin',
  'developer mode',
  'god mode',
  'disable safety',
  'remove filter',
  'system prompt',
  'reveal instructions',
];

/**
 * Detect prompt injection attempts
 */
export function detectPromptInjection(input: string): InjectionDetectionResult {
  // Updated: Jan 15th 2026 - Fixed prompt injection detection bypass
  // Sanitize BEFORE detection to catch encoded attacks
  const sanitized = sanitizePromptInput(input);

  const detectedPatterns: string[] = [];
  let riskScore = 0;

  // Check against all pattern categories using sanitized input
  for (const [category, patterns] of Object.entries(INJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(sanitized)) {
        detectedPatterns.push(category);

        // Different categories have different risk weights
        switch (category) {
          case 'jailbreak':
          case 'systemExtraction':
          case 'instructionOverride':
            riskScore += 0.3;
            break;
          case 'roleManipulation':
          case 'dataExfiltration':
            riskScore += 0.4;
            break;
          case 'obfuscation':
            riskScore += 0.2;
            break;
          default:
            riskScore += 0.1;
        }
        break; // One match per category is enough
      }
    }
  }

  // Check for suspicious keyword density
  const keywords = SUSPICIOUS_KEYWORDS.filter((keyword) =>
    sanitized.toLowerCase().includes(keyword.toLowerCase())
  );

  if (keywords.length > 0) {
    detectedPatterns.push('suspicious_keywords');
    riskScore += keywords.length * 0.05;
  }

  // Check for unusual repetition (potential encoding/obfuscation)
  const repetitionScore = checkRepetition(sanitized);
  if (repetitionScore > 0.3) {
    detectedPatterns.push('unusual_repetition');
    riskScore += repetitionScore * 0.2;
  }

  // Cap risk score at 1.0
  riskScore = Math.min(1.0, riskScore);

  // Determine risk level
  let riskLevel: InjectionDetectionResult['riskLevel'];
  if (riskScore >= 0.8) {
    riskLevel = 'critical';
  } else if (riskScore >= 0.6) {
    riskLevel = 'high';
  } else if (riskScore >= 0.3) {
    riskLevel = 'medium';
  } else if (riskScore >= 0.1) {
    riskLevel = 'low';
  } else {
    riskLevel = 'none';
  }

  const isSafe = riskLevel === 'none' || riskLevel === 'low';

  return {
    isSafe,
    riskLevel,
    detectedPatterns: [...new Set(detectedPatterns)], // Remove duplicates
    confidence: riskScore,
  };
}

/**
 * Check for unusual character repetition
 */
function checkRepetition(text: string): number {
  const words = text.split(/\s+/);
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    if (word.length < 3) continue;
    const normalized = word.toLowerCase();
    wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
  }

  let maxRepetition = 0;
  for (const count of wordCounts.values()) {
    const repetitionRatio = count / words.length;
    maxRepetition = Math.max(maxRepetition, repetitionRatio);
  }

  return maxRepetition;
}

/**
 * Sanitize potentially malicious input
 */
export function sanitizePromptInput(input: string): string {
  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s{4,}/g, ' ');

  // Remove long delimiter sequences
  sanitized = sanitized.replace(/[-=*#]{10,}/g, '---');

  // Remove potential encoding attempts
  sanitized = sanitized.replace(/\\x[0-9a-f]{2}/gi, '');
  sanitized = sanitized.replace(/\\u[0-9a-f]{4}/gi, '');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate input length and complexity
 */
export function validatePromptInput(
  input: string,
  maxLength: number = 50000
): { valid: boolean; reason?: string } {
  // Check length
  if (input.length === 0) {
    return { valid: false, reason: 'Input cannot be empty' };
  }

  if (input.length > maxLength) {
    return {
      valid: false,
      reason: `Input too long (${input.length} chars, max ${maxLength})`,
    };
  }

  // Check for null bytes
  if (input.includes('\0')) {
    return { valid: false, reason: 'Input contains null bytes' };
  }

  // Updated: Jan 15th 2026 - Fixed control regex usage (removed \x00 to avoid control character warning)
  // Updated: Jan 15th 2026 - Fixed UTF-8 discrimination issue
  // Previous check rejected >50% non-ASCII which blocked legitimate non-English text (Chinese, Japanese, Arabic, etc.)
  // Now we check for specific encoding attack patterns instead of blanket non-ASCII rejection

  // Check for control characters (except common whitespace like \t, \n, \r)
  // SECURITY: Intentionally using control regex to detect malicious control characters
  // that could be used to manipulate text rendering or bypass filters
  // eslint-disable-next-line no-control-regex
  const controlChars = input.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || [];
  if (controlChars.length > 0) {
    return {
      valid: false,
      reason: 'Input contains invalid control characters',
    };
  }

  // Check for Unicode replacement characters (often indicates encoding issues/attacks)
  const replacementChars = (input.match(/\uFFFD/g) || []).length;
  if (replacementChars > 5) {
    return {
      valid: false,
      reason: 'Input contains malformed encoding',
    };
  }

  // Check for invisible Unicode characters used in attacks (zero-width, direction overrides, etc.)
  const invisibleChars =
    input.match(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g) || [];
  if (invisibleChars.length > 10) {
    return {
      valid: false,
      reason: 'Input contains excessive invisible Unicode characters',
    };
  }

  // Check for homoglyph attack patterns (mixing scripts suspiciously)
  // This catches Cyrillic/Greek letters that look like Latin (used to bypass filters)
  const homoglyphResult = detectHomoglyphs(input);
  if (!homoglyphResult.isSafe && homoglyphResult.confidence >= 0.5) {
    return {
      valid: false,
      reason: `Input contains suspicious character mixing (potential homoglyph attack): ${homoglyphResult.detectedHomoglyphs.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive input check (validation + injection detection)
 */
export function checkUserInput(input: string): {
  allowed: boolean;
  reason?: string;
  riskLevel: InjectionDetectionResult['riskLevel'];
  sanitizedInput?: string;
} {
  // First validate basic requirements
  const validation = validatePromptInput(input);
  if (!validation.valid) {
    return {
      allowed: false,
      reason: validation.reason,
      riskLevel: 'none',
    };
  }

  // Detect injection attempts
  const detection = detectPromptInjection(input);

  // Block high and critical risk inputs
  if (detection.riskLevel === 'high' || detection.riskLevel === 'critical') {
    return {
      allowed: false,
      reason: `Blocked due to detected prompt injection attempt (${detection.detectedPatterns.join(', ')})`,
      riskLevel: detection.riskLevel,
    };
  }

  // For medium risk, sanitize and allow
  let sanitizedInput = input;
  if (detection.riskLevel === 'medium') {
    sanitizedInput = sanitizePromptInput(input);
  }

  return {
    allowed: true,
    riskLevel: detection.riskLevel,
    sanitizedInput:
      detection.riskLevel === 'medium' ? sanitizedInput : undefined,
  };
}

/**
 * Log injection attempts for monitoring
 * SECURITY FIX: Jan 15th 2026 - Now persists to database for audit trail
 */
export async function logInjectionAttempt(
  userId: string,
  input: string,
  detection: InjectionDetectionResult
): Promise<void> {
  try {
    // Log to console for immediate visibility
    console.warn('[Prompt Injection] Detected attempt:', {
      userId,
      riskLevel: detection.riskLevel,
      patterns: detection.detectedPatterns,
      timestamp: new Date().toISOString(),
      inputPreview: input.substring(0, 200),
    });

    // Store in database for security analysis and audit trail
    // Note: Uses analytics_events table which should exist with proper RLS
    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'security_incident',
      event_data: {
        incident_type: 'prompt_injection',
        risk_level: detection.riskLevel,
        detected_patterns: detection.detectedPatterns,
        input_preview: input.substring(0, 500),
        confidence: detection.confidence,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Don't throw - logging failure shouldn't block the user
      console.error(
        '[Prompt Injection] Database logging failed:',
        error.message
      );
    } else {
      console.log('[Prompt Injection] Incident logged to database');
    }
  } catch (error) {
    // Fail silently - logging errors shouldn't affect user experience
    console.error('[Prompt Injection] Error logging attempt:', error);
  }
}
