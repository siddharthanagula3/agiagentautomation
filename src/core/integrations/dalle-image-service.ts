/**
 * OpenAI DALL-E Image Generation Service
 * Implements real image generation using OpenAI's DALL-E API
 */

export interface DallEGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number; // Number of images (1-10 for standard, 1 for HD)
  model?: 'dall-e-3' | 'dall-e-2';
}

export interface DallEGenerationResponse {
  id: string;
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  size: string;
  quality: string;
  style?: string;
  model: string;
  createdAt: Date;
}

/**
 * DALL-E Image Generation Service
 * Uses OpenAI's images.generate API endpoint
 */
export class DallEImageService {
  private static instance: DallEImageService;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1/images/generations';

  private constructor() {
    // Use environment variable in development, proxied in production
    this.apiKey =
      import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '';
  }

  static getInstance(): DallEImageService {
    if (!DallEImageService.instance) {
      DallEImageService.instance = new DallEImageService();
    }
    return DallEImageService.instance;
  }

  /**
   * Generate images using DALL-E
   */
  async generateImage(
    request: DallEGenerationRequest
  ): Promise<ImageGenerationResult[]> {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      n = 1,
      model = 'dall-e-3',
    } = request;

    // Validate request
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Image generation prompt is required');
    }

    // DALL-E 3 only supports n=1
    if (model === 'dall-e-3' && n > 1) {
      throw new Error('DALL-E 3 only supports generating 1 image at a time');
    }

    // Check API key
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.'
      );
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt: prompt.trim(),
          size,
          quality,
          style: model === 'dall-e-3' ? style : undefined, // DALL-E 2 doesn't support style
          n,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || `API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data: DallEGenerationResponse = await response.json();

      // Map to our format
      return data.data.map((image, index) => ({
        id: `${data.created}-${index}`,
        url: image.url,
        prompt,
        revisedPrompt: image.revised_prompt,
        size,
        quality,
        style: model === 'dall-e-3' ? style : undefined,
        model,
        createdAt: new Date(data.created * 1000),
      }));
    } catch (error) {
      console.error('[DallEImageService] Generation failed:', error);
      throw error instanceof Error
        ? error
        : new Error('Unknown error during image generation');
    }
  }

  /**
   * Estimate cost for image generation
   * Based on OpenAI's pricing: https://openai.com/pricing
   */
  estimateCost(request: DallEGenerationRequest): number {
    const { quality = 'standard', size = '1024x1024', model = 'dall-e-3' } = request;

    if (model === 'dall-e-3') {
      // DALL-E 3 pricing
      if (quality === 'hd') {
        // HD quality
        if (size === '1024x1024') return 0.08;
        if (size === '1024x1792' || size === '1792x1024') return 0.12;
      } else {
        // Standard quality
        if (size === '1024x1024') return 0.04;
        if (size === '1024x1792' || size === '1792x1024') return 0.08;
      }
    } else {
      // DALL-E 2 pricing
      if (size === '1024x1024') return 0.02;
      if (size === '512x512') return 0.018;
      if (size === '256x256') return 0.016;
    }

    return 0.04; // Default fallback
  }
}

export const dallEImageService = DallEImageService.getInstance();
