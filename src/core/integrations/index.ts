/**
 * Integrations Module Index
 *
 * Central export point for all integration services.
 * Import integration services from this file for consistent access.
 *
 * @example
 * import {
 *   webSearch,
 *   mediaGenerationService,
 *   tokenLogger,
 *   websocketManager,
 *   socialMediaAnalyzer
 * } from '@core/integrations';
 */

// Chat Completion Handler
export {
  sendAIMessage,
  isProviderConfigured,
  getConfiguredProviders,
  type AIMessage,
  type AIProvider,
  type Provider,
} from './chat-completion-handler';

// Web Search Services
export {
  webSearch,
  searchWithPerplexity,
  searchWithGoogle,
  searchWithDuckDuckGo,
  searchAndSummarize,
  isWebSearchConfigured,
  getAvailableSearchProviders,
  type SearchResult,
  type SearchResponse,
} from './web-search-handler';

// Token Usage Tracking
export {
  tokenLogger,
  logTokenUsage,
  TokenLoggerService,
  type TokenLogEntry,
  type TokenUsageByModel,
  type SessionTokenSummary,
} from './token-usage-tracker';

// WebSocket Manager
export {
  websocketManager,
  WebSocketManager,
  WebSocketState,
  MessageType,
  type WebSocketMessage,
  type ConnectionConfig,
  type ConnectionMetrics,
  type WebSocketEventType,
  type WebSocketEvent,
} from './websocket-manager';

// Social Media Analyzer (Grok AI)
export {
  socialMediaAnalyzer,
  SocialMediaAnalyzer,
  type SocialMediaQuery,
  type SentimentAnalysis,
  type TrendAnalysis,
  type InfluencerAnalysis,
  type TopContent,
  type SocialMediaAnalysisResult,
} from './social-media-analyzer';

// DALL-E Image Service (OpenAI)
export {
  dallEImageService,
  DallEImageService,
  type DallEGenerationRequest,
  type DallEGenerationResponse,
  type ImageGenerationResult,
} from './dalle-image-service';

// Google Imagen Service
export {
  googleImagenService,
  GoogleImagenService,
  type ImagenGenerationRequest,
  type ImagenGenerationResponse,
  type ImagenServiceError,
} from './google-imagen-service';

// Google Veo Service (Video Generation)
export {
  googleVeoService,
  GoogleVeoService,
  type VeoGenerationRequest,
  type VeoGenerationResponse,
  type VeoServiceError,
} from './google-veo-service';

// Media Generation Handler (Unified)
export {
  mediaGenerationService,
  MediaGenerationService,
  type ImageGenerationRequest,
  type VideoGenerationRequest,
  type MediaGenerationResult,
  type MediaGenerationStats,
} from './media-generation-handler';

// Marketing Endpoints
export {
  // Contact Form
  submitContactForm,
  type ContactFormData,
  // Newsletter
  subscribeToNewsletter,
  type NewsletterData,
  // Blog
  getBlogPosts,
  getBlogCategories,
  type BlogPost,
  type BlogPostsParams,
  // Resources
  getResources,
  trackResourceDownload,
  type Resource,
  // Pricing
  getPricingPlans,
  type PricingPlan,
  // Help & Support
  getSupportCategories,
  getHelpArticles,
  getFAQItems,
  createSupportTicket,
  getUserTickets,
  type SupportCategory,
  type HelpArticle,
  type FAQItem,
  type SupportTicket,
} from './marketing-endpoints';
