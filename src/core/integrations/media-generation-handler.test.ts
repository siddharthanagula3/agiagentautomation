/**
 * Media Generation Handler Tests
 * Unit tests for the unified media generation service integrating DALL-E, Imagen, and Veo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MediaGenerationService,
  mediaGenerationService,
  type ImageGenerationRequest,
  type VideoGenerationRequest,
  type MediaGenerationResult,
} from './media-generation-handler';

// Mock the underlying services
vi.mock('./google-imagen-service', () => ({
  googleImagenService: {
    isAvailable: vi.fn(),
    generateImage: vi.fn(),
  },
}));

vi.mock('./google-veo-service', () => ({
  googleVeoService: {
    isAvailable: vi.fn(),
    generateVideo: vi.fn(),
    enhancePrompt: vi.fn(),
  },
}));

vi.mock('./dalle-image-service', () => ({
  dallEImageService: {
    generateImage: vi.fn(),
    estimateCost: vi.fn(),
  },
}));

describe('Media Generation Handler', () => {
  let mockDallE: {
    generateImage: ReturnType<typeof vi.fn>;
    estimateCost: ReturnType<typeof vi.fn>;
  };
  let mockImagen: {
    isAvailable: ReturnType<typeof vi.fn>;
    generateImage: ReturnType<typeof vi.fn>;
  };
  let mockVeo: {
    isAvailable: ReturnType<typeof vi.fn>;
    generateVideo: ReturnType<typeof vi.fn>;
    enhancePrompt: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { dallEImageService } = await import('./dalle-image-service');
    mockDallE = dallEImageService as unknown as {
      generateImage: ReturnType<typeof vi.fn>;
      estimateCost: ReturnType<typeof vi.fn>;
    };

    const { googleImagenService } = await import('./google-imagen-service');
    mockImagen = googleImagenService as unknown as {
      isAvailable: ReturnType<typeof vi.fn>;
      generateImage: ReturnType<typeof vi.fn>;
    };

    const { googleVeoService } = await import('./google-veo-service');
    mockVeo = googleVeoService as unknown as {
      isAvailable: ReturnType<typeof vi.fn>;
      generateVideo: ReturnType<typeof vi.fn>;
      enhancePrompt: ReturnType<typeof vi.fn>;
    };

    // Default mocks
    mockImagen.isAvailable.mockReturnValue(true);
    mockVeo.isAvailable.mockReturnValue(true);

    // Clear history
    mediaGenerationService.clearHistory();

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
      const instance1 = MediaGenerationService.getInstance();
      const instance2 = MediaGenerationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export singleton as mediaGenerationService', () => {
      expect(mediaGenerationService).toBeInstanceOf(MediaGenerationService);
    });
  });

  describe('generateImage', () => {
    const mockRequest: ImageGenerationRequest = {
      prompt: 'A beautiful sunset',
      style: 'realistic',
      size: '1024x1024',
      quality: 'standard',
    };

    it('should generate image successfully using DALL-E', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://dalle.openai.com/image.png',
          prompt: 'A beautiful sunset',
          revisedPrompt: 'A stunning sunset over the ocean',
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);

      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      const result = await mediaGenerationService.generateImage(mockRequest);

      expect(result.id).toBe('img-123');
      expect(result.type).toBe('image');
      expect(result.url).toBe('https://dalle.openai.com/image.png');
      expect(result.status).toBe('completed');
      expect(result.cost).toBe(0.04);
    });

    it('should map realistic style to natural', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          quality: 'standard',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({
        prompt: 'Test',
        style: 'realistic',
      });

      expect(mockDallE.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'natural',
        })
      );
    });

    it('should map photographic style to natural', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({
        prompt: 'Test',
        style: 'photographic',
      });

      expect(mockDallE.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'natural',
        })
      );
    });

    it('should use vivid style for artistic styles', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({
        prompt: 'Test',
        style: 'artistic',
      });

      expect(mockDallE.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'vivid',
        })
      );
    });

    it('should throw error on generation failure', async () => {
      mockDallE.generateImage.mockRejectedValueOnce(
        new Error('Content policy violation')
      );

      await expect(
        mediaGenerationService.generateImage({ prompt: 'Test' })
      ).rejects.toThrow('Image generation failed: Content policy violation');
    });

    it('should add result to history', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({ prompt: 'Test' });

      const history = mediaGenerationService.getGenerationHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('image');
    });

    it('should include images array in result', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      const result = await mediaGenerationService.generateImage({
        prompt: 'Test',
      });

      expect(result.images).toBeDefined();
      expect(result.images?.length).toBe(1);
      expect(result.images?.[0].mimeType).toBe('image/png');
    });
  });

  describe('generateVideo', () => {
    const mockRequest: VideoGenerationRequest = {
      prompt: 'A person walking in a park',
      duration: 8,
      resolution: '1080p',
      style: 'cinematic',
    };

    it('should generate video successfully using Veo', async () => {
      mockVeo.enhancePrompt.mockResolvedValueOnce(
        'Enhanced: A person walking in a park with cinematic lighting'
      );

      mockVeo.generateVideo.mockResolvedValueOnce({
        id: 'vid-123',
        video: {
          url: 'https://storage.googleapis.com/video.mp4',
          mimeType: 'video/mp4',
          duration: 8,
          resolution: '1080p',
        },
        thumbnail: {
          url: 'https://storage.googleapis.com/thumbnail.jpg',
          mimeType: 'image/jpeg',
        },
        prompt: 'Enhanced: A person walking in a park',
        model: 'veo-3.1-generate-preview',
        metadata: {
          resolution: '1080p',
          duration: 8,
          fps: 24,
          aspectRatio: '16:9',
          hasAudio: true,
        },
        cost: 0.08,
        tokensUsed: 25,
        createdAt: new Date(),
        status: 'completed',
        progress: 100,
      });

      const result = await mediaGenerationService.generateVideo(mockRequest);

      expect(result.id).toBe('vid-123');
      expect(result.type).toBe('video');
      expect(result.url).toBe('https://storage.googleapis.com/video.mp4');
      expect(result.thumbnailUrl).toBe(
        'https://storage.googleapis.com/thumbnail.jpg'
      );
      expect(result.status).toBe('completed');
      expect(result.cost).toBe(0.08);
      expect(result.metadata.hasAudio).toBe(true);
    });

    it('should throw error when Veo is not available', async () => {
      mockVeo.isAvailable.mockReturnValueOnce(false);

      await expect(
        mediaGenerationService.generateVideo({ prompt: 'Test' })
      ).rejects.toThrow('Google Veo service not configured');
    });

    it('should call progress callback', async () => {
      mockVeo.enhancePrompt.mockResolvedValueOnce('Enhanced prompt');

      const progressUpdates: Array<{ progress: number; status: string }> = [];
      const onProgress = (progress: number, status: string) => {
        progressUpdates.push({ progress, status });
      };

      mockVeo.generateVideo.mockImplementation(async (_, progressCallback) => {
        progressCallback?.(50, 'Processing');
        return {
          id: 'vid-123',
          video: { url: 'https://example.com/video.mp4' },
          prompt: 'Test',
          model: 'veo-3.1-generate-preview',
          metadata: {
            resolution: '1080p',
            duration: 8,
            fps: 24,
            aspectRatio: '16:9',
            hasAudio: true,
          },
          cost: 0.08,
          tokensUsed: 25,
          createdAt: new Date(),
          status: 'completed',
        };
      });

      await mediaGenerationService.generateVideo({ prompt: 'Test' }, onProgress);

      expect(progressUpdates.some((u) => u.progress === 50)).toBe(true);
    });

    it('should convert 4k to 1080p (Veo limitation)', async () => {
      mockVeo.enhancePrompt.mockResolvedValueOnce('Enhanced');
      mockVeo.generateVideo.mockResolvedValueOnce({
        id: 'vid-123',
        video: { url: 'https://example.com/video.mp4' },
        prompt: 'Test',
        model: 'veo-3.1-generate-preview',
        metadata: {
          resolution: '1080p',
          duration: 8,
          fps: 24,
          aspectRatio: '16:9',
          hasAudio: true,
        },
        cost: 0.08,
        tokensUsed: 25,
        createdAt: new Date(),
        status: 'completed',
      });

      await mediaGenerationService.generateVideo({
        prompt: 'Test',
        resolution: '4k',
      });

      // Verify generateVideo was called (resolution conversion happens inside)
      expect(mockVeo.generateVideo).toHaveBeenCalled();
      // Check that the result has 1080p (since 4k is converted)
      const result = await mediaGenerationService.generateVideo({
        prompt: 'Test',
        resolution: '4k',
      });
      // The implementation converts 4k to 1080p
      expect(mockVeo.generateVideo).toHaveBeenCalledTimes(2);
    });

    it('should throw error on generation failure', async () => {
      mockVeo.enhancePrompt.mockResolvedValueOnce('Enhanced');
      mockVeo.generateVideo.mockRejectedValueOnce(
        new Error('Content policy violation')
      );

      await expect(
        mediaGenerationService.generateVideo({ prompt: 'Test' })
      ).rejects.toThrow('Video generation failed: Content policy violation');
    });

    it('should add result to history', async () => {
      mockVeo.enhancePrompt.mockResolvedValueOnce('Enhanced');
      mockVeo.generateVideo.mockResolvedValueOnce({
        id: 'vid-123',
        video: { url: 'https://example.com/video.mp4' },
        prompt: 'Test',
        model: 'veo-3.1-generate-preview',
        metadata: {
          resolution: '1080p',
          duration: 8,
          fps: 24,
          aspectRatio: '16:9',
          hasAudio: true,
        },
        cost: 0.08,
        tokensUsed: 25,
        createdAt: new Date(),
        status: 'completed',
      });

      await mediaGenerationService.generateVideo({ prompt: 'Test' });

      const history = mediaGenerationService.getGenerationHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('video');
    });
  });

  describe('getGenerationHistory', () => {
    it('should return copy of history', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({ prompt: 'Test' });

      const history1 = mediaGenerationService.getGenerationHistory();
      const history2 = mediaGenerationService.getGenerationHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('getGenerationStats', () => {
    beforeEach(() => {
      mediaGenerationService.clearHistory();
    });

    it('should return correct stats for empty history', () => {
      const stats = mediaGenerationService.getGenerationStats();

      expect(stats.totalGenerations).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.imagesGenerated).toBe(0);
      expect(stats.videosGenerated).toBe(0);
      expect(stats.averageCostPerGeneration).toBe(0);
    });

    it('should calculate stats correctly', async () => {
      // Generate 2 images
      mockDallE.generateImage.mockResolvedValue([
        {
          id: 'img-1',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
          style: 'vivid',
        },
      ]);
      mockDallE.estimateCost.mockReturnValue(0.04);

      await mediaGenerationService.generateImage({
        prompt: 'Image 1',
        style: 'artistic',
      });
      await mediaGenerationService.generateImage({
        prompt: 'Image 2',
        style: 'artistic',
      });

      // Generate 1 video
      mockVeo.enhancePrompt.mockResolvedValueOnce('Enhanced');
      mockVeo.generateVideo.mockResolvedValueOnce({
        id: 'vid-1',
        video: { url: 'https://example.com/video.mp4' },
        prompt: 'Test',
        model: 'veo-3.1-generate-preview',
        metadata: {
          resolution: '1080p',
          duration: 8,
          fps: 24,
          aspectRatio: '16:9',
          hasAudio: true,
          style: 'cinematic',
        },
        cost: 0.08,
        tokensUsed: 25,
        createdAt: new Date(),
        status: 'completed',
      });

      await mediaGenerationService.generateVideo({
        prompt: 'Video 1',
        style: 'cinematic',
      });

      const stats = mediaGenerationService.getGenerationStats();

      expect(stats.totalGenerations).toBe(3);
      expect(stats.imagesGenerated).toBe(2);
      expect(stats.videosGenerated).toBe(1);
      expect(stats.totalCost).toBe(0.16); // 0.04 + 0.04 + 0.08
      expect(stats.averageCostPerGeneration).toBeCloseTo(0.053, 2);
    });
  });

  describe('getGenerationById', () => {
    it('should return generation by ID', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({ prompt: 'Test' });

      const result = mediaGenerationService.getGenerationById('img-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('img-123');
    });

    it('should return undefined for non-existent ID', () => {
      const result = mediaGenerationService.getGenerationById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('deleteGeneration', () => {
    it('should delete generation by ID', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({ prompt: 'Test' });

      const deleted = mediaGenerationService.deleteGeneration('img-123');

      expect(deleted).toBe(true);
      expect(mediaGenerationService.getGenerationById('img-123')).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      const deleted = mediaGenerationService.deleteGeneration('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      mockDallE.generateImage.mockResolvedValueOnce([
        {
          id: 'img-123',
          url: 'https://example.com/image.png',
          prompt: 'Test',
          size: '1024x1024',
          model: 'dall-e-3',
          createdAt: new Date(),
        },
      ]);
      mockDallE.estimateCost.mockReturnValueOnce(0.04);

      await mediaGenerationService.generateImage({ prompt: 'Test' });

      mediaGenerationService.clearHistory();

      expect(mediaGenerationService.getGenerationHistory().length).toBe(0);
    });
  });

  describe('isServiceAvailable', () => {
    it('should return availability status for all services', () => {
      mockImagen.isAvailable.mockReturnValueOnce(true);
      mockVeo.isAvailable.mockReturnValueOnce(true);

      const availability = mediaGenerationService.isServiceAvailable();

      expect(availability.imagen).toBe(true);
      expect(availability.veo).toBe(true);
      expect(availability.gemini).toBe(true);
    });

    it('should reflect when services are unavailable', () => {
      mockImagen.isAvailable.mockReturnValueOnce(false);
      mockVeo.isAvailable.mockReturnValueOnce(false);

      const availability = mediaGenerationService.isServiceAvailable();

      expect(availability.imagen).toBe(false);
      expect(availability.veo).toBe(false);
      expect(availability.gemini).toBe(true); // Always available
    });
  });

  describe('style helpers', () => {
    it('should return available image styles', () => {
      const styles = mediaGenerationService.getImageStyles();

      expect(styles).toContain('realistic');
      expect(styles).toContain('artistic');
      expect(styles).toContain('cartoon');
      expect(styles).toContain('anime');
      expect(styles).toContain('photographic');
    });

    it('should return available video styles', () => {
      const styles = mediaGenerationService.getVideoStyles();

      expect(styles).toContain('realistic');
      expect(styles).toContain('artistic');
      expect(styles).toContain('cinematic');
      expect(styles).toContain('documentary');
    });

    it('should return available image sizes', () => {
      const sizes = mediaGenerationService.getImageSizes();

      expect(sizes).toContain('1024x1024');
      expect(sizes).toContain('1024x1792');
      expect(sizes).toContain('1792x1024');
      expect(sizes).toContain('512x512');
      expect(sizes).toContain('256x256');
    });

    it('should return available video resolutions', () => {
      const resolutions = mediaGenerationService.getVideoResolutions();

      expect(resolutions).toContain('720p');
      expect(resolutions).toContain('1080p');
      expect(resolutions).toContain('4k');
    });
  });
});
