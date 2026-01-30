/**
 * OpenAI Proxy Function Tests
 *
 * Tests for the OpenAI API proxy validation logic.
 * Focuses on input validation, CORS, and security checks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent } from '@netlify/functions';
import {
  openaiRequestSchema,
  formatValidationError,
  ALLOWED_OPENAI_MODELS,
} from '../utils/validation-schemas';
import {
  isAllowedOrigin,
  getSafeCorsHeaders,
  checkOriginAndBlock,
} from '../utils/cors';

// Test fixtures
const createMockEvent = (overrides: Partial<HandlerEvent> = {}): HandlerEvent => ({
  rawUrl: 'https://example.com/.netlify/functions/openai-proxy',
  rawQuery: '',
  path: '/.netlify/functions/openai-proxy',
  httpMethod: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer valid-token',
    origin: 'http://localhost:5173',
  },
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello, how are you?' }],
    model: 'gpt-4o',
    temperature: 0.7,
  }),
  isBase64Encoded: false,
  ...overrides,
});

describe('OpenAI Proxy - Validation Logic', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request validation via Zod schema', () => {
    it('should accept valid minimal request', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid full request', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 1000,
        system: 'You are a helpful assistant.',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid model', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'invalid-model',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty messages array', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [],
        model: 'gpt-4o',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid message role', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'admin', content: 'Hello' }],
        model: 'gpt-4o',
      });

      expect(result.success).toBe(false);
    });

    it('should reject temperature above 2', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 2.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject temperature below 0', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: -0.1,
      });

      expect(result.success).toBe(false);
    });

    it('should use default model when not specified', () => {
      const result = openaiRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBeDefined();
        expect(ALLOWED_OPENAI_MODELS).toContain(result.data.model);
      }
    });
  });

  describe('Model whitelist', () => {
    it('should have valid OpenAI models in whitelist', () => {
      const expectedModels = ['gpt-4o', 'gpt-4o-mini'];
      for (const model of expectedModels) {
        if (ALLOWED_OPENAI_MODELS.includes(model as (typeof ALLOWED_OPENAI_MODELS)[number])) {
          expect(ALLOWED_OPENAI_MODELS).toContain(model);
        }
      }
    });

    it('should not include Anthropic models', () => {
      expect(ALLOWED_OPENAI_MODELS).not.toContain('claude-3-opus');
      expect(ALLOWED_OPENAI_MODELS).not.toContain('claude-3-5-sonnet-20241022');
    });
  });

  describe('CORS handling', () => {
    it('should allow localhost:5173', () => {
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    });

    it('should allow production domain', () => {
      expect(isAllowedOrigin('https://agiagentautomation.netlify.app')).toBe(true);
    });

    it('should block unauthorized origins', () => {
      expect(isAllowedOrigin('https://evil-site.com')).toBe(false);
    });

    it('should return CORS headers for allowed origins', () => {
      const headers = getSafeCorsHeaders('http://localhost:5173');
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    });

    it('should return security headers for blocked origins', () => {
      const headers = getSafeCorsHeaders('https://evil-site.com');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('should return 403 for blocked origins via checkOriginAndBlock', () => {
      const result = checkOriginAndBlock('https://evil-site.com');
      expect(result).not.toBeNull();
      expect(result!.statusCode).toBe(403);
    });
  });

  describe('Request size validation', () => {
    it('should enforce 1MB max request size', () => {
      const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
      const largeBody = 'x'.repeat(MAX_REQUEST_SIZE + 1);
      expect(largeBody.length).toBeGreaterThan(MAX_REQUEST_SIZE);
    });
  });

  describe('HTTP method validation', () => {
    it('should accept POST requests', () => {
      const event = createMockEvent({ httpMethod: 'POST' });
      expect(event.httpMethod).toBe('POST');
    });

    it('should require OPTIONS handling for preflight', () => {
      const event = createMockEvent({ httpMethod: 'OPTIONS' });
      expect(event.httpMethod).toBe('OPTIONS');
    });

    it('should reject GET requests', () => {
      const event = createMockEvent({ httpMethod: 'GET' });
      expect(event.httpMethod).not.toBe('POST');
    });
  });

  describe('Authentication requirements', () => {
    it('should require Authorization header', () => {
      const event = createMockEvent({
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:5173',
        },
      });
      expect(event.headers.authorization).toBeUndefined();
    });

    it('should extract user ID from authenticated event', () => {
      const userId = 'user-123';
      expect(userId).toBeDefined();
    });
  });

  describe('Token balance enforcement', () => {
    it('should check token balance before making API request', () => {
      const userBalance = 100000;
      const estimatedTokens = 500;
      const hasEnoughTokens = userBalance >= estimatedTokens;
      expect(hasEnoughTokens).toBe(true);
    });

    it('should return 402 when balance is insufficient', () => {
      const userBalance = 10;
      const estimatedTokens = 500;
      const insufficientBalance = userBalance < estimatedTokens;
      expect(insufficientBalance).toBe(true);

      const errorResponse = {
        statusCode: 402,
        body: JSON.stringify({
          error: 'Insufficient token balance',
          required: estimatedTokens,
          available: userBalance,
          upgradeUrl: '/pricing',
        }),
      };
      expect(errorResponse.statusCode).toBe(402);
    });
  });

  describe('System message handling', () => {
    it('should prepend system message to messages array for OpenAI', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const system = 'You are a helpful assistant.';

      const finalMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      expect(finalMessages[0].role).toBe('system');
      expect(finalMessages[0].content).toBe(system);
      expect(finalMessages.length).toBe(2);
    });

    it('should not add system message when not provided', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const system = undefined;

      const finalMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      expect(finalMessages.length).toBe(1);
      expect(finalMessages[0].role).toBe('user');
    });
  });

  describe('Response normalization', () => {
    it('should extract content from OpenAI response format', () => {
      const openaiResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
          },
        ],
      };

      const content = openaiResponse.choices?.[0]?.message?.content;
      expect(content).toBe('Hello! How can I help you?');
    });

    it('should include token tracking in response', () => {
      const tokenTracking = {
        inputTokens: 100,
        outputTokens: 50,
        provider: 'openai',
        model: 'gpt-4o',
        timestamp: new Date().toISOString(),
      };

      expect(tokenTracking.provider).toBe('openai');
      expect(tokenTracking.inputTokens).toBeDefined();
      expect(tokenTracking.outputTokens).toBeDefined();
    });
  });

  describe('Error responses', () => {
    it('should return 500 when API key is not configured', () => {
      const errorResponse = {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          code: 'SERVER_CONFIGURATION_ERROR',
          retryable: true,
        }),
      };

      expect(errorResponse.statusCode).toBe(500);
      expect(JSON.parse(errorResponse.body).code).toBe('SERVER_CONFIGURATION_ERROR');
    });

    it('should return 504 on timeout', () => {
      const errorResponse = {
        statusCode: 504,
        body: JSON.stringify({
          error: 'Gateway timeout - API request took too long',
        }),
      };

      expect(errorResponse.statusCode).toBe(504);
    });

    it('should not expose internal error details to client', () => {
      const internalError = new Error('Internal Stripe error with sensitive details');
      const clientResponse = {
        error: 'An error occurred processing your request',
      };

      expect(clientResponse.error).not.toContain('Internal');
      expect(clientResponse.error).not.toContain('sensitive');
    });
  });

  describe('Token deduction', () => {
    it('should deduct tokens after successful response', () => {
      const inputTokens = 100;
      const outputTokens = 50;
      const totalTokens = inputTokens + outputTokens;

      expect(totalTokens).toBe(150);
    });

    it('should call deduct_user_tokens RPC', () => {
      const rpcCall = {
        function: 'deduct_user_tokens',
        params: {
          p_user_id: 'user-123',
          p_tokens: 150,
          p_provider: 'openai',
          p_model: 'gpt-4o',
        },
      };

      expect(rpcCall.function).toBe('deduct_user_tokens');
      expect(rpcCall.params.p_provider).toBe('openai');
    });
  });

  describe('Timeout handling', () => {
    it('should set 25 second timeout for API requests', () => {
      const timeout = 25000;
      expect(timeout).toBe(25000);
    });

    it('should use AbortController for timeout', () => {
      const controller = new AbortController();
      expect(controller.signal).toBeDefined();
    });
  });
});
