/**
 * Supported Models Configuration
 * Single source of truth for all LLM model definitions
 *
 * IMPORTANT: Both frontend and backend import from this file to ensure consistency.
 * When adding/removing models, update this file only - changes propagate everywhere.
 *
 * Created: January 17, 2026
 */

// =============================================================================
// ANTHROPIC CLAUDE MODELS
// =============================================================================

export const SUPPORTED_ANTHROPIC_MODELS = [
  // Claude 4.5 models (latest - Jan 2026)
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  // Claude 4 models
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  // Claude 3.5 models (still supported)
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  // Claude 3 models (legacy, may deprecate)
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const;

export type AnthropicModel = (typeof SUPPORTED_ANTHROPIC_MODELS)[number];

export const DEFAULT_ANTHROPIC_MODEL: AnthropicModel =
  'claude-sonnet-4-5-20250929';

// =============================================================================
// OPENAI GPT MODELS
// =============================================================================

export const SUPPORTED_OPENAI_MODELS = [
  // GPT-5.x models (latest - Jan 2026)
  'gpt-5.2',
  'gpt-5.1',
  // GPT-4.x models
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4',
  // GPT-3.5 (legacy, still available)
  'gpt-3.5-turbo',
  // Reasoning models (o-series)
  'o3',
  'o3-mini',
  'o1',
  'o1-preview',
  'o1-mini',
] as const;

export type OpenAIModel = (typeof SUPPORTED_OPENAI_MODELS)[number];

export const DEFAULT_OPENAI_MODEL: OpenAIModel = 'gpt-4o';

// OpenAI specialized models (not for chat)
export const SUPPORTED_OPENAI_IMAGE_MODELS = [
  'gpt-image-1.5',
  'dall-e-3',
] as const;
export const SUPPORTED_OPENAI_VIDEO_MODELS = ['sora-2', 'sora-2-pro'] as const;
export const SUPPORTED_OPENAI_AUDIO_MODELS = [
  'gpt-4o-transcribe',
  'gpt-4o-mini-tts',
  'whisper-1',
  'tts-1-hd',
] as const;

// =============================================================================
// GOOGLE GEMINI MODELS
// =============================================================================

export const SUPPORTED_GOOGLE_MODELS = [
  // Gemini 3.x models (latest - Jan 2026)
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  // Gemini 2.x models
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  // Gemini 1.x models (legacy, still available)
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-pro',
] as const;

export type GoogleModel = (typeof SUPPORTED_GOOGLE_MODELS)[number];

export const DEFAULT_GOOGLE_MODEL: GoogleModel = 'gemini-2.0-flash';

// Google specialized models
export const SUPPORTED_GOOGLE_IMAGE_MODELS = [
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
  'imagen-4.0-fast-generate-001',
] as const;
export const SUPPORTED_GOOGLE_VIDEO_MODELS = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
  'veo-3.0-generate-001',
] as const;
export const SUPPORTED_GOOGLE_AUDIO_MODELS = [
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-2.5-pro-preview-tts',
  'gemini-2.5-flash-preview-tts',
] as const;

// =============================================================================
// PERPLEXITY SONAR MODELS
// =============================================================================

export const SUPPORTED_PERPLEXITY_MODELS = [
  // Sonar latest (Jan 2026)
  'sonar-pro',
  'sonar',
  'sonar-reasoning',
  'sonar-reasoning-pro',
  'sonar-deep-research',
  // Llama-based Sonar models (legacy naming)
  'llama-3.1-sonar-small-128k-online',
  'llama-3.1-sonar-large-128k-online',
  'llama-3.1-sonar-huge-128k-online',
] as const;

export type PerplexityModel = (typeof SUPPORTED_PERPLEXITY_MODELS)[number];

export const DEFAULT_PERPLEXITY_MODEL: PerplexityModel = 'sonar';

// =============================================================================
// XAI GROK MODELS
// =============================================================================

export const SUPPORTED_GROK_MODELS = [
  // Grok 4.x models (latest - Jan 2026)
  'grok-4',
  'grok-4-1-fast-reasoning',
  'grok-4-1-fast-non-reasoning',
  // Grok 3.x models
  'grok-3',
  'grok-3-mini',
  // Grok 2.x models (vision, legacy)
  'grok-2-vision-1212',
  'grok-2',
  'grok-2-mini',
  'grok-beta',
] as const;

export type GrokModel = (typeof SUPPORTED_GROK_MODELS)[number];

export const DEFAULT_GROK_MODEL: GrokModel = 'grok-4';

// Grok specialized models
export const SUPPORTED_GROK_IMAGE_MODELS = ['grok-2-image-1212'] as const;
export const SUPPORTED_GROK_VISION_MODELS = [
  'grok-2-vision-1212',
  'grok-4-1-fast-reasoning',
] as const;

// =============================================================================
// DEEPSEEK MODELS
// =============================================================================

export const SUPPORTED_DEEPSEEK_MODELS = [
  // DeepSeek V3.2 models (Jan 2026)
  'deepseek-chat',
  'deepseek-reasoner',
  'deepseek-coder',
] as const;

export type DeepSeekModel = (typeof SUPPORTED_DEEPSEEK_MODELS)[number];

export const DEFAULT_DEEPSEEK_MODEL: DeepSeekModel = 'deepseek-chat';

// =============================================================================
// ALIBABA QWEN MODELS
// =============================================================================

export const SUPPORTED_QWEN_MODELS = [
  // Qwen 3.x models (latest - Jan 2026)
  'qwen3-max',
  'qwen3-coder-plus',
  'qwen3-coder-flash',
  'qwen3-vl-plus',
  // Qwen standard models
  'qwen-plus',
  'qwen-flash',
  'qwen-turbo',
  'qwen-max',
  // QwQ (reasoning)
  'qwq-plus',
  // Qwen 2.5 instruct models (specific versions)
  'qwen2.5-72b-instruct',
  'qwen2.5-32b-instruct',
] as const;

export type QwenModel = (typeof SUPPORTED_QWEN_MODELS)[number];

export const DEFAULT_QWEN_MODEL: QwenModel = 'qwen-plus';

// Qwen specialized models
export const SUPPORTED_QWEN_IMAGE_MODELS = [
  'qwen-image-max',
  'wan2.6-t2i',
] as const;
export const SUPPORTED_QWEN_VIDEO_MODELS = [
  'wan2.6-t2v',
  'wan2.6-i2v',
] as const;

// =============================================================================
// PROVIDER TYPE
// =============================================================================

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'perplexity'
  | 'grok'
  | 'deepseek'
  | 'qwen';

export const ALL_PROVIDERS: LLMProvider[] = [
  'anthropic',
  'openai',
  'google',
  'perplexity',
  'grok',
  'deepseek',
  'qwen',
];

// =============================================================================
// UNIFIED MODEL MAP
// =============================================================================

/**
 * Map of all supported models by provider
 * Use this for UI dropdowns and validation
 */
export const SUPPORTED_MODELS = {
  anthropic: SUPPORTED_ANTHROPIC_MODELS,
  openai: SUPPORTED_OPENAI_MODELS,
  google: SUPPORTED_GOOGLE_MODELS,
  perplexity: SUPPORTED_PERPLEXITY_MODELS,
  grok: SUPPORTED_GROK_MODELS,
  deepseek: SUPPORTED_DEEPSEEK_MODELS,
  qwen: SUPPORTED_QWEN_MODELS,
} as const;

export const DEFAULT_MODELS = {
  anthropic: DEFAULT_ANTHROPIC_MODEL,
  openai: DEFAULT_OPENAI_MODEL,
  google: DEFAULT_GOOGLE_MODEL,
  perplexity: DEFAULT_PERPLEXITY_MODEL,
  grok: DEFAULT_GROK_MODEL,
  deepseek: DEFAULT_DEEPSEEK_MODEL,
  qwen: DEFAULT_QWEN_MODEL,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a model string is valid for a given provider
 */
export function isValidModel(provider: LLMProvider, model: string): boolean {
  const models = SUPPORTED_MODELS[provider];
  return (models as readonly string[]).includes(model);
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  return DEFAULT_MODELS[provider];
}

/**
 * Get all supported models for a provider
 */
export function getModelsForProvider(provider: LLMProvider): readonly string[] {
  return SUPPORTED_MODELS[provider];
}

/**
 * Detect provider from model name
 * Returns undefined if model is not recognized
 */
export function detectProviderFromModel(
  model: string
): LLMProvider | undefined {
  for (const provider of ALL_PROVIDERS) {
    if (isValidModel(provider, model)) {
      return provider;
    }
  }
  return undefined;
}
