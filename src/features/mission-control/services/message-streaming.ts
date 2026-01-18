/**
 * Streaming Service for Real-time AI Responses
 * Implements Server-Sent Events (SSE) for token-by-token streaming
 *
 * SECURITY: All API calls are routed through Netlify proxy functions
 * to keep API keys secure on the server side.
 *
 * SECURITY FEATURES (Updated Jan 2026):
 * - Input sanitization (XSS, injection prevention)
 * - Rate limiting checks before API calls
 * - Token balance verification
 * - Auth validation with proper error handling
 * - Parameter validation for all inputs
 * - Prompt injection detection
 */

import { supabase } from '@shared/lib/supabase-client';
import { SecurityManager } from '@shared/lib/security';
import {
  canUserMakeRequest,
  estimateTokensForRequest,
  deductTokens,
} from '@core/billing/token-enforcement-service';
import {
  checkUserInput,
  logInjectionAttempt,
} from '@core/security/prompt-injection-detector';

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  usage?: TokenUsage;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type StreamCallback = (chunk: StreamChunk) => void;

type ErrorResponse = { error?: string } & Record<string, unknown>;

// ========================================
// SECURITY: Rate Limiting Configuration
// ========================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per user (client-side pre-check)
const clientRateLimiter = SecurityManager.createRateLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS
);

// ========================================
// SECURITY: Validation Constants
// ========================================
const MAX_MESSAGE_LENGTH = 50000; // 50k characters per message
const MAX_MESSAGES_COUNT = 100; // Max conversation history
const VALID_PROVIDERS = [
  'openai',
  'chatgpt',
  'anthropic',
  'claude',
  'google',
  'gemini',
  'perplexity',
];
const VALID_ROLES = ['system', 'user', 'assistant', 'function', 'tool'];

/**
 * SECURITY: API keys are managed by Netlify proxy functions
 * All LLM calls go through secure server-side proxies
 * Direct client-side API calls have been removed
 */

// ========================================
// SECURITY: Authentication Helper
// ========================================

/**
 * Helper function to get the current Supabase session with full validation
 * Required for authenticated API proxy calls
 * SECURITY: Uses getUser() for server-side validation, not just getSession()
 */
async function getAuthenticatedUser(): Promise<{
  token: string;
  userId: string;
} | null> {
  try {
    // Get session for the token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Message Streaming] Session error:', sessionError.message);
      return null;
    }

    if (!session?.access_token) {
      console.warn('[Message Streaming] No active session');
      return null;
    }

    // SECURITY: Validate token with server via getUser()
    // This ensures the token is still valid and not revoked
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        '[Message Streaming] User validation failed:',
        userError?.message
      );
      return null;
    }

    return {
      token: session.access_token,
      userId: user.id,
    };
  } catch (error) {
    console.error('[Message Streaming] Authentication check failed:', error);
    return null;
  }
}

/**
 * Legacy helper for backward compatibility
 * @deprecated Use getAuthenticatedUser() instead
 */
async function getAuthToken(): Promise<string | null> {
  const auth = await getAuthenticatedUser();
  return auth?.token || null;
}

// ========================================
// SECURITY: Input Validation & Sanitization
// ========================================

/**
 * Validate and sanitize message array
 * SECURITY: Prevents XSS, injection attacks, and validates structure
 */
function validateMessages(messages: Array<{ role: string; content: string }>): {
  valid: boolean;
  sanitized: Array<{ role: string; content: string }>;
  error?: string;
} {
  // Check array structure
  if (!Array.isArray(messages)) {
    return { valid: false, sanitized: [], error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return {
      valid: false,
      sanitized: [],
      error: 'Messages array cannot be empty',
    };
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return {
      valid: false,
      sanitized: [],
      error: `Too many messages (max ${MAX_MESSAGES_COUNT})`,
    };
  }

  const sanitized: Array<{ role: string; content: string }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Validate message structure
    if (!msg || typeof msg !== 'object') {
      return {
        valid: false,
        sanitized: [],
        error: `Invalid message at index ${i}`,
      };
    }

    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return {
        valid: false,
        sanitized: [],
        error: `Invalid message structure at index ${i}`,
      };
    }

    // Validate role
    if (!VALID_ROLES.includes(msg.role.toLowerCase())) {
      return {
        valid: false,
        sanitized: [],
        error: `Invalid role "${msg.role}" at index ${i}`,
      };
    }

    // Validate content length
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        sanitized: [],
        error: `Message at index ${i} exceeds max length (${MAX_MESSAGE_LENGTH} chars)`,
      };
    }

    // Sanitize user messages for potential injection/XSS
    // System messages are trusted (from our code), so we only sanitize user content
    if (msg.role === 'user') {
      // Check for prompt injection attacks
      const inputCheck = checkUserInput(msg.content);

      if (!inputCheck.allowed) {
        console.warn(
          '[Message Streaming] Potential injection blocked:',
          inputCheck.reason
        );
        return {
          valid: false,
          sanitized: [],
          error: inputCheck.reason || 'Message blocked by security filter',
        };
      }

      // Use sanitized version if medium risk
      const sanitizedContent = inputCheck.sanitizedInput || msg.content;

      // Additional XSS sanitization - strip any HTML tags from user content
      const cleanContent = SecurityManager.sanitizeText(sanitizedContent);

      sanitized.push({
        role: msg.role,
        content: cleanContent,
      });
    } else {
      // System/assistant messages pass through (trusted)
      sanitized.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  return { valid: true, sanitized };
}

/**
 * Validate provider name
 * SECURITY: Prevent injection via provider parameter
 */
function validateProvider(provider: string): boolean {
  if (typeof provider !== 'string') return false;
  return VALID_PROVIDERS.includes(provider.toLowerCase());
}

/**
 * Validate model name
 * SECURITY: Basic validation to prevent injection via model parameter
 */
function validateModel(model: string): boolean {
  if (typeof model !== 'string') return false;
  // Model names should be alphanumeric with dashes, dots, and underscores only
  const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
  return modelPattern.test(model);
}

// ========================================
// SECURITY: Pre-flight Security Checks
// ========================================

/**
 * Perform all security checks before making an API call
 * SECURITY: Comprehensive pre-flight validation
 */
async function performSecurityChecks(
  messages: Array<{ role: string; content: string }>,
  userId: string
): Promise<{
  allowed: boolean;
  sanitizedMessages: Array<{ role: string; content: string }>;
  error?: string;
  estimatedTokens?: number;
}> {
  // 1. Rate limiting (client-side pre-check)
  if (!clientRateLimiter(userId)) {
    return {
      allowed: false,
      sanitizedMessages: [],
      error:
        'Rate limit exceeded. Please wait a moment before sending more messages.',
    };
  }

  // 2. Validate and sanitize messages
  const validation = validateMessages(messages);
  if (!validation.valid) {
    return {
      allowed: false,
      sanitizedMessages: [],
      error: validation.error,
    };
  }

  // 3. Estimate token usage for billing check
  const totalContentLength = messages.reduce(
    (sum, m) => sum + m.content.length,
    0
  );
  const estimatedTokens = estimateTokensForRequest(totalContentLength);

  // 4. Check token balance
  const tokenCheck = await canUserMakeRequest(userId, estimatedTokens);
  if (!tokenCheck.allowed) {
    return {
      allowed: false,
      sanitizedMessages: [],
      error:
        tokenCheck.reason ||
        'Insufficient tokens. Please add more tokens to continue.',
    };
  }

  return {
    allowed: true,
    sanitizedMessages: validation.sanitized,
    estimatedTokens,
  };
}

/**
 * Stream responses from OpenAI
 * SECURITY: All calls are routed through the Netlify proxy function
 * Security checks: auth, rate limiting, input validation, token balance
 */
export async function streamOpenAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[],
  model: string = 'gpt-4o'
) {
  // SECURITY: Validate model parameter
  if (!validateModel(model)) {
    throw new Error('Invalid model specified');
  }

  // SECURITY: Get authenticated user with full validation
  const auth = await getAuthenticatedUser();
  if (!auth) {
    throw new Error(
      'User not authenticated. Please log in to use AI features.'
    );
  }

  // SECURITY: Perform all pre-flight security checks
  const securityCheck = await performSecurityChecks(messages, auth.userId);
  if (!securityCheck.allowed) {
    throw new Error(
      securityCheck.error || 'Request blocked by security checks'
    );
  }

  // SECURITY: Use Netlify proxy to keep API keys secure
  const proxyUrl = '/.netlify/functions/llm-proxies/openai-proxy';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      model,
      messages: securityCheck.sanitizedMessages, // Use sanitized messages
      tools,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const data: ErrorResponse = await response.json().catch((err) => {
      console.error('[OpenAI Proxy] Failed to parse error response:', err);
      return {} as ErrorResponse;
    });

    // SECURITY: Handle specific error codes
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(
      data?.error || `OpenAI proxy error: ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.content;

  if (content) {
    onChunk({ type: 'content', content });
  }

  // Include usage information if available and deduct tokens
  if (data.usage) {
    const usage = {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    };

    // SECURITY: Deduct actual tokens used from user's balance
    await deductTokens(auth.userId, {
      provider: 'openai',
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      feature: 'mission-control-streaming',
    });

    onChunk({ type: 'done', usage });
  } else {
    onChunk({ type: 'done' });
  }
}

/**
 * Stream responses from Anthropic (Claude)
 * SECURITY: All calls are routed through the Netlify proxy function
 * Security checks: auth, rate limiting, input validation, token balance
 */
export async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[],
  model: string = 'claude-sonnet-4-5-20250929'
) {
  // SECURITY: Validate model parameter
  if (!validateModel(model)) {
    throw new Error('Invalid model specified');
  }

  // SECURITY: Get authenticated user with full validation
  const auth = await getAuthenticatedUser();
  if (!auth) {
    throw new Error(
      'User not authenticated. Please log in to use AI features.'
    );
  }

  // SECURITY: Perform all pre-flight security checks
  const securityCheck = await performSecurityChecks(messages, auth.userId);
  if (!securityCheck.allowed) {
    throw new Error(
      securityCheck.error || 'Request blocked by security checks'
    );
  }

  // Extract system message from sanitized messages
  const systemMessage = securityCheck.sanitizedMessages.find(
    (m) => m.role === 'system'
  );
  const conversationMessages = securityCheck.sanitizedMessages.filter(
    (m) => m.role !== 'system'
  );

  // SECURITY: Use Netlify proxy to keep API keys secure
  const proxyUrl = '/.netlify/functions/llm-proxies/anthropic-proxy';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: conversationMessages,
      tools,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const data: ErrorResponse = await response.json().catch((err) => {
      console.error('[Anthropic Proxy] Failed to parse error response:', err);
      return {} as ErrorResponse;
    });

    // SECURITY: Handle specific error codes
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(
      data?.error || `Anthropic proxy error: ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || data.content || data.output_text;

  if (content) {
    onChunk({ type: 'content', content });
  }

  // Include usage information if available and deduct tokens
  if (data.usage) {
    const usage = {
      promptTokens: data.usage.input_tokens || 0,
      completionTokens: data.usage.output_tokens || 0,
      totalTokens:
        (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
    };

    // SECURITY: Deduct actual tokens used from user's balance
    await deductTokens(auth.userId, {
      provider: 'anthropic',
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      feature: 'mission-control-streaming',
    });

    onChunk({ type: 'done', usage });
  } else {
    onChunk({ type: 'done' });
  }
}

/**
 * Stream responses from Google (Gemini)
 * SECURITY: All calls are routed through the Netlify proxy function
 * Security checks: auth, rate limiting, input validation, token balance
 */
export async function streamGoogle(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  model: string = 'gemini-2.0-flash'
) {
  // SECURITY: Validate model parameter
  if (!validateModel(model)) {
    throw new Error('Invalid model specified');
  }

  // SECURITY: Get authenticated user with full validation
  const auth = await getAuthenticatedUser();
  if (!auth) {
    throw new Error(
      'User not authenticated. Please log in to use AI features.'
    );
  }

  // SECURITY: Perform all pre-flight security checks
  const securityCheck = await performSecurityChecks(messages, auth.userId);
  if (!securityCheck.allowed) {
    throw new Error(
      securityCheck.error || 'Request blocked by security checks'
    );
  }

  // SECURITY: Use Netlify proxy to keep API keys secure
  const proxyUrl = '/.netlify/functions/llm-proxies/google-proxy';

  // Extract system message from sanitized messages
  const systemMessage = securityCheck.sanitizedMessages.find(
    (m) => m.role === 'system'
  );
  const conversationMessages = securityCheck.sanitizedMessages.filter(
    (m) => m.role !== 'system'
  );

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      model,
      messages: conversationMessages,
      system: systemMessage?.content,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const data: ErrorResponse = await response.json().catch((err) => {
      console.error('[Google Proxy] Failed to parse error response:', err);
      return {} as ErrorResponse;
    });

    // SECURITY: Handle specific error codes
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(
      data?.error || `Google proxy error: ${response.statusText}`
    );
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text || data.content;

  if (content) {
    onChunk({ type: 'content', content });
  }

  // Include usage information if available and deduct tokens
  if (data.usage || data.usageMetadata) {
    const usageData = data.usage || data.usageMetadata;
    const usage = {
      promptTokens: usageData.promptTokenCount || usageData.prompt_tokens || 0,
      completionTokens:
        usageData.candidatesTokenCount || usageData.completion_tokens || 0,
      totalTokens: usageData.totalTokenCount || usageData.total_tokens || 0,
    };

    // SECURITY: Deduct actual tokens used from user's balance
    await deductTokens(auth.userId, {
      provider: 'google',
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      feature: 'mission-control-streaming',
    });

    onChunk({ type: 'done', usage });
  } else {
    onChunk({ type: 'done' });
  }
}

/**
 * Stream responses from Perplexity
 * SECURITY: All calls are routed through the Netlify proxy function
 * Security checks: auth, rate limiting, input validation, token balance
 */
export async function streamPerplexity(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  model: string = 'sonar-pro'
) {
  // SECURITY: Validate model parameter
  if (!validateModel(model)) {
    throw new Error('Invalid model specified');
  }

  // SECURITY: Get authenticated user with full validation
  const auth = await getAuthenticatedUser();
  if (!auth) {
    throw new Error(
      'User not authenticated. Please log in to use AI features.'
    );
  }

  // SECURITY: Perform all pre-flight security checks
  const securityCheck = await performSecurityChecks(messages, auth.userId);
  if (!securityCheck.allowed) {
    throw new Error(
      securityCheck.error || 'Request blocked by security checks'
    );
  }

  // SECURITY: Use Netlify proxy to keep API keys secure
  const proxyUrl = '/.netlify/functions/llm-proxies/perplexity-proxy';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      model,
      messages: securityCheck.sanitizedMessages, // Use sanitized messages
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const data: ErrorResponse = await response.json().catch((err) => {
      console.error('[Perplexity Proxy] Failed to parse error response:', err);
      return {} as ErrorResponse;
    });

    // SECURITY: Handle specific error codes
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(
      data?.error || `Perplexity proxy error: ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.content;

  if (content) {
    onChunk({ type: 'content', content });
  }

  // Include usage information if available and deduct tokens
  if (data.usage) {
    const usage = {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    };

    // SECURITY: Deduct actual tokens used from user's balance
    await deductTokens(auth.userId, {
      provider: 'perplexity',
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      feature: 'mission-control-streaming',
    });

    onChunk({ type: 'done', usage });
  } else {
    onChunk({ type: 'done' });
  }
}

/**
 * Main streaming function that routes to appropriate provider
 * SECURITY: Validates provider before routing to prevent injection
 *
 * Security features:
 * - Provider validation
 * - Input sanitization (delegated to provider functions)
 * - Auth validation (delegated to provider functions)
 * - Rate limiting (delegated to provider functions)
 * - Token balance checks (delegated to provider functions)
 */
export async function streamAIResponse(
  provider: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[]
): Promise<void> {
  // SECURITY: Validate provider parameter
  if (!validateProvider(provider)) {
    throw new Error(`Invalid or unsupported provider: ${provider}`);
  }

  // SECURITY: Basic message array validation (detailed validation in provider functions)
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  switch (provider.toLowerCase()) {
    case 'chatgpt':
    case 'openai':
      return streamOpenAI(messages, onChunk, tools);

    case 'claude':
    case 'anthropic':
      return streamAnthropic(messages, onChunk, tools);

    case 'gemini':
    case 'google':
      return streamGoogle(messages, onChunk);

    case 'perplexity':
      return streamPerplexity(messages, onChunk);

    default:
      // This should never be reached due to validateProvider check above
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ========================================
// SECURITY: Export validation utilities for external use
// ========================================

export {
  validateMessages,
  validateProvider,
  validateModel,
  performSecurityChecks,
};
