/**
 * OpenAI DALL-E Image Generation Service
 * Implements real image generation using OpenAI's DALL-E API through secure proxy
 *
 * SECURITY: All API calls are routed through Netlify proxy functions
 * to keep API keys secure on the server side. Never expose API keys client-side.
 */

import { supabase } from '@shared/lib/supabase-client';

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
 * Helper function to get the current Supabase session token
 * Required for authenticated API proxy calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[DallEImageService] Failed to get auth token:', error);
    return null;
  }
}

/**
 * DALL-E Image Generation Service
 * SECURITY: Routes through Netlify proxy to keep API keys secure
 */
export class DallEImageService {
  private static instance: DallEImageService;
  // SECURITY: API keys are managed by Netlify proxy functions
  private readonly proxyUrl =
    '/.netlify/functions/media-proxies/openai-image-proxy';

  private constructor() {
    // SECURITY: API keys removed from client-side code
    // All calls go through authenticated Netlify proxy
  }

  static getInstance(): DallEImageService {
    if (!DallEImageService.instance) {
      DallEImageService.instance = new DallEImageService();
    }
    return DallEImageService.instance;
  }

  /**
   * Generate images using DALL-E through secure proxy
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

    // SECURITY: Get auth token for authenticated proxy calls
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error(
        'User not authenticated. Please log in to generate images.'
      );
    }

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
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
          errorData.error?.message ||
          errorData.error ||
          `API error: ${response.status} ${response.statusText}`;
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
    const {
      quality = 'standard',
      size = '1024x1024',
      model = 'dall-e-3',
    } = request;

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
