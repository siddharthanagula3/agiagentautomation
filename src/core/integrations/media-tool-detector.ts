/**
 * Media Tool Detector
 * Detects when users want to generate images or videos in chat
 * and routes requests to appropriate Google AI Studio services
 */

export type MediaToolType = 'imagen' | 'veo' | 'none';

export interface MediaToolDetectionResult {
  toolType: MediaToolType;
  confidence: number; // 0-1
  extractedPrompt?: string;
  suggestedParams?: {
    aspectRatio?: string;
    resolution?: string;
    numberOfImages?: number;
    duration?: number;
    style?: string;
  };
}

/**
 * Keywords and patterns for detecting media generation requests
 */
const IMAGE_KEYWORDS = [
  'create image',
  'generate image',
  'make image',
  'draw image',
  'create picture',
  'generate picture',
  'make picture',
  'draw picture',
  'create photo',
  'generate photo',
  'make photo',
  'create illustration',
  'generate illustration',
  'make illustration',
  'create artwork',
  'generate artwork',
  'make artwork',
  'show me an image',
  'show me a picture',
  'visualize',
  'illustrate',
  'design an image',
  'design a picture',
];

const VIDEO_KEYWORDS = [
  'create video',
  'generate video',
  'make video',
  'create animation',
  'generate animation',
  'make animation',
  'create clip',
  'generate clip',
  'make clip',
  'create movie',
  'generate movie',
  'make movie',
  'show me a video',
  'show me an animation',
  'animate',
  'create cinematic',
  'generate cinematic',
];

const ASPECT_RATIO_PATTERNS = [
  { pattern: /\b(square|1:1|1x1)\b/i, value: '1:1' },
  { pattern: /\b(portrait|9:16|9x16|vertical)\b/i, value: '9:16' },
  { pattern: /\b(landscape|16:9|16x9|horizontal|widescreen)\b/i, value: '16:9' },
  { pattern: /\b(4:3|4x3)\b/i, value: '4:3' },
  { pattern: /\b(3:4|3x4)\b/i, value: '3:4' },
];

const RESOLUTION_PATTERNS = [
  { pattern: /\b720p\b/i, value: '720p' },
  { pattern: /\b1080p\b/i, value: '1080p' },
  { pattern: /\b4k\b/i, value: '4k' },
  { pattern: /\bhd\b/i, value: '1080p' },
];

const STYLE_PATTERNS = [
  { pattern: /\b(realistic|photorealistic|photo)\b/i, value: 'realistic' },
  { pattern: /\b(artistic|art|painting)\b/i, value: 'artistic' },
  { pattern: /\b(cartoon|animated)\b/i, value: 'cartoon' },
  { pattern: /\banime\b/i, value: 'anime' },
  { pattern: /\b(cinematic|movie|film)\b/i, value: 'cinematic' },
  { pattern: /\bdocumentary\b/i, value: 'documentary' },
];

const NUMBER_PATTERNS = [
  { pattern: /\b(\d+)\s*(images?|pictures?|photos?)\b/i, type: 'numberOfImages' },
  { pattern: /\b(\d+)\s*seconds?\b/i, type: 'duration' },
];

export class MediaToolDetector {
  private static instance: MediaToolDetector;

  private constructor() {}

  static getInstance(): MediaToolDetector {
    if (!MediaToolDetector.instance) {
      MediaToolDetector.instance = new MediaToolDetector();
    }
    return MediaToolDetector.instance;
  }

  /**
   * Detect if user wants to generate media and which type
   */
  detect(message: string): MediaToolDetectionResult {
    const lowerMessage = message.toLowerCase();

    // Check for image generation keywords
    const imageMatches = IMAGE_KEYWORDS.filter((keyword) =>
      lowerMessage.includes(keyword)
    );

    // Check for video generation keywords
    const videoMatches = VIDEO_KEYWORDS.filter((keyword) =>
      lowerMessage.includes(keyword)
    );

    // Determine tool type and confidence
    let toolType: MediaToolType = 'none';
    let confidence = 0;

    if (imageMatches.length > 0 && videoMatches.length === 0) {
      toolType = 'imagen';
      confidence = Math.min(0.5 + imageMatches.length * 0.15, 0.95);
    } else if (videoMatches.length > 0 && imageMatches.length === 0) {
      toolType = 'veo';
      confidence = Math.min(0.5 + videoMatches.length * 0.15, 0.95);
    } else if (imageMatches.length > 0 && videoMatches.length > 0) {
      // Both keywords present - prefer video if explicitly mentioned
      if (videoMatches.length > imageMatches.length) {
        toolType = 'veo';
        confidence = 0.7;
      } else {
        toolType = 'imagen';
        confidence = 0.7;
      }
    }

    if (toolType === 'none') {
      return { toolType: 'none', confidence: 0 };
    }

    // Extract prompt (remove the command keywords)
    const extractedPrompt = this.extractPrompt(message, toolType);

    // Extract suggested parameters
    const suggestedParams = this.extractParameters(message, toolType);

    return {
      toolType,
      confidence,
      extractedPrompt,
      suggestedParams,
    };
  }

  /**
   * Extract the actual prompt from the message
   */
  private extractPrompt(message: string, toolType: MediaToolType): string {
    let prompt = message;

    // Remove common command prefixes
    const commandPrefixes = [
      /^(please\s+)?create\s+(an?\s+)?(image|picture|photo|video|animation|clip)\s+(of\s+)?/i,
      /^(please\s+)?generate\s+(an?\s+)?(image|picture|photo|video|animation|clip)\s+(of\s+)?/i,
      /^(please\s+)?make\s+(an?\s+)?(image|picture|photo|video|animation|clip)\s+(of\s+)?/i,
      /^(please\s+)?draw\s+(an?\s+)?(image|picture|photo)\s+(of\s+)?/i,
      /^(please\s+)?show\s+me\s+(an?\s+)?(image|picture|photo|video)\s+(of\s+)?/i,
      /^(please\s+)?visualize\s+/i,
      /^(please\s+)?illustrate\s+/i,
      /^(please\s+)?animate\s+/i,
    ];

    for (const pattern of commandPrefixes) {
      prompt = prompt.replace(pattern, '');
    }

    return prompt.trim();
  }

  /**
   * Extract parameters from the message
   */
  private extractParameters(
    message: string,
    toolType: MediaToolType
  ): MediaToolDetectionResult['suggestedParams'] {
    const params: MediaToolDetectionResult['suggestedParams'] = {};

    // Extract aspect ratio
    for (const { pattern, value } of ASPECT_RATIO_PATTERNS) {
      if (pattern.test(message)) {
        params.aspectRatio = value;
        break;
      }
    }

    // Extract resolution (for videos)
    if (toolType === 'veo') {
      for (const { pattern, value } of RESOLUTION_PATTERNS) {
        if (pattern.test(message)) {
          params.resolution = value;
          break;
        }
      }
    }

    // Extract style
    for (const { pattern, value } of STYLE_PATTERNS) {
      if (pattern.test(message)) {
        params.style = value;
        break;
      }
    }

    // Extract numbers (number of images or duration)
    for (const { pattern, type } of NUMBER_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (type === 'numberOfImages' && toolType === 'imagen') {
          params.numberOfImages = Math.min(number, 4); // Max 4 images
        } else if (type === 'duration' && toolType === 'veo') {
          params.duration = Math.min(number, 8); // Max 8 seconds for Veo 3.1
        }
      }
    }

    return params;
  }

  /**
   * Check if message is likely a media generation request
   */
  isMediaGenerationRequest(message: string): boolean {
    const result = this.detect(message);
    return result.toolType !== 'none' && result.confidence > 0.5;
  }

  /**
   * Get suggested tool type from message
   */
  getSuggestedToolType(message: string): MediaToolType {
    const result = this.detect(message);
    return result.confidence > 0.5 ? result.toolType : 'none';
  }

  /**
   * Extract all media generation info from message
   */
  extractMediaInfo(message: string): {
    shouldGenerate: boolean;
    toolType: MediaToolType;
    prompt: string;
    params: MediaToolDetectionResult['suggestedParams'];
  } {
    const detection = this.detect(message);
    return {
      shouldGenerate: detection.toolType !== 'none' && detection.confidence > 0.5,
      toolType: detection.toolType,
      prompt: detection.extractedPrompt || message,
      params: detection.suggestedParams || {},
    };
  }

  /**
   * Format a helpful message for users about media generation
   */
  getHelpMessage(): string {
    return (
      '**Media Generation Help**\n\n' +
      '**For Images:**\n' +
      '- "Create an image of a sunset over mountains"\n' +
      '- "Generate a picture of a futuristic city in 16:9"\n' +
      '- "Make 4 images of cute cats in cartoon style"\n\n' +
      '**For Videos:**\n' +
      '- "Create a video of waves crashing on a beach"\n' +
      '- "Generate an 8-second cinematic video of a forest"\n' +
      '- "Make a 720p animation of a flying drone"\n\n' +
      '**Supported Options:**\n' +
      '- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4\n' +
      '- Resolutions: 720p, 1080p (videos)\n' +
      '- Styles: realistic, artistic, cartoon, anime, cinematic\n' +
      '- Multiple images: specify "2 images", "3 pictures", etc. (max 4)\n' +
      '- Video duration: specify "5 seconds", "8 seconds", etc. (max 8)'
    );
  }
}

// Export singleton instance
export const mediaToolDetector = MediaToolDetector.getInstance();
