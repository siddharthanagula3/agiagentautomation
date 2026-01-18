/**
 * Supported Models Configuration for Netlify Functions
 *
 * IMPORTANT: This file mirrors src/shared/config/supported-models.ts
 * Keep both files in sync when adding/removing models.
 *
 * Why duplicate? Netlify Functions are bundled separately and don't support
 * path aliases to source files outside the functions directory.
 *
 * TODO: Consider build-time code generation to keep these in sync automatically.
 *
 * Last synced: January 17, 2026
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

export const DEFAULT_ANTHROPIC_MODEL: AnthropicModel = 'claude-sonnet-4-5-20250929';

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
