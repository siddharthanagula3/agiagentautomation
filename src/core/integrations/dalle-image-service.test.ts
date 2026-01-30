/**
 * DALL-E Image Service Tests
 * Unit tests for OpenAI DALL-E image generation integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DallEImageService,
  dallEImageService,
  type DallEGenerationRequest,
  type ImageGenerationResult,
} from './dalle-image-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('DALL-E Image Service', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DallEImageService.getInstance();
      const instance2 = DallEImageService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export singleton as dallEImageService', () => {
      expect(dallEImageService).toBeInstanceOf(DallEImageService);
    });
  });

  describe('generateImage', () => {
    const mockRequest: DallEGenerationRequest = {
      prompt: 'A beautiful sunset over mountains',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      n: 1,
      model: 'dall-e-3',
    };

    it('should generate image successfully', async () => {
      const mockResponse = {
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: 'https://dalle.openai.com/image123.png',
            revised_prompt: 'A stunning sunset with vibrant colors',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await dallEImageService.generateImage(mockRequest);

      expect(results.length).toBe(1);
      expect(results[0].url).toBe('https://dalle.openai.com/image123.png');
      expect(results[0].prompt).toBe(mockRequest.prompt);
      expect(results[0].revisedPrompt).toBe(
        'A stunning sunset with vibrant colors'
      );
      expect(results[0].size).toBe('1024x1024');
      expect(results[0].quality).toBe('standard');
      expect(results[0].style).toBe('vivid');
      expect(results[0].model).toBe('dall-e-3');
      expect(results[0].createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty prompt', async () => {
      await expect(
        dallEImageService.generateImage({ prompt: '' })
      ).rejects.toThrow('Image generation prompt is required');

      await expect(
        dallEImageService.generateImage({ prompt: '   ' })
      ).rejects.toThrow('Image generation prompt is required');
    });

    it('should throw error when DALL-E 3 with n > 1', async () => {
      await expect(
        dallEImageService.generateImage({
          prompt: 'Test',
          model: 'dall-e-3',
          n: 2,
        })
      ).rejects.toThrow('DALL-E 3 only supports generating 1 image at a time');
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(
        dallEImageService.generateImage({ prompt: 'Test' })
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            error: { message: 'Content policy violation' },
          }),
      });

      await expect(
        dallEImageService.generateImage({ prompt: 'Test' })
      ).rejects.toThrow('Content policy violation');
    });

    it('should handle API error without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(
        dallEImageService.generateImage({ prompt: 'Test' })
      ).rejects.toThrow('API error: 500 Internal Server Error');
    });

    it('should use default values when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            created: Date.now() / 1000,
            data: [{ url: 'https://example.com/image.png' }],
          }),
      });

      await dallEImageService.generateImage({ prompt: 'Simple test' });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.size).toBe('1024x1024');
      expect(requestBody.quality).toBe('standard');
      expect(requestBody.style).toBe('vivid');
      expect(requestBody.n).toBe(1);
      expect(requestBody.model).toBe('dall-e-3');
    });

    it('should not include style for DALL-E 2', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            created: Date.now() / 1000,
            data: [{ url: 'https://example.com/image.png' }],
          }),
      });

      await dallEImageService.generateImage({
        prompt: 'Test',
        model: 'dall-e-2',
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.style).toBeUndefined();
    });

    it('should trim prompt before sending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            created: Date.now() / 1000,
            data: [{ url: 'https://example.com/image.png' }],
          }),
      });

      await dallEImageService.generateImage({ prompt: '  Test prompt  ' });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.prompt).toBe('Test prompt');
    });

    it('should send correct request format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            created: Date.now() / 1000,
            data: [{ url: 'https://example.com/image.png' }],
          }),
      });

      await dallEImageService.generateImage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/media-proxies/openai-image-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );
    });

    it('should generate unique IDs for each image', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            created: timestamp,
            data: [
              { url: 'https://example.com/image1.png' },
              { url: 'https://example.com/image2.png' },
            ],
          }),
      });

      // Use DALL-E 2 which supports multiple images
      const results = await dallEImageService.generateImage({
        prompt: 'Test',
        model: 'dall-e-2',
        n: 2,
      });

      expect(results[0].id).toBe(`${timestamp}-0`);
      expect(results[1].id).toBe(`${timestamp}-1`);
    });
  });

  describe('estimateCost', () => {
    describe('DALL-E 3 pricing', () => {
      it('should calculate standard 1024x1024 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'standard',
          size: '1024x1024',
        });

        expect(cost).toBe(0.04);
      });

      it('should calculate standard 1024x1792 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'standard',
          size: '1024x1792',
        });

        expect(cost).toBe(0.08);
      });

      it('should calculate standard 1792x1024 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'standard',
          size: '1792x1024',
        });

        expect(cost).toBe(0.08);
      });

      it('should calculate HD 1024x1024 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'hd',
          size: '1024x1024',
        });

        expect(cost).toBe(0.08);
      });

      it('should calculate HD 1024x1792 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'hd',
          size: '1024x1792',
        });

        expect(cost).toBe(0.12);
      });

      it('should calculate HD 1792x1024 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-3',
          quality: 'hd',
          size: '1792x1024',
        });

        expect(cost).toBe(0.12);
      });
    });

    describe('DALL-E 2 pricing', () => {
      it('should calculate 1024x1024 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-2',
          size: '1024x1024',
        });

        expect(cost).toBe(0.02);
      });

      it('should calculate 512x512 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-2',
          size: '512x512' as '1024x1024',
        });

        expect(cost).toBe(0.018);
      });

      it('should calculate 256x256 cost', () => {
        const cost = dallEImageService.estimateCost({
          prompt: 'Test',
          model: 'dall-e-2',
          size: '256x256' as '1024x1024',
        });

        expect(cost).toBe(0.016);
      });
    });

    it('should use default values', () => {
      const cost = dallEImageService.estimateCost({ prompt: 'Test' });

      // Default: dall-e-3, standard, 1024x1024
      expect(cost).toBe(0.04);
    });

    it('should return fallback cost for unknown size', () => {
      const cost = dallEImageService.estimateCost({
        prompt: 'Test',
        model: 'dall-e-3',
        size: 'unknown' as '1024x1024',
      });

      expect(cost).toBe(0.04);
    });
  });
});
