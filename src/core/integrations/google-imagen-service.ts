/**
 * Google Imagen Service
 * Official integration with Google AI Studio Imagen API for image generation
 * Uses Gemini API endpoints: https://ai.google.dev/gemini-api/docs/imagen
 *
 * SECURITY: All API calls are routed through Netlify proxy functions
 * to keep API keys secure on the server side. Never expose API keys client-side.
 *
 * Supported models:
 * - imagen-4.0-generate-001 (Standard)
 * - imagen-4.0-ultra-generate-001 (Ultra quality)
 * - imagen-4.0-fast-generate-001 (Fast generation)
 */

import { supabase } from '@shared/lib/supabase-client';

export interface ImagenGenerationRequest {
  prompt: string;
  model?:
    | 'imagen-4.0-generate-001'
    | 'imagen-4.0-ultra-generate-001'
    | 'imagen-4.0-fast-generate-001';
  numberOfImages?: number; // 1-4
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  negativePrompt?: string;
  seed?: number;
  language?: string;
  safetyFilterLevel?:
    | 'block_low_and_above'
    | 'block_medium_and_above'
    | 'block_only_high';
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
}

export interface ImagenGenerationResponse {
  id: string;
  images: Array<{
    url: string;
    mimeType: string;
    bytesBase64Encoded?: string;
  }>;
  prompt: string;
  model: string;
  metadata: {
    aspectRatio: string;
    numberOfImages: number;
    seed?: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
  cost: number;
  tokensUsed: number;
  createdAt: Date;
  status: 'generating' | 'completed' | 'failed';
}

export interface ImagenServiceError {
  code: string;
  message: string;
  details?: unknown;
}

// SECURITY: API calls route through Netlify proxy
const IMAGEN_PROXY_URL =
  '/.netlify/functions/media-proxies/google-imagen-proxy';

// Pricing per image (USD)
const IMAGEN_PRICING = {
  'imagen-4.0-generate-001': 0.002,
  'imagen-4.0-ultra-generate-001': 0.004,
  'imagen-4.0-fast-generate-001': 0.001,
};

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
    console.error('[GoogleImagenService] Failed to get auth token:', error);
    return null;
  }
}

export class GoogleImagenService {
  private static instance: GoogleImagenService;
  // SECURITY: API keys removed from client-side code
  private isDemoMode: boolean;

  private constructor() {
    // SECURITY: API keys are managed by Netlify proxy functions
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  }

  static getInstance(): GoogleImagenService {
    if (!GoogleImagenService.instance) {
      GoogleImagenService.instance = new GoogleImagenService();
    }
    return GoogleImagenService.instance;
  }

  /**
   * Check if Imagen service is available
   * SECURITY: Always returns true since proxy handles API key on server side
   */
  isAvailable(): boolean {
    // Service is available through authenticated proxy or in demo mode
    return true;
  }

  /**
   * Get API key status
   * SECURITY: API keys are managed server-side, not exposed to client
   */
  getApiKeyStatus(): { configured: boolean; demoMode: boolean } {
    return {
      configured: true, // Proxy handles API key server-side
      demoMode: this.isDemoMode,
    };
  }

  /**
   * Generate images using Imagen API
   */
  async generateImage(
    request: ImagenGenerationRequest
  ): Promise<ImagenGenerationResponse> {
    if (!this.isAvailable()) {
      throw this.createError(
        'API_KEY_MISSING',
        'Google API key not configured.\n\n' +
          '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
          '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    const model = request.model || 'imagen-4.0-generate-001';
    const generationId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial response
    const response: ImagenGenerationResponse = {
      id: generationId,
      images: [],
      prompt: request.prompt,
      model,
      metadata: {
        aspectRatio: request.aspectRatio || '1:1',
        numberOfImages: request.numberOfImages || 1,
        seed: request.seed,
      },
      cost: 0,
      tokensUsed: 0,
      createdAt: new Date(),
      status: 'generating',
    };

    try {
      if (this.isDemoMode) {
        // Demo mode - return mock data
        return this.generateDemoImage(request, response);
      }

      // Real API call
      return await this.callImagenAPI(request, response);
    } catch (error) {
      response.status = 'failed';
      throw this.handleError(error);
    }
  }

  /**
   * Call Imagen API through secure Netlify proxy
   * SECURITY: Routes through authenticated proxy to keep API keys secure
   */
  private async callImagenAPI(
    request: ImagenGenerationRequest,
    response: ImagenGenerationResponse
  ): Promise<ImagenGenerationResponse> {
    // SECURITY: Get auth token for authenticated proxy calls
    const authToken = await getAuthToken();
    if (!authToken) {
      throw this.createError(
        'AUTH_ERROR',
        'User not authenticated. Please log in to generate images.'
      );
    }

    const model = request.model || 'imagen-4.0-generate-001';

    const requestBody = {
      model,
      prompt: request.prompt,
      numberOfImages: request.numberOfImages || 1,
      aspectRatio: request.aspectRatio || '1:1',
      negativePrompt: request.negativePrompt,
      seed: request.seed,
      language: request.language || 'auto',
      safetyFilterLevel: request.safetyFilterLevel || 'block_medium_and_above',
      personGeneration: request.personGeneration || 'allow_adult',
    };

    // SECURITY: Route through Netlify proxy
    const apiResponse = await fetch(IMAGEN_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw this.createError(
        'API_ERROR',
        errorData.error?.message ||
          errorData.error ||
          `Imagen API error: ${apiResponse.statusText}`,
        errorData
      );
    }

    const data = await apiResponse.json();

    // Process predictions
    const predictions = data.predictions || data.images || [];
    response.images = predictions.map(
      (
        prediction: {
          bytesBase64Encoded?: string;
          mimeType?: string;
          url?: string;
        },
        index: number
      ) => ({
        url:
          prediction.url ||
          (prediction.bytesBase64Encoded
            ? `data:${prediction.mimeType || 'image/png'};base64,${prediction.bytesBase64Encoded}`
            : ''),
        mimeType: prediction.mimeType || 'image/png',
        bytesBase64Encoded: prediction.bytesBase64Encoded,
      })
    );

    // Calculate cost and token usage
    const numberOfImages = request.numberOfImages || 1;
    response.cost = IMAGEN_PRICING[model] * numberOfImages;
    response.tokensUsed = Math.floor(request.prompt.length / 4);
    response.status = 'completed';

    // Add safety ratings if available
    if (data.metadata?.safetyRatings) {
      response.metadata.safetyRatings = data.metadata.safetyRatings;
    }

    return response;
  }

  /**
   * Generate demo image (for testing without API key)
   */
  private async generateDemoImage(
    request: ImagenGenerationRequest,
    response: ImagenGenerationResponse
  ): Promise<ImagenGenerationResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const model = request.model || 'imagen-4.0-generate-001';
    const numberOfImages = request.numberOfImages || 1;

    // Generate demo images
    response.images = Array.from({ length: numberOfImages }, (_, index) => ({
      url: `https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Demo+Image+${index + 1}`,
      mimeType: 'image/png',
    }));

    response.cost = IMAGEN_PRICING[model] * numberOfImages;
    response.tokensUsed = Math.floor(request.prompt.length / 4);
    response.status = 'completed';

    return response;
  }

  /**
   * Enhance prompt for better image generation
   * SECURITY: Routes through authenticated Netlify proxy
   */
  async enhancePrompt(prompt: string): Promise<string> {
    if (!this.isAvailable()) {
      return prompt;
    }

    try {
      // SECURITY: Get auth token for authenticated proxy calls
      const authToken = await getAuthToken();
      if (!authToken) {
        console.warn('User not authenticated, using original prompt');
        return prompt;
      }

      const systemPrompt =
        'You are an expert at creating detailed, high-quality image generation prompts. ' +
        'Enhance the given prompt to be more specific, descriptive, and likely to produce excellent results. ' +
        'Focus on visual details, composition, lighting, style, and artistic elements. ' +
        'Keep the enhanced prompt concise (under 200 words) but rich in detail.';

      // SECURITY: Route through Google proxy instead of direct API call
      const apiResponse = await fetch(
        '/.netlify/functions/llm-proxies/google-proxy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            model: 'gemini-2.0-flash',
            messages: [
              {
                role: 'user',
                content: `${systemPrompt}\n\nOriginal prompt: ${prompt}\n\nEnhanced prompt:`,
              },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        }
      );

      if (!apiResponse.ok) {
        console.warn('Failed to enhance prompt with Gemini, using original');
        return prompt;
      }

      const data = await apiResponse.json();
      const enhancedPrompt =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.content ||
        prompt;

      return enhancedPrompt.trim();
    } catch (error) {
      console.warn('Error enhancing prompt with Gemini:', error);
      return prompt;
    }
  }

  /**
   * Download image from data URL or URL
   */
  async downloadImage(
    imageUrl: string,
    filename: string = 'imagen-generated.png'
  ): Promise<void> {
    try {
      if (imageUrl.startsWith('data:')) {
        // Data URL - convert to blob and download
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        this.downloadBlob(blob, filename);
      } else {
        // Regular URL - fetch and download
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        this.downloadBlob(blob, filename);
      }
    } catch (error) {
      throw this.createError(
        'DOWNLOAD_ERROR',
        `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate prompt
   */
  validatePrompt(prompt: string): { valid: boolean; error?: string } {
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, error: 'Prompt cannot be empty' };
    }

    if (prompt.length > 2000) {
      return {
        valid: false,
        error: 'Prompt is too long (max 2000 characters)',
      };
    }

    return { valid: true };
  }

  /**
   * Get available models
   */
  getAvailableModels(): Array<{
    id: string;
    name: string;
    description: string;
    pricing: number;
  }> {
    return [
      {
        id: 'imagen-4.0-generate-001',
        name: 'Imagen 4.0 Standard',
        description:
          'Best quality text-to-image model with improved text rendering',
        pricing: IMAGEN_PRICING['imagen-4.0-generate-001'],
      },
      {
        id: 'imagen-4.0-ultra-generate-001',
        name: 'Imagen 4.0 Ultra',
        description: 'Highest quality for advanced use-cases',
        pricing: IMAGEN_PRICING['imagen-4.0-ultra-generate-001'],
      },
      {
        id: 'imagen-4.0-fast-generate-001',
        name: 'Imagen 4.0 Fast',
        description: 'Fast generation with good quality',
        pricing: IMAGEN_PRICING['imagen-4.0-fast-generate-001'],
      },
    ];
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): string[] {
    return ['1:1', '3:4', '4:3', '9:16', '16:9'];
  }

  /**
   * Create error object
   */
  private createError(
    code: string,
    message: string,
    details?: unknown
  ): ImagenServiceError {
    return { code, message, details };
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown): ImagenServiceError {
    if (this.isImagenServiceError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return this.createError('UNKNOWN_ERROR', error.message);
    }

    return this.createError('UNKNOWN_ERROR', 'An unknown error occurred');
  }

  /**
   * Type guard for ImagenServiceError
   */
  private isImagenServiceError(error: unknown): error is ImagenServiceError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

// Export singleton instance
export const googleImagenService = GoogleImagenService.getInstance();
