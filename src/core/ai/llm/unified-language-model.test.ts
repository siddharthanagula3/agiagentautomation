/**
 * Unified LLM Service Tests
 * Comprehensive unit tests for the unified LLM service that manages all providers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  UnifiedLLMService,
  UnifiedLLMError,
  UnifiedMessage,
  LLMProvider,
} from './unified-language-model';

// Mock all provider dependencies
vi.mock('./providers/anthropic-claude', () => ({
  anthropicProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  AnthropicProvider: {
    getAvailableModels: vi.fn().mockReturnValue([
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-5-20250929',
    ]),
  },
}));

vi.mock('./providers/openai-gpt', () => ({
  openaiProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  OpenAIProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['gpt-4o', 'gpt-5.2', 'o3']),
  },
}));

vi.mock('./providers/google-gemini', () => ({
  googleProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  GoogleProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['gemini-2.0-flash', 'gemini-3-pro-preview']),
  },
}));

vi.mock('./providers/perplexity-ai', () => ({
  perplexityProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  PerplexityProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['sonar', 'sonar-pro']),
  },
}));

vi.mock('./providers/grok-ai', () => ({
  grokProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  GrokProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['grok-4', 'grok-3']),
  },
}));

vi.mock('./providers/deepseek-ai', () => ({
  deepseekProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  DeepSeekProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['deepseek-chat', 'deepseek-reasoner']),
  },
}));

vi.mock('./providers/qwen-ai', () => ({
  qwenProvider: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    updateConfig: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  },
  QwenProvider: {
    getAvailableModels: vi.fn().mockReturnValue(['qwen-plus', 'qwen3-max']),
  },
}));

vi.mock('@core/billing/token-enforcement-service', () => ({
  canUserMakeRequest: vi.fn().mockResolvedValue({ allowed: true }),
  estimateTokensForRequest: vi.fn().mockReturnValue(100),
  deductTokens: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@core/security/prompt-injection-detector', () => ({
  checkUserInput: vi.fn().mockReturnValue({ allowed: true, riskLevel: 'none' }),
  logInjectionAttempt: vi.fn(),
}));

vi.mock('@core/security/api-abuse-prevention', () => ({
  checkApiAbuse: vi.fn().mockResolvedValue({ allowed: true }),
  trackRequestStart: vi.fn(),
  trackRequestEnd: vi.fn(),
  REQUEST_LIMITS: {
    maxTotalConversationLength: 100000,
    maxMessagesInConversation: 100,
  },
}));

vi.mock('@core/security/gradual-rollout', () => ({
  isFeatureEnabled: vi.fn().mockReturnValue(false),
}));

vi.mock('@shared/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Get mocked modules
const { anthropicProvider } = await import('./providers/anthropic-claude');
const { openaiProvider } = await import('./providers/openai-gpt');
const { googleProvider } = await import('./providers/google-gemini');
const { perplexityProvider } = await import('./providers/perplexity-ai');
const { grokProvider } = await import('./providers/grok-ai');
const { deepseekProvider } = await import('./providers/deepseek-ai');
const { qwenProvider } = await import('./providers/qwen-ai');
const { canUserMakeRequest, deductTokens } = await import(
  '@core/billing/token-enforcement-service'
);
const { checkUserInput, logInjectionAttempt } = await import(
  '@core/security/prompt-injection-detector'
);
const { checkApiAbuse, REQUEST_LIMITS } = await import(
  '@core/security/api-abuse-prevention'
);
const { isFeatureEnabled } = await import('@core/security/gradual-rollout');

describe('UnifiedLLMService', () => {
  let service: UnifiedLLMService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UnifiedLLMService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create service with default configuration', () => {
      const config = service.getConfig();

      expect(config.provider).toBe('openai');
      expect(config.model).toBe('gpt-4o');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
    });

    it('should create service with custom configuration', () => {
      const customService = new UnifiedLLMService({
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 8000,
        temperature: 0.5,
      });

      const config = customService.getConfig();

      expect(config.provider).toBe('anthropic');
      expect(config.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.maxTokens).toBe(8000);
    });

    it('should update configuration', () => {
      service.updateConfig({
        provider: 'google',
        model: 'gemini-2.0-flash',
      });

      const config = service.getConfig();

      expect(config.provider).toBe('google');
      expect(config.model).toBe('gemini-2.0-flash');
    });
  });

  describe('Provider Management', () => {
    it('should check if provider is configured', () => {
      expect(service.isProviderConfigured('openai')).toBe(true);
      expect(service.isProviderConfigured('anthropic')).toBe(true);
      expect(service.isProviderConfigured('google')).toBe(true);
    });

    it('should get configured providers', () => {
      const providers = service.getConfiguredProviders();

      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
      expect(providers).toContain('perplexity');
      expect(providers).toContain('grok');
      expect(providers).toContain('deepseek');
      expect(providers).toContain('qwen');
    });

    it('should get available models for provider', () => {
      const openaiModels = service.getAvailableModels('openai');
      expect(openaiModels).toContain('gpt-4o');
      expect(openaiModels).toContain('gpt-5.2');

      const anthropicModels = service.getAvailableModels('anthropic');
      expect(anthropicModels).toContain('claude-opus-4-5-20251101');
    });

    it('should get provider instance', () => {
      const provider = service.getProvider('openai');
      expect(provider).toBe(openaiProvider);
    });

    it('should return undefined for unknown provider', () => {
      const provider = service.getProvider('unknown' as LLMProvider);
      expect(provider).toBeUndefined();
    });

    it('should return all providers via static method', () => {
      const allProviders = UnifiedLLMService.getAllProviders();

      expect(allProviders).toContain('openai');
      expect(allProviders).toContain('anthropic');
      expect(allProviders).toContain('google');
      expect(allProviders).toContain('perplexity');
      expect(allProviders).toContain('grok');
      expect(allProviders).toContain('deepseek');
      expect(allProviders).toContain('qwen');
      expect(allProviders.length).toBe(7);
    });
  });

  describe('sendMessage - Array API', () => {
    const mockMessages: UnifiedMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should send message to default provider (OpenAI)', async () => {
      vi.mocked(openaiProvider.sendMessage).mockResolvedValueOnce({
        content: 'Hello from OpenAI!',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
        model: 'gpt-4o',
      });

      const response = await service.sendMessage(mockMessages);

      expect(openaiProvider.sendMessage).toHaveBeenCalled();
      expect(response.content).toBe('Hello from OpenAI!');
      expect(response.provider).toBe('openai');
    });

    it('should send message to specified provider', async () => {
      vi.mocked(anthropicProvider.sendMessage).mockResolvedValueOnce({
        content: 'Hello from Anthropic!',
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        model: 'claude-sonnet-4-5-20250929',
      });

      const response = await service.sendMessage(
        mockMessages,
        undefined,
        undefined,
        'anthropic'
      );

      expect(anthropicProvider.sendMessage).toHaveBeenCalled();
      expect(response.content).toBe('Hello from Anthropic!');
      expect(response.provider).toBe('anthropic');
    });

    it('should route to correct provider', async () => {
      const providers: Array<{
        name: LLMProvider;
        mock: typeof openaiProvider;
      }> = [
        { name: 'openai', mock: openaiProvider },
        { name: 'anthropic', mock: anthropicProvider },
        { name: 'google', mock: googleProvider },
        { name: 'perplexity', mock: perplexityProvider },
        { name: 'grok', mock: grokProvider },
        { name: 'deepseek', mock: deepseekProvider },
        { name: 'qwen', mock: qwenProvider },
      ];

      for (const { name, mock } of providers) {
        vi.mocked(mock.sendMessage).mockResolvedValueOnce({
          content: `Response from ${name}`,
          model: 'test-model',
        });

        const response = await service.sendMessage(
          mockMessages,
          undefined,
          undefined,
          name
        );

        expect(mock.sendMessage).toHaveBeenCalled();
        expect(response.provider).toBe(name);
        vi.clearAllMocks();
      }
    });
  });

  describe('sendMessage - Object API (backwards compatibility)', () => {
    it('should handle object-style API', async () => {
      vi.mocked(anthropicProvider.sendMessage).mockResolvedValueOnce({
        content: 'Object API response',
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        model: 'claude-sonnet-4-5-20250929',
      });

      const response = await service.sendMessage({
        provider: 'anthropic',
        messages: [{ role: 'user', content: 'Test' }],
        model: 'claude-sonnet-4-5-20250929',
        sessionId: 'session-123',
        userId: 'user-456',
      });

      expect(anthropicProvider.sendMessage).toHaveBeenCalled();
      expect(response.content).toBe('Object API response');
    });

    it('should update config from object API params', async () => {
      vi.mocked(openaiProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        model: 'gpt-5.2',
      });

      await service.sendMessage({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'gpt-5.2',
        temperature: 0.3,
        maxTokens: 2000,
      });

      expect(openaiProvider.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 2000,
          temperature: 0.3,
        })
      );
    });
  });

  describe('Security Layers', () => {
    const mockMessages: UnifiedMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should enforce token balance check', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(canUserMakeRequest)
        .mockResolvedValueOnce({
          allowed: false,
          reason: 'Insufficient tokens',
        })
        .mockResolvedValueOnce({
          allowed: false,
          reason: 'Insufficient tokens',
        });

      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toThrow(UnifiedLLMError);
      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_TOKENS',
      });
    });

    it('should check prompt injection when enabled', async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(checkUserInput)
        .mockReturnValueOnce({
          allowed: false,
          riskLevel: 'critical',
          reason: 'Injection detected',
        })
        .mockReturnValueOnce({
          allowed: false,
          riskLevel: 'critical',
          reason: 'Injection detected',
        });

      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toThrow(UnifiedLLMError);
      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toMatchObject({
        code: 'PROMPT_INJECTION_DETECTED',
      });
    });

    it('should log injection attempts', async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      vi.mocked(checkUserInput).mockReturnValueOnce({
        allowed: false,
        riskLevel: 'high',
        reason: 'Suspicious pattern',
      });

      try {
        await service.sendMessage(
          mockMessages,
          'session-123',
          'user-456',
          'openai'
        );
      } catch {
        // Expected
      }

      expect(logInjectionAttempt).toHaveBeenCalledWith(
        'user-456',
        expect.any(String),
        expect.objectContaining({
          isSafe: false,
          riskLevel: 'high',
        })
      );
    });

    it('should check API abuse when enabled', async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      vi.mocked(checkUserInput).mockReturnValue({ allowed: true });
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(checkApiAbuse)
        .mockResolvedValueOnce({
          allowed: false,
          reason: 'Abuse detected',
        })
        .mockResolvedValueOnce({
          allowed: false,
          reason: 'Abuse detected',
        });

      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toThrow(UnifiedLLMError);
      await expect(
        service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toMatchObject({
        code: 'API_ABUSE_DETECTED',
      });
    });

    it('should reject requests that are too long', async () => {
      const longMessage: UnifiedMessage[] = [
        { role: 'user', content: 'x'.repeat(REQUEST_LIMITS.maxTotalConversationLength + 1) },
      ];

      await expect(
        service.sendMessage(longMessage, 'session-123', 'user-456', 'openai')
      ).rejects.toThrow(UnifiedLLMError);
      await expect(
        service.sendMessage(longMessage, 'session-123', 'user-456', 'openai')
      ).rejects.toMatchObject({
        code: 'REQUEST_TOO_LARGE',
      });
    });

    it('should reject too many messages', async () => {
      const manyMessages: UnifiedMessage[] = Array(
        REQUEST_LIMITS.maxMessagesInConversation + 1
      )
        .fill(null)
        .map((_, i) => ({ role: 'user' as const, content: `Message ${i}` }));

      await expect(
        service.sendMessage(manyMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toThrow(UnifiedLLMError);
      await expect(
        service.sendMessage(manyMessages, 'session-123', 'user-456', 'openai')
      ).rejects.toMatchObject({
        code: 'TOO_MANY_MESSAGES',
      });
    });

    it('should deduct tokens after successful response', async () => {
      vi.mocked(openaiProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        model: 'gpt-4o',
      });

      await service.sendMessage(mockMessages, 'session-123', 'user-456', 'openai');

      expect(deductTokens).toHaveBeenCalledWith(
        'user-456',
        expect.objectContaining({
          provider: 'openai',
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        })
      );
    });
  });

  describe('streamMessage', () => {
    const mockMessages: UnifiedMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should stream message from provider', async () => {
      const mockStream = (async function* () {
        yield { content: 'Hello', done: false };
        yield { content: ' world', done: false };
        yield { content: '', done: true, usage: { prompt_tokens: 5, completion_tokens: 2 } };
      })();

      vi.mocked(openaiProvider.streamMessage).mockReturnValue(mockStream);

      const chunks: Array<{ content: string; done: boolean; provider: string }> = [];
      for await (const chunk of service.streamMessage(mockMessages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(3);
      expect(chunks[0].content).toBe('Hello');
      expect(chunks[0].provider).toBe('openai');
      expect(chunks[2].done).toBe(true);
    });

    it('should stream from specified provider', async () => {
      const mockStream = (async function* () {
        yield { content: 'Anthropic response', done: false };
        yield { content: '', done: true };
      })();

      vi.mocked(anthropicProvider.streamMessage).mockReturnValue(mockStream);

      const chunks = [];
      for await (const chunk of service.streamMessage(
        mockMessages,
        undefined,
        undefined,
        'anthropic'
      )) {
        chunks.push(chunk);
      }

      expect(chunks[0].provider).toBe('anthropic');
    });

    it('should throw error for unknown provider', async () => {
      const stream = service.streamMessage(
        mockMessages,
        undefined,
        undefined,
        'unknown' as LLMProvider
      );

      await expect(stream.next()).rejects.toThrow(UnifiedLLMError);
    });

    it('should handle stream errors', async () => {
      vi.mocked(openaiProvider.streamMessage).mockImplementation(async function* () {
        yield { content: '', done: false }; // Initial yield to satisfy require-yield
        throw new Error('Stream failed');
      });

      const stream = service.streamMessage(mockMessages);

      // First call succeeds with initial yield
      await stream.next();
      // Second call should throw
      await expect(stream.next()).rejects.toThrow(UnifiedLLMError);
    });
  });

  describe('Error Handling', () => {
    const mockMessages: UnifiedMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should throw PROVIDER_NOT_FOUND for invalid provider', async () => {
      const customService = new UnifiedLLMService();
      // @ts-expect-error - Testing invalid provider
      await expect(
        customService.sendMessage(mockMessages, undefined, undefined, 'invalid')
      ).rejects.toThrow(UnifiedLLMError);
    });

    it('should wrap provider errors', async () => {
      // Mock twice because we call sendMessage twice (toThrow + toMatchObject)
      vi.mocked(openaiProvider.sendMessage)
        .mockRejectedValueOnce(new Error('Provider error'))
        .mockRejectedValueOnce(new Error('Provider error'));

      await expect(service.sendMessage(mockMessages)).rejects.toThrow(
        UnifiedLLMError
      );
      await expect(service.sendMessage(mockMessages)).rejects.toMatchObject({
        code: 'PROVIDER_ERROR',
        retryable: true,
      });
    });

    it('should re-throw UnifiedLLMError as-is', async () => {
      const originalError = new UnifiedLLMError(
        'Original error',
        'CUSTOM_CODE',
        'openai',
        false
      );
      vi.mocked(openaiProvider.sendMessage).mockRejectedValueOnce(originalError);

      await expect(service.sendMessage(mockMessages)).rejects.toBe(originalError);
    });
  });

  describe('UnifiedLLMError', () => {
    it('should create error with correct properties', () => {
      const error = new UnifiedLLMError(
        'Test error',
        'INSUFFICIENT_TOKENS',
        'openai',
        false
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INSUFFICIENT_TOKENS');
      expect(error.provider).toBe('openai');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('UnifiedLLMError');
    });

    it('should create retryable error', () => {
      const error = new UnifiedLLMError(
        'Rate limited',
        'PROVIDER_ERROR',
        'anthropic',
        true
      );

      expect(error.retryable).toBe(true);
    });
  });

  describe('Response Normalization', () => {
    const mockMessages: UnifiedMessage[] = [
      { role: 'user', content: 'Hello' },
    ];

    it('should normalize Anthropic usage format', async () => {
      vi.mocked(anthropicProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        model: 'claude-sonnet-4-5-20250929',
      });

      const response = await service.sendMessage(
        mockMessages,
        undefined,
        undefined,
        'anthropic'
      );

      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(20);
      expect(response.usage?.totalTokens).toBe(30);
    });

    it('should normalize OpenAI usage format', async () => {
      vi.mocked(openaiProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
        model: 'gpt-4o',
      });

      const response = await service.sendMessage(
        mockMessages,
        undefined,
        undefined,
        'openai'
      );

      expect(response.usage?.promptTokens).toBe(15);
      expect(response.usage?.completionTokens).toBe(25);
      expect(response.usage?.totalTokens).toBe(40);
    });

    it('should handle response without usage', async () => {
      vi.mocked(openaiProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        model: 'gpt-4o',
      });

      const response = await service.sendMessage(mockMessages);

      expect(response.usage).toBeUndefined();
    });

    it('should include provider in metadata', async () => {
      vi.mocked(googleProvider.sendMessage).mockResolvedValueOnce({
        content: 'Response',
        model: 'gemini-2.0-flash',
        metadata: { custom: 'data' },
      });

      const response = await service.sendMessage(
        mockMessages,
        undefined,
        undefined,
        'google'
      );

      expect(response.metadata?.provider).toBe('google');
      expect(response.metadata?.custom).toBe('data');
    });
  });
});
