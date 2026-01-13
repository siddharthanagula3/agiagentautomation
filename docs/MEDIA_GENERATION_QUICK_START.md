# Google AI Studio Media Generation - Quick Start

## 🚀 5-Minute Setup

### 1. Get API Key (1 minute)

Visit https://aistudio.google.com/app/apikey and create a free API key.

### 2. Configure Environment (1 minute)

Add to `.env`:

```bash
# Client-side (for local development)
VITE_GOOGLE_API_KEY=your-api-key-here

# Server-side (for Netlify Functions - recommended)
GOOGLE_API_KEY=your-api-key-here
```

**Note:** For production, use server-side keys via Netlify Functions.

### 3. Test in Chat (3 minutes)

Restart dev server and try these commands in your chat:

**Images:**

```
Create an image of a sunset over mountains in 16:9
Generate 3 pictures of cute cats in cartoon style
Make a photorealistic image of a futuristic city
```

**Videos:**

```
Create a video of ocean waves crashing on a beach
Generate an 8-second cinematic video of a forest
Make a 720p animation of a flying drone
```

That's it! 🎉

---

## 📖 Code Examples

### Use in React Component

```typescript
// See google-imagen-service.ts and google-veo-service.ts for actual services
import { googleImagenService } from '@core/integrations/google-imagen-service';
import { googleVeoService } from '@core/integrations/google-veo-service';
import { GeneratedImagePreview } from '@shared/components/media/GeneratedImagePreview';
import { GeneratedVideoPreview } from '@shared/components/media/GeneratedVideoPreview';

function MyChat() {
  const { handleMessage, generatedMedia, isGenerating, currentProgress } = useMediaGeneration();

  const onSend = async (message: string) => {
    const media = await handleMessage(message);
    if (media) {
      console.log('Generated:', media);
    }
  };

  return (
    <div>
      {isGenerating && <div>Generating... {currentProgress}%</div>}

      {generatedMedia.map(media =>
        media.type === 'image' ? (
          <GeneratedImagePreview key={media.id} {...media} />
        ) : (
          <GeneratedVideoPreview key={media.id} {...media} />
        )
      )}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { googleImagenService } from '@core/integrations/google-imagen-service';

// Generate image
const result = await googleImagenService.generateImage({
  prompt: 'A futuristic city at sunset',
  aspectRatio: '16:9',
  model: 'imagen-4.0-generate-001',
});

console.log('Image URL:', result.images[0].url);
```

```typescript
import { googleVeoService } from '@core/integrations/google-veo-service';

// Generate video
const result = await googleVeoService.generateVideo(
  {
    prompt: 'Ocean waves at sunset',
    resolution: '1080p',
    duration: 8,
  },
  (progress, status) => console.log(`${progress}%: ${status}`)
);

console.log('Video URL:', result.video.url);
```

---

## 🎯 Common Use Cases

### Chat Integration

```typescript
import { mediaToolDetector } from '@core/integrations/media-tool-detector';

function handleUserMessage(message: string) {
  if (mediaToolDetector.isMediaGenerationRequest(message)) {
    return generateMedia(message);
  }
  return sendToLLM(message);
}
```

### Batch Generation

```typescript
const prompts = [
  'A sunrise over mountains',
  'A sunset over ocean',
  'A starry night sky',
];

for (const prompt of prompts) {
  const result = await googleImagenService.generateImage({ prompt });
  console.log('Generated:', result.id);
}
```

### Progress Tracking

```typescript
await googleVeoService.generateVideo(
  { prompt: 'Drone over forest' },
  (progress, status) => {
    updateProgressBar(progress);
    updateStatusText(status);
  }
);
```

---

## 💡 Tips & Tricks

### Better Prompts

```typescript
// Enhance prompts automatically
const enhanced = await googleImagenService.enhancePrompt('sunset');
// Returns: "A breathtaking sunset with vibrant colors..."
```

### Cost Control

```typescript
// Use Fast model for prototyping
model: 'imagen-4.0-fast-generate-001'; // $0.001 vs $0.002

// Use 720p for videos
resolution: '720p'; // $0.05 vs $0.08
```

### Download Images/Videos

```typescript
await googleImagenService.downloadImage(imageUrl, 'my-image.png');
await googleVeoService.downloadVideo(videoUrl, 'my-video.mp4');
```

---

## 🐛 Troubleshooting

| Issue                    | Solution                                   |
| ------------------------ | ------------------------------------------ |
| "API key not configured" | Add `VITE_GOOGLE_API_KEY` to `.env`        |
| "Quota exceeded"         | Check usage at https://aistudio.google.com |
| "Safety filter blocked"  | Modify prompt to avoid policy violations   |
| Video timeout            | Try simpler prompt or check network        |

---

## 📱 Supported Features

### Images (Imagen 4.0)

- ✅ Aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9
- ✅ Multiple images: 1-4 per request
- ✅ Quality: Standard, Ultra, Fast
- ✅ Negative prompts
- ✅ Seed control

### Videos (Veo 3.1)

- ✅ Resolutions: 720p, 1080p
- ✅ Duration: 5-8 seconds
- ✅ Native audio: Yes
- ✅ Aspect ratios: 16:9, 9:16, 1:1
- ✅ Progress tracking: Real-time

---

## 🔗 Links

- **Full Guide:** `/docs/MEDIA_GENERATION_GUIDE.md`
- **API Docs:** https://ai.google.dev/gemini-api/docs/imagen
- **Get API Key:** https://aistudio.google.com/app/apikey

---

## 🔒 Security

All media generation requests go through secure Netlify Functions with:

- JWT authentication via Supabase
- CORS origin whitelist (no wildcard `*`)
- Rate limiting with Upstash Redis
- Token balance enforcement

## 📅 Changelog

**v1.1.0 (Jan 2026)**

- Enhanced security with CORS origin whitelist
- JWT verification in rate limiter
- Token enforcement with pre-flight balance checks

**v1.0.0 (Nov 2025)**

- Initial Imagen 4.0 and Veo 3.1 integration

---

**Need help?** Check the full guide or open an issue on GitHub.
