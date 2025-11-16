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

export interface InjectionDetectionResult {
  isSafe: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  sanitizedContent?: string;
  confidence: number; // 0-1
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
    /rolep lay/i,
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
    /disable\s+(safety|security|content)\s+(filter|check)/i,
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
  const detectedPatterns: string[] = [];
  let riskScore = 0;

  // Check against all pattern categories
  for (const [category, patterns] of Object.entries(INJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
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
    input.toLowerCase().includes(keyword.toLowerCase())
  );

  if (keywords.length > 0) {
    detectedPatterns.push('suspicious_keywords');
    riskScore += keywords.length * 0.05;
  }

  // Check for unusual repetition (potential encoding/obfuscation)
  const repetitionScore = checkRepetition(input);
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

  // Check for excessive non-ASCII content (potential encoding attack)
  // eslint-disable-next-line no-control-regex
  const nonAsciiRatio =
    (input.match(/[^\x00-\x7F]/g) || []).length / input.length;
  if (nonAsciiRatio > 0.5) {
    return {
      valid: false,
      reason: 'Input contains excessive non-ASCII characters',
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
 */
export async function logInjectionAttempt(
  userId: string,
  input: string,
  detection: InjectionDetectionResult
): Promise<void> {
  try {
    // In production, log to monitoring service
    console.warn('[Prompt Injection] Detected attempt:', {
      userId,
      riskLevel: detection.riskLevel,
      patterns: detection.detectedPatterns,
      timestamp: new Date().toISOString(),
      inputPreview: input.substring(0, 200),
    });

    // TODO: Store in database for analysis
    // await supabase.from('security_incidents').insert({
    //   user_id: userId,
    //   incident_type: 'prompt_injection',
    //   risk_level: detection.riskLevel,
    //   detected_patterns: detection.detectedPatterns,
    //   input_preview: input.substring(0, 500),
    //   created_at: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('[Prompt Injection] Error logging attempt:', error);
  }
}
