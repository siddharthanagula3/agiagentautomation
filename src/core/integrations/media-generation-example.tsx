/**
 * Media Generation Integration Example
 *
 * This example demonstrates how to integrate Google Imagen and Veo services
 * into a chat interface with automatic tool detection.
 *
 * Usage in your chat component:
 *
 * ```tsx
 * import { useMediaGeneration } from './media-generation-example';
 *
 * function ChatComponent() {
 *   const { handleMessage, generatedMedia, isGenerating } = useMediaGeneration();
 *
 *   const onSendMessage = async (message: string) => {
 *     const result = await handleMessage(message);
 *     if (result) {
 *       // Media was generated
 *       console.log('Generated:', result);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {generatedMedia.map(media => (
 *         media.type === 'image'
 *           ? <GeneratedImagePreview {...media} />
 *           : <GeneratedVideoPreview {...media} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { mediaToolDetector } from './media-tool-detector';
import { mediaGenerationService } from './media-generation-handler';
import type { MediaGenerationResult } from './media-generation-handler';

export interface UseMediaGenerationOptions {
  onProgress?: (progress: number, status: string) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: MediaGenerationResult) => void;
}

export interface UseMediaGenerationReturn {
  handleMessage: (message: string) => Promise<MediaGenerationResult | null>;
  generatedMedia: MediaGenerationResult[];
  isGenerating: boolean;
  currentProgress: number;
  clearHistory: () => void;
  isMediaRequest: (message: string) => boolean;
}

/**
 * React hook for media generation with automatic tool detection
 */
export function useMediaGeneration(
  options: UseMediaGenerationOptions = {}
): UseMediaGenerationReturn {
  const [generatedMedia, setGeneratedMedia] = useState<MediaGenerationResult[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  const handleMessage = useCallback(
    async (message: string): Promise<MediaGenerationResult | null> => {
      // Detect if this is a media generation request
      const detection = mediaToolDetector.extractMediaInfo(message);

      if (!detection.shouldGenerate) {
        return null; // Not a media request, handle normally
      }

      setIsGenerating(true);
      setCurrentProgress(0);

      try {
        let result: MediaGenerationResult;

        if (detection.toolType === 'imagen') {
          // Generate image
          result = await mediaGenerationService.generateImage({
            prompt: detection.prompt,
            aspectRatio: detection.params.aspectRatio as
              | '1:1'
              | '16:9'
              | '9:16'
              | '4:3'
              | '3:4'
              | undefined,
            numberOfImages: detection.params.numberOfImages,
            seed: Math.floor(Math.random() * 1000000),
          });
        } else if (detection.toolType === 'veo') {
          // Generate video
          result = await mediaGenerationService.generateVideo(
            {
              prompt: detection.prompt,
              aspectRatio: detection.params.aspectRatio as
                | '16:9'
                | '9:16'
                | '1:1'
                | '4:3'
                | undefined,
              resolution: detection.params.resolution as
                | '720p'
                | '1080p'
                | '4k'
                | undefined,
              duration: detection.params.duration,
              seed: Math.floor(Math.random() * 1000000),
            },
            (progress, status) => {
              setCurrentProgress(progress);
              options.onProgress?.(progress, status);
            }
          );
        } else {
          throw new Error('Unknown media tool type');
        }

        // Add to history
        setGeneratedMedia((prev) => [...prev, result]);
        options.onSuccess?.(result);

        return result;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Media generation failed');
        options.onError?.(err);
        throw err;
      } finally {
        setIsGenerating(false);
        setCurrentProgress(0);
      }
    },
    [options]
  );

  const clearHistory = useCallback(() => {
    setGeneratedMedia([]);
    mediaGenerationService.clearHistory();
  }, []);

  const isMediaRequest = useCallback((message: string): boolean => {
    return mediaToolDetector.isMediaGenerationRequest(message);
  }, []);

  return {
    handleMessage,
    generatedMedia,
    isGenerating,
    currentProgress,
    clearHistory,
    isMediaRequest,
  };
}

/**
 * Example: Standalone function to handle media generation
 */
export async function generateMediaFromMessage(
  message: string,
  onProgress?: (progress: number, status: string) => void
): Promise<MediaGenerationResult | null> {
  const detection = mediaToolDetector.extractMediaInfo(message);

  if (!detection.shouldGenerate) {
    return null;
  }

  if (detection.toolType === 'imagen') {
    return await mediaGenerationService.generateImage({
      prompt: detection.prompt,
      aspectRatio: detection.params.aspectRatio as
        | '1:1'
        | '16:9'
        | '9:16'
        | '4:3'
        | '3:4'
        | undefined,
      numberOfImages: detection.params.numberOfImages,
    });
  } else if (detection.toolType === 'veo') {
    return await mediaGenerationService.generateVideo(
      {
        prompt: detection.prompt,
        aspectRatio: detection.params.aspectRatio as
          | '16:9'
          | '9:16'
          | '1:1'
          | '4:3'
          | undefined,
        resolution: detection.params.resolution as
          | '720p'
          | '1080p'
          | '4k'
          | undefined,
        duration: detection.params.duration,
      },
      onProgress
    );
  }

  return null;
}

/**
 * Example: Check service availability before showing UI
 */
export function checkMediaServicesAvailability(): {
  imagen: boolean;
  veo: boolean;
  anyAvailable: boolean;
} {
  const availability = mediaGenerationService.isServiceAvailable();
  return {
    ...availability,
    anyAvailable: availability.imagen || availability.veo,
  };
}

/**
 * Example: Get user-friendly error messages
 */
export function getMediaGenerationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'Google API key not configured. Please add VITE_GOOGLE_API_KEY to your .env file.';
    }
    if (error.message.includes('quota')) {
      return 'API quota exceeded. Please check your Google AI Studio usage limits.';
    }
    if (error.message.includes('safety')) {
      return 'Content was blocked by safety filters. Please try a different prompt.';
    }
    return error.message;
  }
  return 'An unknown error occurred during media generation.';
}

/**
 * Example: Extract media type from detection
 */
export function getMediaTypeFromMessage(
  message: string
): 'image' | 'video' | 'none' {
  const toolType = mediaToolDetector.getSuggestedToolType(message);
  if (toolType === 'imagen') return 'image';
  if (toolType === 'veo') return 'video';
  return 'none';
}
