/**
 * Chat Tool Router
 * Analyzes user messages and routes to appropriate tools
 * Handles image generation, video generation, document creation, web search, multi-agent tasks, social media analysis, and more
 */

import {
  mediaGenerationService,
  type ImageGenerationRequest,
  type VideoGenerationRequest,
  type MediaGenerationResult,
} from '@core/integrations/media-generation-handler';
import {
  documentGenerationService,
  type DocumentRequest,
  type GeneratedDocument,
} from './document-generation-service';
import {
  webSearch,
  type SearchResponse,
} from '@core/integrations/web-search-handler';
import {
  multiAgentCollaborationService,
  type CollaborationResult,
} from './multi-agent-collaboration-service';
import {
  socialMediaAnalyzer,
  type SocialMediaAnalysisResult,
  type SocialMediaQuery,
} from '@core/integrations/social-media-analyzer';

export type ToolType =
  | 'image-generation'
  | 'video-generation'
  | 'document-creation'
  | 'web-search'
  | 'multi-agent'
  | 'social-media-analysis'
  | 'code-generation'
  | 'general-chat';

export interface ToolDetectionResult {
  tools: ToolType[];
  confidence: number;
  reasoning: string;
  suggestedRoute?: '/vibe' | '/mission-control';
}

export interface ToolExecutionResult {
  toolType: ToolType;
  status: 'success' | 'failed' | 'processing';
  data?:
    | MediaGenerationResult
    | GeneratedDocument
    | SearchResponse
    | CollaborationResult
    | SocialMediaAnalysisResult
    | unknown;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    duration?: number;
    cost?: number;
  };
}

export interface ToolRouterResult {
  detectedTools: ToolType[];
  executionResults: ToolExecutionResult[];
  reasoning: string;
  suggestedRoute?: '/vibe' | '/mission-control';
  shouldContinueToLLM: boolean;
  enhancedContext?: string;
}

/**
 * Analyzes user message to detect required tools
 */
export function analyzeMessage(message: string): ToolDetectionResult {
  const messageLower = message.toLowerCase();
  const detectedTools: ToolType[] = [];
  let confidence = 0;
  const reasons: string[] = [];

  // Image generation detection
  const imageKeywords = [
    'generate image',
    'create image',
    'make image',
    'draw',
    'picture of',
    'generate a picture',
    'create a picture',
    'make a picture',
    'visualize',
    'illustration',
    'artwork',
    'render',
    'design an image',
    'generate photo',
    'create photo',
    'make photo',
    'imagen',
    'dall-e',
    'image of',
    'picture showing',
    'visual of',
    'graphic of',
  ];

  const hasImageRequest = imageKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  if (hasImageRequest) {
    detectedTools.push('image-generation');
    confidence += 30;
    reasons.push('Image generation keywords detected');
  }

  // Video generation detection
  const videoKeywords = [
    'generate video',
    'create video',
    'make video',
    'video of',
    'animate',
    'animation',
    'movie',
    'clip',
    'footage',
    'generate a video',
    'create a video',
    'make a video',
    'video showing',
    'veo',
    'video clip',
    'motion',
    'cinematic',
  ];

  const hasVideoRequest = videoKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  if (hasVideoRequest) {
    detectedTools.push('video-generation');
    confidence += 30;
    reasons.push('Video generation keywords detected');
  }

  // Document creation detection
  const documentKeywords = [
    'create document',
    'write document',
    'generate document',
    'write report',
    'create report',
    'generate report',
    'write article',
    'create article',
    'write proposal',
    'draft proposal',
    'write summary',
    'create summary',
    'write documentation',
    'create documentation',
    'generate pdf',
    'create pdf',
    'make a document',
    'compose document',
    'draft document',
    'prepare document',
  ];

  const hasDocumentRequest = documentKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  if (hasDocumentRequest) {
    detectedTools.push('document-creation');
    confidence += 25;
    reasons.push('Document creation keywords detected');
  }

  // Web search detection
  const searchKeywords = [
    'search for',
    'find information',
    'look up',
    'what is the latest',
    'current',
    'recent news',
    'latest news',
    "today's",
    'what happened',
    'real-time',
    'live data',
    'up to date',
    'what are the current',
    'tell me about recent',
    'search the web',
    'google',
    'find out',
    'research',
  ];

  const hasSearchRequest = searchKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  const hasDateReference =
    /\b(today|yesterday|this week|this month|2024|2025)\b/.test(messageLower);

  if (hasSearchRequest || hasDateReference) {
    detectedTools.push('web-search');
    confidence += 20;
    reasons.push('Web search needed for current/recent information');
  }

  // Social media analysis detection (Grok-powered)
  const socialMediaKeywords = [
    'social media',
    'twitter',
    'x.com',
    'what people think',
    'public opinion',
    'sentiment',
    'trending',
    'viral',
    "what's trending",
    'twitter sentiment',
    'what are people saying',
    'social reaction',
    'twitter reaction',
    'how is the public reacting',
    'social media response',
    'online discussion',
    'twitter discussion',
    'x discussion',
    'tweets about',
    'hashtag',
    'influencers',
    'social media influencers',
    'twitter influencers',
    'online sentiment',
    'social sentiment',
    'public perception',
    "what's the buzz",
    'social buzz',
    'reddit discussion',
    'linkedin discussion',
    'analyze social media',
    'analyze twitter',
    'analyze sentiment',
  ];

  const hasSocialMediaRequest = socialMediaKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  if (hasSocialMediaRequest) {
    detectedTools.push('social-media-analysis');
    confidence += 30;
    reasons.push(
      'Social media analysis required - using Grok for real-time X/Twitter data'
    );
  }

  // Multi-agent collaboration detection
  const complexityKeywords = [
    'build',
    'create',
    'develop',
    'design',
    'implement',
    'architect',
    'system',
    'platform',
    'application',
    'full',
    'complete',
    'entire',
    'comprehensive',
    'end-to-end',
    'full-stack',
    'production-ready',
    'frontend and backend',
    'ui and api',
    'design and code',
  ];

  const hasComplexRequest =
    complexityKeywords.filter((keyword) => messageLower.includes(keyword))
      .length >= 2;
  const isLongRequest = message.split(/\s+/).length > 40;

  if (hasComplexRequest || isLongRequest) {
    detectedTools.push('multi-agent');
    confidence += 25;
    reasons.push('Complex task requiring multiple expert perspectives');
  }

  // Code generation detection (suggest /vibe)
  const codeKeywords = [
    'write code',
    'create code',
    'generate code',
    'implement',
    'function',
    'class',
    'component',
    'algorithm',
    'script',
    'build a',
    'create a',
    'make a',
    'develop a',
    'react component',
    'typescript',
    'javascript',
    'python',
    'api endpoint',
    'database schema',
    'sql query',
  ];

  const hasCodeRequest = codeKeywords.some((keyword) =>
    messageLower.includes(keyword)
  );
  if (hasCodeRequest && !hasImageRequest && !hasVideoRequest) {
    detectedTools.push('code-generation');
    confidence += 15;
    reasons.push(
      'Code generation detected - consider using /vibe for better experience'
    );
  }

  // Default to general chat if no specific tools detected
  if (detectedTools.length === 0) {
    detectedTools.push('general-chat');
    confidence = 100;
    reasons.push('General conversation - no specific tools required');
  }

  // Determine suggested route
  let suggestedRoute: '/vibe' | '/mission-control' | undefined;
  if (
    detectedTools.includes('code-generation') &&
    !hasImageRequest &&
    !hasVideoRequest
  ) {
    suggestedRoute = '/vibe';
  } else if (
    detectedTools.includes('multi-agent') ||
    (hasComplexRequest && isLongRequest)
  ) {
    suggestedRoute = '/mission-control';
  }

  return {
    tools: detectedTools,
    confidence: Math.min(confidence, 100),
    reasoning: reasons.join('; '),
    suggestedRoute,
  };
}

/**
 * Executes image generation
 */
async function executeImageGeneration(
  message: string,
  onProgress?: (status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Generating image...');

    // Parse image request from message
    const request: ImageGenerationRequest = {
      prompt: message,
      quality:
        message.toLowerCase().includes('high quality') ||
        message.toLowerCase().includes('hd')
          ? 'hd'
          : 'standard',
      numberOfImages: 1,
      aspectRatio: parseAspectRatio(message),
    };

    const result = await mediaGenerationService.generateImage(request);

    return {
      toolType: 'image-generation',
      status: 'success',
      data: result,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    };
  } catch (error) {
    return {
      toolType: 'image-generation',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Image generation failed',
    };
  }
}

/**
 * Executes video generation
 */
async function executeVideoGeneration(
  message: string,
  onProgress?: (progress: number, status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Generating video...', 0);

    // Parse video request from message
    const request: VideoGenerationRequest = {
      prompt: message,
      duration: parseDuration(message),
      resolution: parseResolution(message),
      aspectRatio: parseAspectRatio(message) as '16:9' | '9:16' | '1:1' | '4:3',
    };

    const result = await mediaGenerationService.generateVideo(
      request,
      (progress, status) => onProgress?.(progress, status)
    );

    return {
      toolType: 'video-generation',
      status: 'success',
      data: result,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    };
  } catch (error) {
    return {
      toolType: 'video-generation',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Video generation failed',
    };
  }
}

/**
 * Executes document generation
 */
async function executeDocumentGeneration(
  message: string,
  userId?: string,
  sessionId?: string,
  onProgress?: (status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Generating document...');

    const request = documentGenerationService.parseDocumentRequest(message);
    const result = await documentGenerationService.generateDocument(
      request,
      userId,
      sessionId
    );

    return {
      toolType: 'document-creation',
      status: 'success',
      data: result,
      metadata: {
        tokensUsed: result.metadata.tokensUsed,
      },
    };
  } catch (error) {
    return {
      toolType: 'document-creation',
      status: 'failed',
      error:
        error instanceof Error ? error.message : 'Document generation failed',
    };
  }
}

/**
 * Executes web search
 */
async function executeWebSearch(
  message: string,
  onProgress?: (status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Searching the web...');

    const result = await webSearch(message, 10);

    return {
      toolType: 'web-search',
      status: 'success',
      data: result,
    };
  } catch (error) {
    return {
      toolType: 'web-search',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Web search failed',
    };
  }
}

/**
 * Executes social media analysis using Grok
 */
async function executeSocialMediaAnalysis(
  message: string,
  userId?: string,
  onProgress?: (status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Analyzing social media with Grok...');

    // Extract topic from message
    const topic = message
      .replace(
        /analyze\s+(social\s+media|twitter|sentiment)\s+(about|for|on)?\s*/i,
        ''
      )
      .trim();

    // Build query
    const query: SocialMediaQuery = {
      topic: topic || message,
      platforms: ['twitter', 'x'],
      timeframe: '24h',
      analysisType: ['all'], // sentiment, trends, influencers
    };

    // Detect specific requests
    if (message.toLowerCase().includes('sentiment')) {
      query.analysisType = ['sentiment'];
    } else if (
      message.toLowerCase().includes('trending') ||
      message.toLowerCase().includes('trends')
    ) {
      query.analysisType = ['trends'];
    } else if (message.toLowerCase().includes('influencers')) {
      query.analysisType = ['influencers'];
    }

    // Detect timeframe
    if (
      message.toLowerCase().includes('last hour') ||
      message.toLowerCase().includes('past hour')
    ) {
      query.timeframe = '1h';
    } else if (
      message.toLowerCase().includes('today') ||
      message.toLowerCase().includes('24 hours')
    ) {
      query.timeframe = '24h';
    } else if (
      message.toLowerCase().includes('this week') ||
      message.toLowerCase().includes('7 days')
    ) {
      query.timeframe = '7d';
    } else if (
      message.toLowerCase().includes('this month') ||
      message.toLowerCase().includes('30 days')
    ) {
      query.timeframe = '30d';
    }

    const result = await socialMediaAnalyzer.analyze(query, userId);

    return {
      toolType: 'social-media-analysis',
      status: 'success',
      data: result,
      metadata: {
        tokensUsed: result.metadata.dataSourcesCount * 100, // Estimate
        duration: 0,
        cost: 0,
      },
    };
  } catch (error) {
    return {
      toolType: 'social-media-analysis',
      status: 'failed',
      error:
        error instanceof Error ? error.message : 'Social media analysis failed',
    };
  }
}

/**
 * Executes multi-agent collaboration
 */
async function executeMultiAgentCollaboration(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onProgress?: (status: string) => void
): Promise<ToolExecutionResult> {
  try {
    onProgress?.('Coordinating AI team...');

    const result = await multiAgentCollaborationService.collaborate(
      message,
      conversationHistory
    );

    return {
      toolType: 'multi-agent',
      status: 'success',
      data: result,
      metadata: {
        tokensUsed: result.metadata.totalTokens,
        duration: result.metadata.duration,
      },
    };
  } catch (error) {
    return {
      toolType: 'multi-agent',
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
          : 'Multi-agent collaboration failed',
    };
  }
}

/**
 * Main router function that analyzes and executes appropriate tools
 */
export async function routeAndExecuteTools(
  message: string,
  options?: {
    userId?: string;
    sessionId?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    onProgress?: (
      toolType: ToolType,
      status: string,
      progress?: number
    ) => void;
  }
): Promise<ToolRouterResult> {
  const startTime = Date.now();

  // Step 1: Analyze message to detect required tools
  const detection = analyzeMessage(message);
  const executionResults: ToolExecutionResult[] = [];

  // Step 2: Execute detected tools
  for (const toolType of detection.tools) {
    switch (toolType) {
      case 'image-generation': {
        const imageResult = await executeImageGeneration(message, (status) =>
          options?.onProgress?.(toolType, status)
        );
        executionResults.push(imageResult);
        break;
      }

      case 'video-generation': {
        const videoResult = await executeVideoGeneration(
          message,
          (progress, status) =>
            options?.onProgress?.(toolType, status, progress)
        );
        executionResults.push(videoResult);
        break;
      }

      case 'document-creation': {
        const docResult = await executeDocumentGeneration(
          message,
          options?.userId,
          options?.sessionId,
          (status) => options?.onProgress?.(toolType, status)
        );
        executionResults.push(docResult);
        break;
      }

      case 'web-search': {
        const searchResult = await executeWebSearch(message, (status) =>
          options?.onProgress?.(toolType, status)
        );
        executionResults.push(searchResult);
        break;
      }

      case 'social-media-analysis': {
        const socialResult = await executeSocialMediaAnalysis(
          message,
          options?.userId,
          (status) => options?.onProgress?.(toolType, status)
        );
        executionResults.push(socialResult);
        break;
      }

      case 'multi-agent': {
        const multiAgentResult = await executeMultiAgentCollaboration(
          message,
          options?.conversationHistory || [],
          (status) => options?.onProgress?.(toolType, status)
        );
        executionResults.push(multiAgentResult);
        break;
      }

      case 'code-generation':
        // For code generation, just note it but continue to LLM
        // The UI will show a suggestion to use /vibe
        break;

      case 'general-chat':
        // No tool execution needed, will continue to LLM
        break;
    }
  }

  // Step 3: Build enhanced context from tool results
  let enhancedContext = '';
  const successfulResults = executionResults.filter(
    (r) => r.status === 'success'
  );

  if (successfulResults.length > 0) {
    enhancedContext = '\n\n--- Tool Results ---\n';

    for (const result of successfulResults) {
      if (result.toolType === 'web-search' && result.data) {
        const searchData = result.data as SearchResponse;
        enhancedContext += `\nWeb Search Results for "${searchData.query}":\n`;
        searchData.results.slice(0, 5).forEach((r, i) => {
          enhancedContext += `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}\n`;
        });
        if (searchData.answer) {
          enhancedContext += `\nAI Summary: ${searchData.answer}\n`;
        }
      } else if (result.toolType === 'image-generation' && result.data) {
        const imageData = result.data as MediaGenerationResult;
        enhancedContext += `\nImage generated: ${imageData.prompt}\n`;
        enhancedContext += `URL: ${imageData.url}\n`;
      } else if (result.toolType === 'video-generation' && result.data) {
        const videoData = result.data as MediaGenerationResult;
        enhancedContext += `\nVideo generated: ${videoData.prompt}\n`;
        enhancedContext += `Duration: ${videoData.metadata.duration}s\n`;
      } else if (result.toolType === 'document-creation' && result.data) {
        const docData = result.data as GeneratedDocument;
        enhancedContext += `\nDocument created: ${docData.title}\n`;
        enhancedContext += `Word count: ${docData.metadata.wordCount}\n`;
      } else if (result.toolType === 'social-media-analysis' && result.data) {
        const socialData = result.data as SocialMediaAnalysisResult;
        enhancedContext += `\nSocial Media Analysis for "${socialData.query.topic}":\n`;
        enhancedContext += `Summary: ${socialData.summary}\n\n`;

        if (socialData.sentiment) {
          enhancedContext += `Sentiment Analysis:\n`;
          enhancedContext += `  Overall: ${socialData.sentiment.overall}\n`;
          enhancedContext += `  Positive: ${socialData.sentiment.scores.positive}%\n`;
          enhancedContext += `  Negative: ${socialData.sentiment.scores.negative}%\n`;
          enhancedContext += `  Neutral: ${socialData.sentiment.scores.neutral}%\n\n`;
        }

        if (socialData.trends && socialData.trends.trending.length > 0) {
          enhancedContext += `Trending Topics:\n`;
          socialData.trends.trending.slice(0, 5).forEach((trend, i) => {
            enhancedContext += `  ${i + 1}. ${trend.topic} (${trend.growth}, volume: ${trend.volume})\n`;
          });
          enhancedContext += '\n';
        }

        if (
          socialData.influencers &&
          socialData.influencers.topInfluencers.length > 0
        ) {
          enhancedContext += `Top Influencers:\n`;
          socialData.influencers.topInfluencers
            .slice(0, 3)
            .forEach((inf, i) => {
              enhancedContext += `  ${i + 1}. @${inf.username} (${inf.followers.toLocaleString()} followers, ${inf.relevance} relevance)\n`;
            });
          enhancedContext += '\n';
        }

        if (socialData.insights.length > 0) {
          enhancedContext += `Key Insights:\n`;
          socialData.insights.forEach((insight, i) => {
            enhancedContext += `  ${i + 1}. ${insight}\n`;
          });
        }
      }
    }
  }

  // Step 4: Determine if should continue to LLM
  const shouldContinueToLLM =
    detection.tools.includes('general-chat') ||
    detection.tools.includes('code-generation') ||
    detection.tools.includes('web-search') || // Continue to LLM to synthesize search results
    detection.tools.includes('social-media-analysis') || // Continue to LLM to synthesize social media analysis
    executionResults.some((r) => r.status === 'failed'); // Continue if any tool failed

  return {
    detectedTools: detection.tools,
    executionResults,
    reasoning: detection.reasoning,
    suggestedRoute: detection.suggestedRoute,
    shouldContinueToLLM,
    enhancedContext,
  };
}

/**
 * Helper: Parse aspect ratio from message
 */
function parseAspectRatio(
  message: string
): '1:1' | '16:9' | '9:16' | '4:3' | '3:4' {
  const messageLower = message.toLowerCase();
  if (
    messageLower.includes('16:9') ||
    messageLower.includes('widescreen') ||
    messageLower.includes('landscape')
  ) {
    return '16:9';
  } else if (
    messageLower.includes('9:16') ||
    messageLower.includes('portrait') ||
    messageLower.includes('vertical')
  ) {
    return '9:16';
  } else if (messageLower.includes('4:3')) {
    return '4:3';
  } else if (messageLower.includes('3:4')) {
    return '3:4';
  }
  return '1:1'; // default square
}

/**
 * Helper: Parse video duration from message
 */
function parseDuration(message: string): number {
  const match = message.match(/(\d+)\s*(?:second|sec|s)\b/i);
  if (match) {
    return Math.min(parseInt(match[1]), 30); // Max 30 seconds
  }
  return 8; // default 8 seconds
}

/**
 * Helper: Parse video resolution from message
 */
function parseResolution(message: string): '720p' | '1080p' | '4k' {
  const messageLower = message.toLowerCase();
  if (messageLower.includes('4k') || messageLower.includes('ultra hd')) {
    return '4k';
  } else if (
    messageLower.includes('1080p') ||
    messageLower.includes('full hd') ||
    messageLower.includes('hd')
  ) {
    return '1080p';
  }
  return '720p'; // default
}

/**
 * Check if any tool is available
 */
export function isToolAvailable(toolType: ToolType): boolean {
  switch (toolType) {
    case 'image-generation':
      return mediaGenerationService.isServiceAvailable().imagen;
    case 'video-generation':
      return mediaGenerationService.isServiceAvailable().veo;
    case 'document-creation':
      return true; // Always available via Claude
    case 'web-search':
      return true; // Always available (DuckDuckGo fallback)
    case 'multi-agent':
      return true; // Always available
    case 'code-generation':
      return true; // Always available
    case 'general-chat':
      return true; // Always available
    default:
      return false;
  }
}

/**
 * Get tool status summary
 */
export function getToolStatus(): Record<ToolType, boolean> {
  return {
    'image-generation': isToolAvailable('image-generation'),
    'video-generation': isToolAvailable('video-generation'),
    'document-creation': isToolAvailable('document-creation'),
    'web-search': isToolAvailable('web-search'),
    'multi-agent': isToolAvailable('multi-agent'),
    'code-generation': isToolAvailable('code-generation'),
    'general-chat': isToolAvailable('general-chat'),
  };
}

// Export singleton-style service
export const chatToolRouter = {
  analyzeMessage,
  routeAndExecuteTools,
  isToolAvailable,
  getToolStatus,
};
