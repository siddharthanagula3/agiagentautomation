# Google AI Studio Media Generation Guide

Complete guide for using Google Imagen 4.0 (image generation) and Veo 3.1 (video generation) in the AGI Agent Automation Platform.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Image Generation with Imagen 4.0](#image-generation-with-imagen-40)
- [Video Generation with Veo 3.1](#video-generation-with-veo-31)
- [Chat Integration](#chat-integration)
- [UI Components](#ui-components)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The platform integrates with Google AI Studio to provide:

- **Imagen 4.0**: State-of-the-art text-to-image generation with improved text rendering
- **Veo 3.1**: High-fidelity 8-second video generation with native audio
- **Automatic Tool Detection**: Chat interface automatically detects when users want to generate media
- **React Components**: Pre-built UI components for displaying generated media

### Features

**Imagen 4.0:**

- Multiple quality tiers (Standard, Ultra, Fast)
- Aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9
- 1-4 images per request
- Negative prompts
- Seed control for reproducibility
- Safety filtering

**Veo 3.1:**

- 720p or 1080p resolution
- 5-8 second duration
- Native audio generation
- Aspect ratios: 16:9, 9:16, 1:1
- Long-running operation support with progress tracking
- Frame-specific generation support

## Setup

### 1. Get API Key

Get a free Google API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Configure Environment

Add to your `.env` file:

```bash
VITE_GOOGLE_API_KEY=your-google-api-key-here
```

This single key enables:

- Gemini (chat)
- Imagen 4.0 (image generation)
- Veo 3.1 (video generation)

### 3. Optional: Demo Mode

For testing without an API key:

```bash
VITE_DEMO_MODE=true
```

## Image Generation with Imagen 4.0

### Basic Usage

```typescript
import { googleImagenService } from '@core/integrations/google-imagen-service';

// Generate an image
const result = await googleImagenService.generateImage({
  prompt: 'A futuristic city at sunset with flying cars',
  model: 'imagen-4.0-generate-001', // Standard quality
  numberOfImages: 1,
  aspectRatio: '16:9',
  seed: 12345, // Optional: for reproducibility
});

console.log('Image URL:', result.images[0].url);
console.log('Cost:', result.cost);
```

### Available Models

```typescript
// Standard quality (recommended)
model: 'imagen-4.0-generate-001'; // $0.002 per image

// Ultra quality (best results)
model: 'imagen-4.0-ultra-generate-001'; // $0.004 per image

// Fast generation (quick results)
model: 'imagen-4.0-fast-generate-001'; // $0.001 per image
```

### Advanced Options

```typescript
await googleImagenService.generateImage({
  prompt: 'A serene mountain landscape',
  model: 'imagen-4.0-ultra-generate-001',
  numberOfImages: 4,
  aspectRatio: '16:9',
  negativePrompt: 'blurry, low quality, distorted',
  seed: 42,
  safetyFilterLevel: 'block_medium_and_above',
  personGeneration: 'allow_adult',
});
```

### Prompt Enhancement

```typescript
// Automatically enhance prompts with Gemini
const enhanced = await googleImagenService.enhancePrompt(
  'sunset over mountains'
);
// Returns: "A breathtaking sunset over majestic snow-capped mountains,
//           with vibrant orange and pink hues illuminating wispy clouds..."
```

## Video Generation with Veo 3.1

### Basic Usage

```typescript
import { googleVeoService } from '@core/integrations/google-veo-service';

// Generate a video
const result = await googleVeoService.generateVideo(
  {
    prompt: 'Ocean waves crashing on a sandy beach at sunset',
    resolution: '1080p',
    duration: 8,
    aspectRatio: '16:9',
    fps: 24,
  },
  (progress, status) => {
    console.log(`${status}: ${progress}%`);
  }
);

console.log('Video URL:', result.video.url);
console.log('Has audio:', result.metadata.hasAudio);
```

### Progress Tracking

```typescript
await googleVeoService.generateVideo(
  {
    prompt: 'A drone flying over a forest',
    resolution: '720p',
  },
  (progress, status) => {
    // progress: 0-100
    // status: "Starting video generation...", "Processing video...", etc.
    updateProgressBar(progress);
    updateStatusText(status);
  }
);
```

### Advanced Options

```typescript
await googleVeoService.generateVideo({
  prompt: 'Cinematic shot of a city street at night',
  resolution: '1080p',
  duration: 8,
  aspectRatio: '16:9',
  fps: 30,
  seed: 123,
  // Future support for image-to-video
  referenceImages: [
    {
      imageData: base64ImageData,
      mimeType: 'image/jpeg',
    },
  ],
});
```

## Chat Integration

### Automatic Tool Detection

The platform automatically detects when users want to generate media:

```typescript
import { mediaToolDetector } from '@core/integrations/media-tool-detector';

const message = 'Create an image of a sunset over mountains';
const detection = mediaToolDetector.detect(message);

console.log(detection);
// {
//   toolType: 'imagen',
//   confidence: 0.8,
//   extractedPrompt: 'a sunset over mountains',
//   suggestedParams: { aspectRatio: undefined }
// }
```

### Detection Keywords

**Images:**

- "create image/picture/photo"
- "generate image/picture/photo"
- "make image/picture/photo"
- "draw image/picture"
- "show me an image/picture"
- "visualize", "illustrate"

**Videos:**

- "create video/animation/clip"
- "generate video/animation/clip"
- "make video/animation/clip"
- "show me a video"
- "animate"

### Parameter Extraction

Users can specify parameters in natural language:

```typescript
const message = 'Create 3 images of cats in 16:9 portrait style';
const info = mediaToolDetector.extractMediaInfo(message);

console.log(info);
// {
//   shouldGenerate: true,
//   toolType: 'imagen',
//   prompt: 'cats',
//   params: {
//     numberOfImages: 3,
//     aspectRatio: '16:9'
//   }
// }
```

### Using the Hook

```typescript
import { useMediaGeneration } from '@core/integrations/media-generation-example';

function ChatComponent() {
  const {
    handleMessage,
    generatedMedia,
    isGenerating,
    currentProgress,
  } = useMediaGeneration({
    onProgress: (progress, status) => {
      console.log(`${status}: ${progress}%`);
    },
    onSuccess: (result) => {
      console.log('Generated:', result);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const onSendMessage = async (message: string) => {
    // Automatically handles media generation if detected
    const result = await handleMessage(message);

    if (result) {
      // Media was generated
      displayMedia(result);
    } else {
      // Normal chat message
      sendToLLM(message);
    }
  };

  return (
    <div>
      {isGenerating && (
        <div>Generating... {currentProgress}%</div>
      )}
      {generatedMedia.map((media) => (
        <MediaPreview key={media.id} media={media} />
      ))}
    </div>
  );
}
```

## UI Components

### Image Preview

```typescript
import { GeneratedImagePreview } from '@shared/components/media/GeneratedImagePreview';

<GeneratedImagePreview
  imageUrl={result.images[0].url}
  prompt={result.prompt}
  model={result.model}
  metadata={{
    aspectRatio: result.metadata.aspectRatio,
    seed: result.metadata.seed,
  }}
  onDownload={() => console.log('Downloaded')}
/>
```

### Multiple Images Grid

```typescript
import { GeneratedImagesGrid } from '@shared/components/media/GeneratedImagePreview';

<GeneratedImagesGrid
  images={result.images.map(img => ({
    url: img.url,
    prompt: result.prompt,
    model: result.model,
  }))}
/>
```

### Video Preview

```typescript
import { GeneratedVideoPreview } from '@shared/components/media/GeneratedVideoPreview';

<GeneratedVideoPreview
  videoUrl={result.video.url}
  thumbnailUrl={result.thumbnail?.url}
  prompt={result.prompt}
  model={result.model}
  metadata={{
    resolution: result.metadata.resolution,
    duration: result.metadata.duration,
    fps: result.metadata.fps,
    hasAudio: result.metadata.hasAudio,
  }}
  isGenerating={false}
  progress={0}
  onDownload={() => console.log('Downloaded')}
/>
```

### During Generation

```typescript
<GeneratedVideoPreview
  videoUrl=""
  prompt="Generating..."
  isGenerating={true}
  progress={currentProgress}
/>
```

## API Reference

### GoogleImagenService

```typescript
class GoogleImagenService {
  // Check availability
  isAvailable(): boolean;

  // Generate image
  generateImage(
    request: ImagenGenerationRequest
  ): Promise<ImagenGenerationResponse>;

  // Enhance prompt
  enhancePrompt(prompt: string): Promise<string>;

  // Download image
  downloadImage(imageUrl: string, filename?: string): Promise<void>;

  // Validate prompt
  validatePrompt(prompt: string): { valid: boolean; error?: string };

  // Get available models
  getAvailableModels(): Array<{
    id: string;
    name: string;
    description: string;
    pricing: number;
  }>;

  // Get supported aspect ratios
  getSupportedAspectRatios(): string[];
}
```

### GoogleVeoService

```typescript
class GoogleVeoService {
  // Check availability
  isAvailable(): boolean;

  // Generate video
  generateVideo(
    request: VeoGenerationRequest,
    onProgress?: (progress: number, status: string) => void
  ): Promise<VeoGenerationResponse>;

  // Enhance prompt
  enhancePrompt(prompt: string): Promise<string>;

  // Download video
  downloadVideo(videoUrl: string, filename?: string): Promise<void>;

  // Validate prompt
  validatePrompt(prompt: string): { valid: boolean; error?: string };

  // Get available models
  getAvailableModels(): Array<{
    id: string;
    name: string;
    description: string;
    features: string[];
  }>;

  // Get supported resolutions
  getSupportedResolutions(): string[];

  // Get supported aspect ratios
  getSupportedAspectRatios(): string[];
}
```

### MediaToolDetector

```typescript
class MediaToolDetector {
  // Detect media type from message
  detect(message: string): MediaToolDetectionResult;

  // Check if message is media request
  isMediaGenerationRequest(message: string): boolean;

  // Get suggested tool type
  getSuggestedToolType(message: string): MediaToolType;

  // Extract all media info
  extractMediaInfo(message: string): {
    shouldGenerate: boolean;
    toolType: MediaToolType;
    prompt: string;
    params: object;
  };

  // Get help message
  getHelpMessage(): string;
}
```

## Examples

### Example 1: Simple Image Generation

```typescript
import { mediaGenerationService } from '@core/integrations/media-generation-handler';

async function generateImage() {
  const result = await mediaGenerationService.generateImage({
    prompt: 'A robot playing chess',
    aspectRatio: '1:1',
  });

  return result.url;
}
```

### Example 2: Video with Progress

```typescript
import { googleVeoService } from '@core/integrations/google-veo-service';
import { useState } from 'react';

function VideoGenerator() {
  const [progress, setProgress] = useState(0);

  const generate = async () => {
    const result = await googleVeoService.generateVideo(
      {
        prompt: 'A butterfly landing on a flower',
        resolution: '1080p',
      },
      (prog, status) => {
        setProgress(prog);
        console.log(status);
      }
    );

    return result;
  };

  return <div>Progress: {progress}%</div>;
}
```

### Example 3: Chat Integration

```typescript
import { mediaToolDetector } from '@core/integrations/media-tool-detector';
import { generateMediaFromMessage } from '@core/integrations/media-generation-example';

async function handleChatMessage(message: string) {
  // Check if it's a media request
  if (mediaToolDetector.isMediaGenerationRequest(message)) {
    const media = await generateMediaFromMessage(message);
    return { type: 'media', content: media };
  }

  // Normal chat
  const response = await sendToLLM(message);
  return { type: 'text', content: response };
}
```

## Troubleshooting

### API Key Issues

**Error:** "Google API key not configured"

**Solution:**

1. Get key from https://aistudio.google.com/app/apikey
2. Add to `.env`: `VITE_GOOGLE_API_KEY=your-key-here`
3. Restart dev server

### Quota Exceeded

**Error:** "quota exceeded"

**Solution:**

- Check usage at https://aistudio.google.com
- Upgrade to paid plan if needed
- Wait for quota reset (daily/monthly)

### Safety Filter Blocks

**Error:** "Content was blocked by safety filters"

**Solution:**

- Modify prompt to avoid triggering filters
- Use less specific or controversial content
- Check Google's content policies

### Video Generation Timeout

**Error:** "Video generation timed out"

**Solution:**

- Check internet connection
- Try simpler prompt
- Retry the request
- Check Google AI Studio status

### CORS Errors (Development)

If you encounter CORS errors in development:

1. Use Netlify Functions proxy (production setup)
2. Or enable demo mode: `VITE_DEMO_MODE=true`

## Best Practices

1. **Prompt Engineering**
   - Be specific and descriptive
   - Include style, mood, lighting details
   - Use the prompt enhancement feature

2. **Error Handling**
   - Always wrap in try-catch
   - Provide user-friendly error messages
   - Log errors for debugging

3. **Performance**
   - Show progress indicators for videos
   - Cache generated media
   - Use appropriate quality settings

4. **Cost Optimization**
   - Use Fast model for prototyping
   - Cache enhanced prompts
   - Implement user quotas

5. **User Experience**
   - Show generation progress
   - Allow cancellation (future feature)
   - Provide download options
   - Display metadata

## Support

- Documentation: https://ai.google.dev/
- API Reference: https://cloud.google.com/vertex-ai/
- GitHub Issues: [Repository Issues]
- Discord: [Community Discord]

## License

See project LICENSE file.
