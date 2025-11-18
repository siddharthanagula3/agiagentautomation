/**
 * Google Imagen Service
 * Official integration with Google AI Studio Imagen API for image generation
 * Uses Gemini API endpoints: https://ai.google.dev/gemini-api/docs/imagen
 *
 * Supported models:
 * - imagen-4.0-generate-001 (Standard)
 * - imagen-4.0-ultra-generate-001 (Ultra quality)
 * - imagen-4.0-fast-generate-001 (Fast generation)
 */

export interface ImagenGenerationRequest {
  prompt: string;
  model?: 'imagen-4.0-generate-001' | 'imagen-4.0-ultra-generate-001' | 'imagen-4.0-fast-generate-001';
  numberOfImages?: number; // 1-4
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  negativePrompt?: string;
  seed?: number;
  language?: string;
  safetyFilterLevel?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high';
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

const IMAGEN_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Pricing per image (USD)
const IMAGEN_PRICING = {
  'imagen-4.0-generate-001': 0.002,
  'imagen-4.0-ultra-generate-001': 0.004,
  'imagen-4.0-fast-generate-001': 0.001,
};

export class GoogleImagenService {
  private static instance: GoogleImagenService;
  private apiKey: string;
  private isDemoMode: boolean;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
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
   */
  isAvailable(): boolean {
    return !!this.apiKey || this.isDemoMode;
  }

  /**
   * Get API key status
   */
  getApiKeyStatus(): { configured: boolean; demoMode: boolean } {
    return {
      configured: !!this.apiKey,
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
   * Call Imagen API (official Gemini API endpoint)
   */
  private async callImagenAPI(
    request: ImagenGenerationRequest,
    response: ImagenGenerationResponse
  ): Promise<ImagenGenerationResponse> {
    const model = request.model || 'imagen-4.0-generate-001';
    const endpoint = `${IMAGEN_API_BASE_URL}/models/${model}:predict`;

    const requestBody = {
      instances: [
        {
          prompt: request.prompt,
        },
      ],
      parameters: {
        sampleCount: request.numberOfImages || 1,
        aspectRatio: request.aspectRatio || '1:1',
        negativePrompt: request.negativePrompt,
        seed: request.seed,
        language: request.language || 'auto',
        safetyFilterLevel: request.safetyFilterLevel || 'block_medium_and_above',
        personGeneration: request.personGeneration || 'allow_adult',
      },
    };

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw this.createError(
        'API_ERROR',
        errorData.error?.message || `Imagen API error: ${apiResponse.statusText}`,
        errorData
      );
    }

    const data = await apiResponse.json();

    // Process predictions
    const predictions = data.predictions || [];
    response.images = predictions.map((prediction: { bytesBase64Encoded?: string; mimeType?: string }, index: number) => ({
      url: prediction.bytesBase64Encoded
        ? `data:${prediction.mimeType || 'image/png'};base64,${prediction.bytesBase64Encoded}`
        : '',
      mimeType: prediction.mimeType || 'image/png',
      bytesBase64Encoded: prediction.bytesBase64Encoded,
    }));

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
   */
  async enhancePrompt(prompt: string): Promise<string> {
    if (!this.isAvailable()) {
      return prompt;
    }

    try {
      const systemPrompt =
        'You are an expert at creating detailed, high-quality image generation prompts. ' +
        'Enhance the given prompt to be more specific, descriptive, and likely to produce excellent results. ' +
        'Focus on visual details, composition, lighting, style, and artistic elements. ' +
        'Keep the enhanced prompt concise (under 200 words) but rich in detail.';

      const endpoint = `${IMAGEN_API_BASE_URL}/models/gemini-2.0-flash-exp:generateContent`;

      const apiResponse = await fetch(`${endpoint}?key=${this.apiKey}`, {
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
      });

      if (!apiResponse.ok) {
        console.warn('Failed to enhance prompt with Gemini, using original');
        return prompt;
      }

      const data = await apiResponse.json();
      const enhancedPrompt =
        data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

      return enhancedPrompt.trim();
    } catch (error) {
      console.warn('Error enhancing prompt with Gemini:', error);
      return prompt;
    }
  }

  /**
   * Download image from data URL or URL
   */
  async downloadImage(imageUrl: string, filename: string = 'imagen-generated.png'): Promise<void> {
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
        description: 'Best quality text-to-image model with improved text rendering',
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
