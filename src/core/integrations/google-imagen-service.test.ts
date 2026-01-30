/**
 * Google Imagen Service Tests
 * Unit tests for Google AI Studio Imagen API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GoogleImagenService,
  googleImagenService,
  type ImagenGenerationRequest,
  type ImagenGenerationResponse,
  type ImagenServiceError,
} from './google-imagen-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('Google Imagen Service', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockSupabase: { auth: { getSession: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { supabase } = await import('@shared/lib/supabase-client');
    mockSupabase = supabase as unknown as {
      auth: { getSession: ReturnType<typeof vi.fn> };
    };

    // Default auth mock
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });

    // Setup fetch mock
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset demo mode
    vi.stubEnv('VITE_DEMO_MODE', 'false');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GoogleImagenService.getInstance();
      const instance2 = GoogleImagenService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export singleton as googleImagenService', () => {
      expect(googleImagenService).toBeInstanceOf(GoogleImagenService);
    });
  });

  describe('isAvailable', () => {
    it('should always return true (proxy-based)', () => {
      expect(googleImagenService.isAvailable()).toBe(true);
    });
  });

  describe('getApiKeyStatus', () => {
    it('should return configured true and demo mode false by default', () => {
      const status = googleImagenService.getApiKeyStatus();

      expect(status.configured).toBe(true);
      expect(status.demoMode).toBe(false);
    });
  });

  describe('generateImage', () => {
    const mockRequest: ImagenGenerationRequest = {
      prompt: 'A beautiful landscape',
      model: 'imagen-4.0-generate-001',
      numberOfImages: 1,
      aspectRatio: '1:1',
    };

    it('should generate image successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [
              {
                bytesBase64Encoded: 'base64imagedata',
                mimeType: 'image/png',
              },
            ],
          }),
      });

      const result = await googleImagenService.generateImage(mockRequest);

      expect(result.id).toBeDefined();
      expect(result.images.length).toBe(1);
      expect(result.images[0].mimeType).toBe('image/png');
      expect(result.prompt).toBe(mockRequest.prompt);
      expect(result.model).toBe('imagen-4.0-generate-001');
      expect(result.status).toBe('completed');
      expect(result.metadata.aspectRatio).toBe('1:1');
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(
        googleImagenService.generateImage(mockRequest)
      ).rejects.toMatchObject({
        code: 'AUTH_ERROR',
        message: expect.stringContaining('not authenticated'),
      });
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            error: { message: 'Invalid prompt' },
          }),
      });

      await expect(
        googleImagenService.generateImage(mockRequest)
      ).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'Invalid prompt',
      });
    });

    it('should handle API error without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(
        googleImagenService.generateImage(mockRequest)
      ).rejects.toMatchObject({
        code: 'API_ERROR',
        message: expect.stringContaining('Internal Server Error'),
      });
    });

    it('should use default values when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
      });

      expect(result.model).toBe('imagen-4.0-generate-001');
      expect(result.metadata.aspectRatio).toBe('1:1');
      expect(result.metadata.numberOfImages).toBe(1);
    });

    it('should calculate cost correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [
              { bytesBase64Encoded: 'data', mimeType: 'image/png' },
              { bytesBase64Encoded: 'data2', mimeType: 'image/png' },
            ],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
        numberOfImages: 2,
        model: 'imagen-4.0-generate-001',
      });

      expect(result.cost).toBe(0.004); // 0.002 per image * 2
    });

    it('should calculate tokens used from prompt length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'This is a test prompt with exactly forty characters',
      });

      expect(result.tokensUsed).toBe(12); // 49 chars / 4
    });

    it('should send correct request format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      await googleImagenService.generateImage({
        prompt: 'Test',
        model: 'imagen-4.0-ultra-generate-001',
        numberOfImages: 2,
        aspectRatio: '16:9',
        negativePrompt: 'blur, distortion',
        seed: 12345,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/media-proxies/google-imagen-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('imagen-4.0-ultra-generate-001');
      expect(requestBody.numberOfImages).toBe(2);
      expect(requestBody.aspectRatio).toBe('16:9');
      expect(requestBody.negativePrompt).toBe('blur, distortion');
      expect(requestBody.seed).toBe(12345);
    });

    it('should handle images field in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            images: [
              { url: 'https://example.com/image.png', mimeType: 'image/png' },
            ],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
      });

      expect(result.images.length).toBe(1);
      expect(result.images[0].url).toBe('https://example.com/image.png');
    });

    it('should include safety ratings when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
            metadata: {
              safetyRatings: [
                { category: 'HARM_CATEGORY_VIOLENCE', probability: 'LOW' },
              ],
            },
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
      });

      expect(result.metadata.safetyRatings).toBeDefined();
      expect(result.metadata.safetyRatings?.[0].category).toBe(
        'HARM_CATEGORY_VIOLENCE'
      );
    });
  });

  describe('enhancePrompt', () => {
    it('should enhance prompt successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Enhanced: A stunning vista of rolling green hills with dramatic lighting',
                    },
                  ],
                },
              },
            ],
          }),
      });

      const result = await googleImagenService.enhancePrompt('A landscape');

      expect(result).toBe(
        'Enhanced: A stunning vista of rolling green hills with dramatic lighting'
      );
    });

    it('should return original prompt when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await googleImagenService.enhancePrompt('Original prompt');

      expect(result).toBe('Original prompt');
    });

    it('should return original prompt on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      });

      const result = await googleImagenService.enhancePrompt('Original prompt');

      expect(result).toBe('Original prompt');
    });

    it('should handle content field in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Enhanced prompt from content field',
          }),
      });

      const result = await googleImagenService.enhancePrompt('Test');

      expect(result).toBe('Enhanced prompt from content field');
    });

    it('should fallback to original on exception', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await googleImagenService.enhancePrompt('Original');

      expect(result).toBe('Original');
    });
  });

  describe('validatePrompt', () => {
    it('should return valid for normal prompt', () => {
      const result = googleImagenService.validatePrompt(
        'A beautiful sunset over the ocean'
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty prompt', () => {
      const result = googleImagenService.validatePrompt('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should return invalid for whitespace-only prompt', () => {
      const result = googleImagenService.validatePrompt('   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should return invalid for prompt exceeding max length', () => {
      const longPrompt = 'a'.repeat(2001);
      const result = googleImagenService.validatePrompt(longPrompt);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt is too long (max 2000 characters)');
    });

    it('should return valid for prompt at max length', () => {
      const maxPrompt = 'a'.repeat(2000);
      const result = googleImagenService.validatePrompt(maxPrompt);

      expect(result.valid).toBe(true);
    });
  });

  describe('getAvailableModels', () => {
    it('should return all available models', () => {
      const models = googleImagenService.getAvailableModels();

      expect(models.length).toBe(3);
      expect(models.find((m) => m.id === 'imagen-4.0-generate-001')).toBeDefined();
      expect(
        models.find((m) => m.id === 'imagen-4.0-ultra-generate-001')
      ).toBeDefined();
      expect(
        models.find((m) => m.id === 'imagen-4.0-fast-generate-001')
      ).toBeDefined();
    });

    it('should include pricing for each model', () => {
      const models = googleImagenService.getAvailableModels();

      models.forEach((model) => {
        expect(typeof model.pricing).toBe('number');
        expect(model.pricing).toBeGreaterThan(0);
      });
    });

    it('should have correct descriptions', () => {
      const models = googleImagenService.getAvailableModels();

      const standardModel = models.find(
        (m) => m.id === 'imagen-4.0-generate-001'
      );
      expect(standardModel?.name).toBe('Imagen 4.0 Standard');
      expect(standardModel?.description).toContain('text-to-image');
    });
  });

  describe('getSupportedAspectRatios', () => {
    it('should return all supported aspect ratios', () => {
      const ratios = googleImagenService.getSupportedAspectRatios();

      expect(ratios).toContain('1:1');
      expect(ratios).toContain('3:4');
      expect(ratios).toContain('4:3');
      expect(ratios).toContain('9:16');
      expect(ratios).toContain('16:9');
      expect(ratios.length).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should create error with correct structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
        json: () =>
          Promise.resolve({
            error: 'Test error',
          }),
      });

      try {
        await googleImagenService.generateImage({ prompt: 'Test' });
        expect.fail('Should have thrown');
      } catch (error) {
        const imagenError = error as ImagenServiceError;
        expect(imagenError.code).toBeDefined();
        expect(imagenError.message).toBeDefined();
      }
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error string');

      try {
        await googleImagenService.generateImage({ prompt: 'Test' });
        expect.fail('Should have thrown');
      } catch (error) {
        const imagenError = error as ImagenServiceError;
        expect(imagenError.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('pricing', () => {
    it('should have correct pricing for standard model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
        model: 'imagen-4.0-generate-001',
        numberOfImages: 1,
      });

      expect(result.cost).toBe(0.002);
    });

    it('should have correct pricing for ultra model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
        model: 'imagen-4.0-ultra-generate-001',
        numberOfImages: 1,
      });

      expect(result.cost).toBe(0.004);
    });

    it('should have correct pricing for fast model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'data', mimeType: 'image/png' }],
          }),
      });

      const result = await googleImagenService.generateImage({
        prompt: 'Test',
        model: 'imagen-4.0-fast-generate-001',
        numberOfImages: 1,
      });

      expect(result.cost).toBe(0.001);
    });
  });
});
