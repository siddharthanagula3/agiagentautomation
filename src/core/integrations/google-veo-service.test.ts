/**
 * Google Veo Service Tests
 * Unit tests for Google AI Studio Veo 3.1 video generation integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GoogleVeoService,
  googleVeoService,
  type VeoGenerationRequest,
  type VeoGenerationResponse,
  type VeoServiceError,
} from './google-veo-service';

// Mock Supabase client
vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('Google Veo Service', () => {
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
      const instance1 = GoogleVeoService.getInstance();
      const instance2 = GoogleVeoService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export singleton as googleVeoService', () => {
      expect(googleVeoService).toBeInstanceOf(GoogleVeoService);
    });
  });

  describe('isAvailable', () => {
    it('should always return true (proxy-based)', () => {
      expect(googleVeoService.isAvailable()).toBe(true);
    });
  });

  describe('getApiKeyStatus', () => {
    it('should return configured true and demo mode false by default', () => {
      const status = googleVeoService.getApiKeyStatus();

      expect(status.configured).toBe(true);
      expect(status.demoMode).toBe(false);
    });
  });

  describe('generateVideo', () => {
    const mockRequest: VeoGenerationRequest = {
      prompt: 'A person walking in a park',
      model: 'veo-3.1-generate-preview',
      resolution: '1080p',
      duration: 8,
      aspectRatio: '16:9',
      fps: 24,
    };

    it('should initiate video generation successfully', async () => {
      // Initial generation call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
            operationName: 'operations/video-123',
          }),
      });

      // Polling call - completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            response: {
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        inlineData: {
                          data: 'base64videodata',
                          mimeType: 'video/mp4',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }),
      });

      const progressUpdates: Array<{ progress: number; status: string }> = [];
      const onProgress = (progress: number, status: string) => {
        progressUpdates.push({ progress, status });
      };

      const result = await googleVeoService.generateVideo(
        mockRequest,
        onProgress
      );

      expect(result.id).toBeDefined();
      expect(result.operationName).toBe('operations/video-123');
      expect(result.status).toBe('completed');
      expect(result.video).toBeDefined();
      expect(result.metadata.resolution).toBe('1080p');
      expect(result.metadata.duration).toBe(8);
      expect(result.metadata.hasAudio).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(
        googleVeoService.generateVideo(mockRequest)
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
        googleVeoService.generateVideo(mockRequest)
      ).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'Invalid prompt',
      });
    });

    it('should use default values when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      const result = await googleVeoService.generateVideo({
        prompt: 'Test',
      });

      expect(result.model).toBe('veo-3.1-generate-preview');
      expect(result.metadata.resolution).toBe('1080p');
      expect(result.metadata.duration).toBe(8);
      expect(result.metadata.fps).toBe(24);
      expect(result.metadata.aspectRatio).toBe('16:9');
    });

    it('should call progress callback during generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      const progressUpdates: number[] = [];
      const onProgress = (progress: number) => {
        progressUpdates.push(progress);
      };

      await googleVeoService.generateVideo(mockRequest, onProgress);

      expect(progressUpdates).toContain(10); // Starting
      expect(progressUpdates).toContain(20); // In progress
      expect(progressUpdates).toContain(100); // Completed
    });

    it('should handle video with URL instead of inline data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: {
              url: 'https://storage.googleapis.com/video.mp4',
              mimeType: 'video/mp4',
            },
          }),
      });

      const result = await googleVeoService.generateVideo(mockRequest);

      expect(result.video?.url).toBe('https://storage.googleapis.com/video.mp4');
    });

    it('should handle polling error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        googleVeoService.generateVideo(mockRequest)
      ).rejects.toMatchObject({
        code: 'POLLING_ERROR',
      });
    });

    it('should handle generation error in polling response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            error: {
              message: 'Content policy violation',
            },
          }),
      });

      await expect(
        googleVeoService.generateVideo(mockRequest)
      ).rejects.toMatchObject({
        code: 'GENERATION_ERROR',
        message: 'Content policy violation',
      });
    });

    it('should calculate cost correctly for 720p', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      const result = await googleVeoService.generateVideo({
        prompt: 'Test',
        resolution: '720p',
      });

      expect(result.cost).toBe(0.05);
    });

    it('should calculate cost correctly for 1080p', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      const result = await googleVeoService.generateVideo({
        prompt: 'Test',
        resolution: '1080p',
      });

      expect(result.cost).toBe(0.08);
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
                      text: 'A cinematic shot of a person walking through a sunlit park with gentle camera movement',
                    },
                  ],
                },
              },
            ],
          }),
      });

      const result = await googleVeoService.enhancePrompt('A person in a park');

      expect(result).toContain('cinematic');
    });

    it('should return original prompt when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await googleVeoService.enhancePrompt('Original prompt');

      expect(result).toBe('Original prompt');
    });

    it('should return original prompt on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      });

      const result = await googleVeoService.enhancePrompt('Original prompt');

      expect(result).toBe('Original prompt');
    });

    it('should handle content field in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: 'Enhanced video prompt',
          }),
      });

      const result = await googleVeoService.enhancePrompt('Test');

      expect(result).toBe('Enhanced video prompt');
    });
  });

  describe('validatePrompt', () => {
    it('should return valid for normal prompt', () => {
      const result = googleVeoService.validatePrompt(
        'A beautiful sunset time-lapse'
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty prompt', () => {
      const result = googleVeoService.validatePrompt('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should return invalid for whitespace-only prompt', () => {
      const result = googleVeoService.validatePrompt('   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should return invalid for prompt exceeding max length', () => {
      const longPrompt = 'a'.repeat(2001);
      const result = googleVeoService.validatePrompt(longPrompt);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prompt is too long (max 2000 characters)');
    });
  });

  describe('getAvailableModels', () => {
    it('should return all available models', () => {
      const models = googleVeoService.getAvailableModels();

      expect(models.length).toBe(1);
      expect(models[0].id).toBe('veo-3.1-generate-preview');
      expect(models[0].name).toBe('Veo 3.1');
    });

    it('should include features for each model', () => {
      const models = googleVeoService.getAvailableModels();

      expect(models[0].features).toContain('720p or 1080p resolution');
      expect(models[0].features).toContain('Native audio generation');
      expect(models[0].features).toContain('Text-to-video');
    });
  });

  describe('getSupportedResolutions', () => {
    it('should return supported resolutions', () => {
      const resolutions = googleVeoService.getSupportedResolutions();

      expect(resolutions).toContain('720p');
      expect(resolutions).toContain('1080p');
      expect(resolutions.length).toBe(2);
    });
  });

  describe('getSupportedAspectRatios', () => {
    it('should return supported aspect ratios', () => {
      const ratios = googleVeoService.getSupportedAspectRatios();

      expect(ratios).toContain('16:9');
      expect(ratios).toContain('9:16');
      expect(ratios).toContain('1:1');
      expect(ratios.length).toBe(3);
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
        await googleVeoService.generateVideo({ prompt: 'Test' });
        expect.fail('Should have thrown');
      } catch (error) {
        const veoError = error as VeoServiceError;
        expect(veoError.code).toBeDefined();
        expect(veoError.message).toBeDefined();
      }
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error string');

      try {
        await googleVeoService.generateVideo({ prompt: 'Test' });
        expect.fail('Should have thrown');
      } catch (error) {
        const veoError = error as VeoServiceError;
        expect(veoError.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('request format', () => {
    it('should send correct request format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      await googleVeoService.generateVideo({
        prompt: 'Test video',
        resolution: '1080p',
        duration: 6,
        aspectRatio: '9:16',
        fps: 30,
        seed: 12345,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/media-proxies/google-veo-proxy',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('veo-3.1-generate-preview');
      expect(requestBody.prompt).toBe('Test video');
      expect(requestBody.resolution).toBe('1080p');
      expect(requestBody.duration).toBe(6);
      expect(requestBody.aspectRatio).toBe('9:16');
      expect(requestBody.fps).toBe(30);
      expect(requestBody.seed).toBe(12345);
    });

    it('should include reference images when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'operations/video-123',
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            done: true,
            video: { url: 'https://example.com/video.mp4' },
          }),
      });

      await googleVeoService.generateVideo({
        prompt: 'Test',
        referenceImages: [
          { imageData: 'base64data', mimeType: 'image/png' },
        ],
        firstFrame: { imageData: 'firstFrameData', mimeType: 'image/jpeg' },
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.referenceImages).toBeDefined();
      expect(requestBody.firstFrame).toBeDefined();
    });
  });
});
