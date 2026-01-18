/**
 * Google Veo Service
 * Official integration with Google AI Studio Veo 3.1 API for video generation
 * Uses Gemini API endpoints: https://ai.google.dev/gemini-api/docs/video
 *
 * SECURITY: All API calls are routed through Netlify proxy functions
 * to keep API keys secure on the server side. Never expose API keys client-side.
 *
 * Supported models:
 * - veo-3.1-generate-preview (8-second 720p or 1080p videos with audio)
 *
 * Features:
 * - Text-to-video generation
 * - Image-to-video generation
 * - Video extension
 * - Frame-specific generation
 */

import { supabase } from '@shared/lib/supabase-client';

export interface VeoGenerationRequest {
  prompt: string;
  model?: 'veo-3.1-generate-preview';
  resolution?: '720p' | '1080p';
  duration?: number; // 5-8 seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  fps?: number; // 24 or 30
  seed?: number;
  referenceImages?: Array<{
    imageData: string; // base64 encoded image
    mimeType: string;
  }>;
  firstFrame?: {
    imageData: string;
    mimeType: string;
  };
  lastFrame?: {
    imageData: string;
    mimeType: string;
  };
  extensionVideo?: {
    videoData: string; // base64 encoded video
    mimeType: string;
  };
}

export interface VeoGenerationResponse {
  id: string;
  operationName: string;
  video?: {
    url: string;
    mimeType: string;
    bytesBase64Encoded?: string;
    duration: number;
    resolution: string;
  };
  thumbnail?: {
    url: string;
    mimeType: string;
  };
  prompt: string;
  model: string;
  metadata: {
    resolution: string;
    duration: number;
    fps: number;
    aspectRatio: string;
    seed?: number;
    hasAudio: boolean;
  };
  cost: number;
  tokensUsed: number;
  createdAt: Date;
  status: 'generating' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
}

export interface VeoServiceError {
  code: string;
  message: string;
  details?: unknown;
}

// SECURITY: API calls route through Netlify proxy
const VEO_PROXY_URL = '/.netlify/functions/media-proxies/google-veo-proxy';

// Pricing per video (USD)
const VEO_PRICING = {
  '720p': 0.05,
  '1080p': 0.08,
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
    console.error('[GoogleVeoService] Failed to get auth token:', error);
    return null;
  }
}

export class GoogleVeoService {
  private static instance: GoogleVeoService;
  // SECURITY: API keys removed from client-side code
  private isDemoMode: boolean;
  private pollingInterval: number = 3000; // 3 seconds
  private maxPollingAttempts: number = 60; // 3 minutes max

  private constructor() {
    // SECURITY: API keys are managed by Netlify proxy functions
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  }

  static getInstance(): GoogleVeoService {
    if (!GoogleVeoService.instance) {
      GoogleVeoService.instance = new GoogleVeoService();
    }
    return GoogleVeoService.instance;
  }

  /**
   * Check if Veo service is available
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
   * Generate video using Veo API
   */
  async generateVideo(
    request: VeoGenerationRequest,
    onProgress?: (progress: number, status: string) => void
  ): Promise<VeoGenerationResponse> {
    if (!this.isAvailable()) {
      throw this.createError(
        'API_KEY_MISSING',
        'Google API key not configured.\n\n' +
          '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
          '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
          '💡 Or enable demo mode: VITE_DEMO_MODE=true'
      );
    }

    const model = request.model || 'veo-3.1-generate-preview';
    const generationId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial response
    const response: VeoGenerationResponse = {
      id: generationId,
      operationName: '',
      prompt: request.prompt,
      model,
      metadata: {
        resolution: request.resolution || '1080p',
        duration: request.duration || 8,
        fps: request.fps || 24,
        aspectRatio: request.aspectRatio || '16:9',
        seed: request.seed,
        hasAudio: true,
      },
      cost: 0,
      tokensUsed: 0,
      createdAt: new Date(),
      status: 'generating',
      progress: 0,
    };

    try {
      if (this.isDemoMode) {
        // Demo mode - return mock data
        return this.generateDemoVideo(request, response, onProgress);
      }

      // Real API call
      return await this.callVeoAPI(request, response, onProgress);
    } catch (error) {
      response.status = 'failed';
      throw this.handleError(error);
    }
  }

  /**
   * Call Veo API through secure Netlify proxy
   * SECURITY: Routes through authenticated proxy to keep API keys secure
   */
  private async callVeoAPI(
    request: VeoGenerationRequest,
    response: VeoGenerationResponse,
    onProgress?: (progress: number, status: string) => void
  ): Promise<VeoGenerationResponse> {
    // SECURITY: Get auth token for authenticated proxy calls
    const authToken = await getAuthToken();
    if (!authToken) {
      throw this.createError(
        'AUTH_ERROR',
        'User not authenticated. Please log in to generate videos.'
      );
    }

    const model = request.model || 'veo-3.1-generate-preview';

    // Build request body for proxy
    const requestBody = {
      model,
      prompt: request.prompt,
      aspectRatio: request.aspectRatio || '16:9',
      resolution: request.resolution || '1080p',
      duration: request.duration || 8,
      seed: request.seed,
      fps: request.fps || 24,
      referenceImages: request.referenceImages,
      firstFrame: request.firstFrame,
      lastFrame: request.lastFrame,
      extensionVideo: request.extensionVideo,
    };

    // Start generation
    onProgress?.(10, 'Starting video generation...');

    // SECURITY: Route through Netlify proxy
    const apiResponse = await fetch(VEO_PROXY_URL, {
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
          `Veo API error: ${apiResponse.statusText}`,
        errorData
      );
    }

    const data = await apiResponse.json();
    response.operationName = data.name || data.operationName || '';

    // Poll for completion through proxy
    onProgress?.(20, 'Video generation in progress...');
    return await this.pollOperation(response, authToken, onProgress);
  }

  /**
   * Poll long-running operation until completion
   * SECURITY: Routes through authenticated Netlify proxy
   */
  private async pollOperation(
    response: VeoGenerationResponse,
    authToken: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<VeoGenerationResponse> {
    for (let attempt = 0; attempt < this.maxPollingAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));

      // SECURITY: Poll through proxy instead of direct API call
      const pollResponse = await fetch(`${VEO_PROXY_URL}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          operationName: response.operationName,
        }),
      });

      if (!pollResponse.ok) {
        throw this.createError(
          'POLLING_ERROR',
          `Failed to poll operation: ${pollResponse.statusText}`
        );
      }

      const operationData = await pollResponse.json();

      // Update progress
      const progress = Math.min(
        20 + (attempt / this.maxPollingAttempts) * 70,
        90
      );
      response.progress = progress;
      onProgress?.(progress, 'Processing video...');

      // Check if operation is done
      if (operationData.done) {
        if (operationData.error) {
          throw this.createError(
            'GENERATION_ERROR',
            operationData.error.message || 'Video generation failed',
            operationData.error
          );
        }

        // Extract video data
        const videoData =
          operationData.response?.candidates?.[0]?.content?.parts?.[0] ||
          operationData.video;

        if (videoData?.inlineData) {
          response.video = {
            url: `data:${videoData.inlineData.mimeType};base64,${videoData.inlineData.data}`,
            mimeType: videoData.inlineData.mimeType || 'video/mp4',
            bytesBase64Encoded: videoData.inlineData.data,
            duration: response.metadata.duration,
            resolution: response.metadata.resolution,
          };

          // Generate thumbnail (first frame)
          response.thumbnail = {
            url: `data:image/jpeg;base64,${this.generateVideoThumbnail(videoData.inlineData.data)}`,
            mimeType: 'image/jpeg',
          };
        } else if (videoData?.fileData || videoData?.url) {
          response.video = {
            url: videoData.fileData?.fileUri || videoData.url,
            mimeType:
              videoData.fileData?.mimeType || videoData.mimeType || 'video/mp4',
            duration: response.metadata.duration,
            resolution: response.metadata.resolution,
          };
        }

        // Calculate cost and token usage
        response.cost =
          VEO_PRICING[response.metadata.resolution as '720p' | '1080p'] ||
          VEO_PRICING['1080p'];
        response.tokensUsed = Math.floor(response.prompt.length / 4);
        response.status = 'completed';
        response.progress = 100;
        onProgress?.(100, 'Video generation completed!');

        return response;
      }
    }

    // Max polling attempts reached
    throw this.createError(
      'TIMEOUT_ERROR',
      'Video generation timed out. Please try again.'
    );
  }

  /**
   * Generate demo video (for testing without API key)
   */
  private async generateDemoVideo(
    request: VeoGenerationRequest,
    response: VeoGenerationResponse,
    onProgress?: (progress: number, status: string) => void
  ): Promise<VeoGenerationResponse> {
    // Simulate progressive generation
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const progress = (i / steps) * 100;
      response.progress = progress;
      onProgress?.(progress, `Generating video... ${Math.floor(progress)}%`);
    }

    // Set demo video
    response.video = {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      mimeType: 'video/mp4',
      duration: response.metadata.duration,
      resolution: response.metadata.resolution,
    };

    response.thumbnail = {
      url: 'https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=Demo+Video',
      mimeType: 'image/jpeg',
    };

    response.cost = VEO_PRICING[request.resolution || '1080p'];
    response.tokensUsed = Math.floor(request.prompt.length / 4);
    response.status = 'completed';
    response.progress = 100;

    return response;
  }

  /**
   * Generate thumbnail from video (placeholder implementation)
   */
  private generateVideoThumbnail(videoBase64: string): string {
    // In a real implementation, this would extract the first frame
    // For now, return a placeholder
    return videoBase64.substring(0, 100);
  }

  /**
   * Enhance prompt for better video generation
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
        'You are an expert at creating detailed, high-quality video generation prompts. ' +
        'Enhance the given prompt to be more specific, descriptive, and likely to produce excellent results. ' +
        'Focus on motion, cinematography, camera movements, lighting, visual storytelling, and atmosphere. ' +
        'Keep the enhanced prompt concise (under 200 words) but rich in cinematic detail.';

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
   * Download video from data URL or URL
   */
  async downloadVideo(
    videoUrl: string,
    filename: string = 'veo-generated.mp4'
  ): Promise<void> {
    try {
      if (videoUrl.startsWith('data:')) {
        // Data URL - convert to blob and download
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        this.downloadBlob(blob, filename);
      } else {
        // Regular URL - fetch and download
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        this.downloadBlob(blob, filename);
      }
    } catch (error) {
      throw this.createError(
        'DOWNLOAD_ERROR',
        `Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    features: string[];
  }> {
    return [
      {
        id: 'veo-3.1-generate-preview',
        name: 'Veo 3.1',
        description: 'State-of-the-art 8-second video generation with audio',
        features: [
          '720p or 1080p resolution',
          'Native audio generation',
          'Text-to-video',
          'Image-to-video',
          'Video extension',
          'Frame-specific generation',
        ],
      },
    ];
  }

  /**
   * Get supported resolutions
   */
  getSupportedResolutions(): string[] {
    return ['720p', '1080p'];
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): string[] {
    return ['16:9', '9:16', '1:1'];
  }

  /**
   * Create error object
   */
  private createError(
    code: string,
    message: string,
    details?: unknown
  ): VeoServiceError {
    return { code, message, details };
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown): VeoServiceError {
    if (this.isVeoServiceError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return this.createError('UNKNOWN_ERROR', error.message);
    }

    return this.createError('UNKNOWN_ERROR', 'An unknown error occurred');
  }

  /**
   * Type guard for VeoServiceError
   */
  private isVeoServiceError(error: unknown): error is VeoServiceError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

// Export singleton instance
export const googleVeoService = GoogleVeoService.getInstance();
