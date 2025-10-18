/**
 * Media Generation Service
 * Integrates Nano Banana for image generation and Veo3 for video generation
 * with Google AI Studio (Gemini) for enhanced multimodal capabilities
 */

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
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // in seconds
  resolution?: '720p' | '1080p' | '4k';
  style?: 'realistic' | 'artistic' | 'cinematic' | 'documentary';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  fps?: number;
  seed?: number;
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
  };
  cost: number;
  tokensUsed: number;
  createdAt: Date;
  status: 'generating' | 'completed' | 'failed' | 'processing';
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

// Environment variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const NANO_BANANA_API_KEY = import.meta.env.VITE_NANO_BANANA_API_KEY || '';
const VEO3_API_KEY = import.meta.env.VITE_VEO3_API_KEY || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Pricing (per generation)
const PRICING = {
  'nano-banana': {
    '1024x1024': 0.002,
    '1024x1792': 0.003,
    '1792x1024': 0.003,
    '512x512': 0.001,
    '256x256': 0.0005,
  },
  veo3: {
    '720p': 0.05,
    '1080p': 0.08,
    '4k': 0.15,
  },
};

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
   * Generate image using Nano Banana with Gemini enhancement
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<MediaGenerationResult> {
    if (!NANO_BANANA_API_KEY && !IS_DEMO_MODE) {
      throw new Error(
        'Nano Banana API key not configured.\n\n' +
          '✅ Get a FREE key at: https://nanoimg.com/\n' +
          '📝 Add to .env file: VITE_NANO_BANANA_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    const generationId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial result
    const result: MediaGenerationResult = {
      id: generationId,
      type: 'image',
      url: '',
      prompt: request.prompt,
      metadata: {
        size: request.size || '1024x1024',
        style: request.style || 'realistic',
        seed: request.seed,
        steps: request.steps || 20,
        guidance: request.guidance || 7.5,
      },
      cost: 0,
      tokensUsed: 0,
      createdAt: new Date(),
      status: 'generating',
    };

    this.generationHistory.push(result);

    try {
      // Enhance prompt with Gemini if available
      let enhancedPrompt = request.prompt;
      if (GOOGLE_API_KEY) {
        enhancedPrompt = await this.enhancePromptWithGemini(
          request.prompt,
          'image'
        );
      }

      if (IS_DEMO_MODE) {
        // Demo mode - return mock result
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result.url =
          'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Demo+Image';
        result.status = 'completed';
        result.cost =
          PRICING['nano-banana'][request.size || '1024x1024'] || 0.002;
        result.tokensUsed = Math.floor(enhancedPrompt.length / 4);
      } else {
        // Real Nano Banana API call
        const nanoBananaResult = await this.callNanoBananaAPI({
          ...request,
          prompt: enhancedPrompt,
        });

        result.url = nanoBananaResult.url;
        result.thumbnailUrl = nanoBananaResult.thumbnailUrl;
        result.status = 'completed';
        result.cost =
          PRICING['nano-banana'][request.size || '1024x1024'] || 0.002;
        result.tokensUsed = Math.floor(enhancedPrompt.length / 4);
      }

      return result;
    } catch (error) {
      result.status = 'failed';
      throw new Error(
        `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate video using Veo3 with Gemini enhancement
   */
  async generateVideo(
    request: VideoGenerationRequest
  ): Promise<MediaGenerationResult> {
    if (!VEO3_API_KEY && !IS_DEMO_MODE) {
      throw new Error(
        'Veo3 API key not configured.\n\n' +
          '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
          '📝 Add to .env file: VITE_VEO3_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    const generationId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial result
    const result: MediaGenerationResult = {
      id: generationId,
      type: 'video',
      url: '',
      prompt: request.prompt,
      metadata: {
        duration: request.duration || 5,
        resolution: request.resolution || '1080p',
        style: request.style || 'realistic',
        fps: request.fps || 24,
        seed: request.seed,
      },
      cost: 0,
      tokensUsed: 0,
      createdAt: new Date(),
      status: 'generating',
    };

    this.generationHistory.push(result);

    try {
      // Enhance prompt with Gemini if available
      let enhancedPrompt = request.prompt;
      if (GOOGLE_API_KEY) {
        enhancedPrompt = await this.enhancePromptWithGemini(
          request.prompt,
          'video'
        );
      }

      if (IS_DEMO_MODE) {
        // Demo mode - return mock result
        await new Promise((resolve) => setTimeout(resolve, 5000));
        result.url =
          'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
        result.thumbnailUrl =
          'https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=Demo+Video';
        result.status = 'completed';
        result.cost = PRICING['veo3'][request.resolution || '1080p'] || 0.08;
        result.tokensUsed = Math.floor(enhancedPrompt.length / 4);
      } else {
        // Real Veo3 API call
        const veo3Result = await this.callVeo3API({
          ...request,
          prompt: enhancedPrompt,
        });

        result.url = veo3Result.url;
        result.thumbnailUrl = veo3Result.thumbnailUrl;
        result.status = 'completed';
        result.cost = PRICING['veo3'][request.resolution || '1080p'] || 0.08;
        result.tokensUsed = Math.floor(enhancedPrompt.length / 4);
      }

      return result;
    } catch (error) {
      result.status = 'failed';
      throw new Error(
        `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enhance prompt using Gemini
   */
  private async enhancePromptWithGemini(
    prompt: string,
    type: 'image' | 'video'
  ): Promise<string> {
    if (!GOOGLE_API_KEY) return prompt;

    try {
      const systemPrompt =
        type === 'image'
          ? 'You are an expert at creating detailed, high-quality image generation prompts. Enhance the given prompt to be more specific, descriptive, and likely to produce excellent results. Focus on visual details, composition, lighting, and style.'
          : 'You are an expert at creating detailed, high-quality video generation prompts. Enhance the given prompt to be more specific, descriptive, and likely to produce excellent results. Focus on motion, cinematography, lighting, and visual storytelling.';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nOriginal prompt: ${prompt}\n\nEnhanced prompt:`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn('Failed to enhance prompt with Gemini, using original');
        return prompt;
      }

      const data = await response.json();
      const enhancedPrompt =
        data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

      return enhancedPrompt.trim();
    } catch (error) {
      console.warn('Error enhancing prompt with Gemini:', error);
      return prompt;
    }
  }

  /**
   * Call Nano Banana API
   */
  private async callNanoBananaAPI(request: ImageGenerationRequest): Promise<{
    url: string;
    thumbnailUrl?: string;
  }> {
    const response = await fetch('https://api.nanoimg.com/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NANO_BANANA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        style: request.style || 'realistic',
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        aspectRatio: request.aspectRatio || '1:1',
        negativePrompt: request.negativePrompt,
        seed: request.seed,
        steps: request.steps || 20,
        guidance: request.guidance || 7.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Nano Banana API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
    };
  }

  /**
   * Call Veo3 API
   */
  private async callVeo3API(request: VideoGenerationRequest): Promise<{
    url: string;
    thumbnailUrl?: string;
  }> {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/veo3:generateVideo',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${VEO3_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          duration: request.duration || 5,
          resolution: request.resolution || '1080p',
          style: request.style || 'realistic',
          aspectRatio: request.aspectRatio || '16:9',
          fps: request.fps || 24,
          seed: request.seed,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Veo3 API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    return {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
    };
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
    nanoBanana: boolean;
    veo3: boolean;
    gemini: boolean;
  } {
    return {
      nanoBanana: !!NANO_BANANA_API_KEY || IS_DEMO_MODE,
      veo3: !!VEO3_API_KEY || IS_DEMO_MODE,
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
