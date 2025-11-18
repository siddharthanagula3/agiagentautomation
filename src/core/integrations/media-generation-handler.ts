/**
 * Media Generation Service
 * Integrates Google Imagen for image generation and Google Veo 3.1 for video generation
 * with Google AI Studio (Gemini) APIs
 */

import {
  googleImagenService,
  type ImagenGenerationRequest as GoogleImagenRequest,
  type ImagenGenerationResponse,
} from './google-imagen-service';
import {
  googleVeoService,
  type VeoGenerationRequest as GoogleVeoRequest,
  type VeoGenerationResponse,
} from './google-veo-service';

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'anime' | 'photographic';
  size?: '1024x1024' | '1024x1792' | '1792x1024' | '512x512' | '256x256';
  quality?: 'standard' | 'hd';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  negativePrompt?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
  numberOfImages?: number;
  model?:
    | 'imagen-4.0-generate-001'
    | 'imagen-4.0-ultra-generate-001'
    | 'imagen-4.0-fast-generate-001';
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // in seconds
  resolution?: '720p' | '1080p' | '4k';
  style?: 'realistic' | 'artistic' | 'cinematic' | 'documentary';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  fps?: number;
  seed?: number;
  model?: 'veo-3.1-generate-preview';
}

export interface MediaGenerationResult {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  metadata: {
    size?: string;
    duration?: number;
    resolution?: string;
    style?: string;
    seed?: number;
    steps?: number;
    guidance?: number;
    fps?: number;
    aspectRatio?: string;
    model?: string;
    hasAudio?: boolean;
  };
  cost: number;
  tokensUsed: number;
  createdAt: Date;
  status: 'generating' | 'completed' | 'failed' | 'processing';
  progress?: number;
  images?: Array<{ url: string; mimeType: string }>;
}

export interface MediaGenerationStats {
  totalGenerations: number;
  totalCost: number;
  imagesGenerated: number;
  videosGenerated: number;
  averageCostPerGeneration: number;
  mostUsedStyle: string;
  averageGenerationTime: number;
}

/**
 * ⚠️ SECURITY WARNING: API keys in development mode only
 * These keys are ONLY used in development for direct API access.
 * In production, use server-side proxies to keep API keys secure.
 * NEVER expose API keys with VITE_ prefix in production builds.
 */
const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''
  : '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export class MediaGenerationService {
  private static instance: MediaGenerationService;
  private generationHistory: MediaGenerationResult[] = [];
  private isGenerating: boolean = false;

  static getInstance(): MediaGenerationService {
    if (!MediaGenerationService.instance) {
      MediaGenerationService.instance = new MediaGenerationService();
    }
    return MediaGenerationService.instance;
  }

  /**
   * Generate image using Google Imagen API
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<MediaGenerationResult> {
    if (!googleImagenService.isAvailable()) {
      throw new Error(
        'Google Imagen service not configured.\n\n' +
          '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
          '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    try {
      // Map aspect ratio from size if not provided
      let aspectRatio = request.aspectRatio;
      if (!aspectRatio && request.size) {
        const [width, height] = request.size.split('x').map(Number);
        if (width === height) aspectRatio = '1:1';
        else if (width > height) aspectRatio = '16:9';
        else aspectRatio = '9:16';
      }

      // Prepare Imagen request
      const imagenRequest: GoogleImagenRequest = {
        prompt: request.prompt,
        model:
          request.model ||
          (request.quality === 'hd'
            ? 'imagen-4.0-ultra-generate-001'
            : 'imagen-4.0-generate-001'),
        numberOfImages: request.numberOfImages || 1,
        aspectRatio: aspectRatio || '1:1',
        negativePrompt: request.negativePrompt,
        seed: request.seed,
      };

      // Enhance prompt if GOOGLE_API_KEY is available
      if (GOOGLE_API_KEY) {
        imagenRequest.prompt = await googleImagenService.enhancePrompt(
          request.prompt
        );
      }

      // Generate image
      const imagenResponse =
        await googleImagenService.generateImage(imagenRequest);

      // Convert to MediaGenerationResult
      const result: MediaGenerationResult = {
        id: imagenResponse.id,
        type: 'image',
        url: imagenResponse.images[0]?.url || '',
        prompt: imagenResponse.prompt,
        metadata: {
          aspectRatio: imagenResponse.metadata.aspectRatio,
          seed: imagenResponse.metadata.seed,
          model: imagenResponse.model,
        },
        cost: imagenResponse.cost,
        tokensUsed: imagenResponse.tokensUsed,
        createdAt: imagenResponse.createdAt,
        status: imagenResponse.status,
        images: imagenResponse.images,
      };

      this.generationHistory.push(result);
      return result;
    } catch (error) {
      throw new Error(
        `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate video using Google Veo 3.1 API
   */
  async generateVideo(
    request: VideoGenerationRequest,
    onProgress?: (progress: number, status: string) => void
  ): Promise<MediaGenerationResult> {
    if (!googleVeoService.isAvailable()) {
      throw new Error(
        'Google Veo service not configured.\n\n' +
          '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
          '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    try {
      // Prepare Veo request
      const veoRequest: GoogleVeoRequest = {
        prompt: request.prompt,
        model: request.model || 'veo-3.1-generate-preview',
        resolution: request.resolution === '4k' ? '1080p' : request.resolution, // Veo 3.1 doesn't support 4k yet
        duration: request.duration || 8,
        aspectRatio: request.aspectRatio || '16:9',
        fps: request.fps || 24,
        seed: request.seed,
      };

      // Enhance prompt if GOOGLE_API_KEY is available
      if (GOOGLE_API_KEY) {
        veoRequest.prompt = await googleVeoService.enhancePrompt(
          request.prompt
        );
      }

      // Generate video with progress callback
      const veoResponse = await googleVeoService.generateVideo(
        veoRequest,
        onProgress
      );

      // Convert to MediaGenerationResult
      const result: MediaGenerationResult = {
        id: veoResponse.id,
        type: 'video',
        url: veoResponse.video?.url || '',
        thumbnailUrl: veoResponse.thumbnail?.url,
        prompt: veoResponse.prompt,
        metadata: {
          resolution: veoResponse.metadata.resolution,
          duration: veoResponse.metadata.duration,
          fps: veoResponse.metadata.fps,
          aspectRatio: veoResponse.metadata.aspectRatio,
          seed: veoResponse.metadata.seed,
          hasAudio: veoResponse.metadata.hasAudio,
          model: veoResponse.model,
        },
        cost: veoResponse.cost,
        tokensUsed: veoResponse.tokensUsed,
        createdAt: veoResponse.createdAt,
        status: veoResponse.status,
        progress: veoResponse.progress,
      };

      this.generationHistory.push(result);
      return result;
    } catch (error) {
      throw new Error(
        `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get generation history
   */
  getGenerationHistory(): MediaGenerationResult[] {
    return [...this.generationHistory];
  }

  /**
   * Get generation statistics
   */
  getGenerationStats(): MediaGenerationStats {
    const totalGenerations = this.generationHistory.length;
    const totalCost = this.generationHistory.reduce(
      (sum, gen) => sum + gen.cost,
      0
    );
    const imagesGenerated = this.generationHistory.filter(
      (gen) => gen.type === 'image'
    ).length;
    const videosGenerated = this.generationHistory.filter(
      (gen) => gen.type === 'video'
    ).length;

    const styleCounts: Record<string, number> = {};
    this.generationHistory.forEach((gen) => {
      const style = gen.metadata.style || 'unknown';
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });

    const mostUsedStyle = Object.keys(styleCounts).reduce(
      (a, b) => (styleCounts[a] > styleCounts[b] ? a : b),
      'unknown'
    );

    return {
      totalGenerations,
      totalCost,
      imagesGenerated,
      videosGenerated,
      averageCostPerGeneration:
        totalGenerations > 0 ? totalCost / totalGenerations : 0,
      mostUsedStyle,
      averageGenerationTime: 0, // Would be calculated from actual generation times
    };
  }

  /**
   * Get generation by ID
   */
  getGenerationById(id: string): MediaGenerationResult | undefined {
    return this.generationHistory.find((gen) => gen.id === id);
  }

  /**
   * Delete generation
   */
  deleteGeneration(id: string): boolean {
    const index = this.generationHistory.findIndex((gen) => gen.id === id);
    if (index !== -1) {
      this.generationHistory.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear generation history
   */
  clearHistory(): void {
    this.generationHistory = [];
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(): {
    imagen: boolean;
    veo: boolean;
    gemini: boolean;
  } {
    return {
      imagen: googleImagenService.isAvailable(),
      veo: googleVeoService.isAvailable(),
      gemini: !!GOOGLE_API_KEY || IS_DEMO_MODE,
    };
  }

  /**
   * Get available styles for image generation
   */
  getImageStyles(): string[] {
    return ['realistic', 'artistic', 'cartoon', 'anime', 'photographic'];
  }

  /**
   * Get available styles for video generation
   */
  getVideoStyles(): string[] {
    return ['realistic', 'artistic', 'cinematic', 'documentary'];
  }

  /**
   * Get available sizes for image generation
   */
  getImageSizes(): string[] {
    return ['1024x1024', '1024x1792', '1792x1024', '512x512', '256x256'];
  }

  /**
   * Get available resolutions for video generation
   */
  getVideoResolutions(): string[] {
    return ['720p', '1080p', '4k'];
  }
}

// Export singleton instance
export const mediaGenerationService = MediaGenerationService.getInstance();
