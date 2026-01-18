/**
 * HTML Sanitizer Service
 * Uses DOMPurify to sanitize user-generated HTML content
 *
 * CRITICAL SECURITY: Prevents XSS attacks in artifacts and user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitization configuration levels
 *
 * SECURITY NOTE: No sanitization level should EVER allow JavaScript execution.
 * Event handlers (onclick, onchange, onload, onerror, onmouseover, onfocus, onblur, etc.)
 * and javascript: URLs are NEVER permitted in any mode.
 *
 * - 'strict': Basic formatting only, no links or images
 * - 'standard': Balanced security with common HTML elements
 * - 'extended': Rich content with form elements, but NO script execution
 */
export type SanitizeLevel = 'strict' | 'standard' | 'extended';

/**
 * @deprecated Use 'extended' instead. This alias exists for backward compatibility.
 */
export type PermissiveLevel = 'permissive';

/**
 * Default allowed tags for artifacts
 */
const DEFAULT_ALLOWED_TAGS = [
  // Structure
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'br',
  'hr',
  // Lists
  'ul',
  'ol',
  'li',
  // Text formatting
  'strong',
  'em',
  'b',
  'i',
  'u',
  'code',
  'pre',
  'blockquote',
  // Links and media
  'a',
  'img',
  // Tables
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // SVG (for graphics)
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'g',
];

/**
 * Default allowed attributes
 */
const DEFAULT_ALLOWED_ATTRS = [
  'class',
  'id',
  'style',
  'href',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'target',
  'rel',
  // SVG attributes
  'd',
  'viewBox',
  'xmlns',
  'fill',
  'stroke',
  'stroke-width',
  'cx',
  'cy',
  'r',
  'x',
  'y',
  'points',
];

/**
 * Sanitize HTML content with configurable security levels
 */
export function sanitizeHTML(
  html: string,
  level: SanitizeLevel = 'standard'
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let config: DOMPurify.Config;

  switch (level) {
    case 'strict':
      // Strictest: Only basic formatting, no links/images
      config = {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'code',
          'pre',
          'h1',
          'h2',
          'h3',
          'ul',
          'ol',
          'li',
        ],
        ALLOWED_ATTR: ['class'],
        ALLOW_DATA_ATTR: false,
      };
      break;

    case 'extended':
    case 'permissive': // @deprecated: use 'extended' instead
      // Extended: Allows rich content with form elements for interactive UIs
      // SECURITY: Event handlers (on*) are NEVER allowed to prevent XSS attacks.
      // JavaScript execution through HTML attributes is a critical vulnerability.
      config = {
        ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: DEFAULT_ALLOWED_ATTRS,
        ALLOW_DATA_ATTR: true,
        ADD_TAGS: ['button', 'input', 'label', 'select', 'option', 'textarea'],
        ADD_ATTR: [
          // Safe form attributes only - NO event handlers (onclick, onchange, etc.)
          'value',
          'placeholder',
          'type',
          'name',
          'disabled',
          'readonly',
          'required',
          'min',
          'max',
          'step',
          'pattern',
          'autocomplete',
          'for', // label association
          'aria-label',
          'aria-describedby',
          'role',
        ],
        // Explicitly forbid dangerous attributes
        FORBID_ATTR: [
          // Event handlers - NEVER allow these
          'onclick',
          'ondblclick',
          'onchange',
          'oninput',
          'onsubmit',
          'onreset',
          'onload',
          'onerror',
          'onmouseover',
          'onmouseout',
          'onmousedown',
          'onmouseup',
          'onmousemove',
          'onkeydown',
          'onkeyup',
          'onkeypress',
          'onfocus',
          'onblur',
          'onscroll',
          'onresize',
          'ondrag',
          'ondrop',
          'oncopy',
          'onpaste',
          'oncut',
          'oncontextmenu',
          'ontouchstart',
          'ontouchmove',
          'ontouchend',
          'onanimationstart',
          'onanimationend',
          'ontransitionend',
        ],
      };
      break;

    case 'standard':
    default:
      // Standard: Good balance of security and functionality
      config = {
        ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: DEFAULT_ALLOWED_ATTRS,
        ALLOW_DATA_ATTR: false,
      };
      break;
  }

  // Add universal protections applied to ALL sanitization levels
  const sanitized = DOMPurify.sanitize(html, {
    ...config,
    // Force target="_blank" and rel="noopener noreferrer" on links
    SANITIZE_NAMED_PROPS: true,
    // Don't allow DOM clobbering
    SANITIZE_DOM: true,
    // Keep important elements
    KEEP_CONTENT: true,
    // Return as HTML string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    // Don't process entire document
    WHOLE_DOCUMENT: false,
    // CRITICAL: Always forbid script execution elements regardless of level
    // These tags can execute JavaScript and must NEVER be allowed
    FORBID_TAGS: [
      'script',
      'iframe',
      'frame',
      'frameset',
      'object',
      'embed',
      'applet',
      'base',
      'meta',
      'link',
      'style', // Can contain CSS expressions for XSS
      'math', // MathML can execute scripts
      'xmp',
      'plaintext',
      'listing',
      'noscript',
      'template', // Can be used for DOM manipulation attacks
      ...(config.FORBID_TAGS || []),
    ],
  });

  return sanitized;
}

/**
 * Sanitize artifact content based on type
 */
export function sanitizeArtifact(
  content: string,
  type: 'html' | 'react' | 'svg' | 'mermaid' | 'code'
): string {
  switch (type) {
    case 'html':
      // HTML artifacts can have rich content but NO script execution
      return sanitizeHTML(content, 'extended');

    case 'svg':
      // SVG needs special handling
      return sanitizeSVG(content);

    case 'react':
    case 'mermaid':
    case 'code':
      // Code should be displayed as-is but not executed
      // Wrap in <pre><code> for safe display
      return sanitizeHTML(
        `<pre><code>${escapeHTML(content)}</code></pre>`,
        'strict'
      );

    default:
      return sanitizeHTML(content, 'standard');
  }
}

/**
 * Sanitize SVG content specifically
 */
export function sanitizeSVG(svg: string): string {
  // SVG has additional security concerns
  const sanitized = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      'svg',
      'path',
      'circle',
      'rect',
      'line',
      'polyline',
      'polygon',
      'g',
      'text',
      'tspan',
      'ellipse',
      'defs',
      'linearGradient',
      'radialGradient',
      'stop',
    ],
    ALLOWED_ATTR: [
      'd',
      'viewBox',
      'xmlns',
      'fill',
      'stroke',
      'stroke-width',
      'cx',
      'cy',
      'r',
      'x',
      'y',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
      'width',
      'height',
      'transform',
      'class',
      'id',
    ],
    SANITIZE_DOM: true,
    KEEP_CONTENT: false,
  });

  return sanitized;
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Check if content contains potentially dangerous patterns
 */
export function hasXSSRisk(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(content));
}

/**
 * Sanitize and validate user input for chat/prompts
 */
export function sanitizeUserInput(
  input: string,
  maxLength: number = 10000
): string {
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Basic HTML entity encoding for special characters
  // This prevents HTML injection in text inputs
  sanitized = escapeHTML(sanitized);

  return sanitized;
}

/**
 * Strip all HTML tags from content
 */
export function stripHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize URL to prevent javascript: protocol and other attacks
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    // Invalid URL
    return '';
  }
}
