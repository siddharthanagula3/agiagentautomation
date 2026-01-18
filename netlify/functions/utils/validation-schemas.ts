/**
 * Server-Side Validation Schemas
 * Centralized Zod schemas for all Netlify Functions
 * SECURITY: Provides strict input validation to prevent injection attacks
 *
 * Created: January 10, 2026
 * Updated: January 17, 2026 - Unified model definitions with frontend
 */

import { z } from 'zod';

// =============================================================================
// ALLOWED MODEL WHITELISTS
// SECURITY: Only allow known, valid model identifiers to prevent arbitrary model injection
//
// IMPORTANT: These are imported from ./supported-models.ts which mirrors
// src/shared/config/supported-models.ts - the single source of truth.
// When adding/removing models, update supported-models.ts in both locations.
// =============================================================================

import {
  SUPPORTED_ANTHROPIC_MODELS,
  SUPPORTED_OPENAI_MODELS,
  SUPPORTED_GOOGLE_MODELS,
  SUPPORTED_PERPLEXITY_MODELS,
  SUPPORTED_GROK_MODELS,
  SUPPORTED_DEEPSEEK_MODELS,
  SUPPORTED_QWEN_MODELS,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_GOOGLE_MODEL,
  DEFAULT_PERPLEXITY_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_QWEN_MODEL,
} from './supported-models';

// Re-export for backward compatibility
export const ALLOWED_ANTHROPIC_MODELS = SUPPORTED_ANTHROPIC_MODELS;
export const ALLOWED_OPENAI_MODELS = SUPPORTED_OPENAI_MODELS;
export const ALLOWED_GOOGLE_MODELS = SUPPORTED_GOOGLE_MODELS;
export const ALLOWED_PERPLEXITY_MODELS = SUPPORTED_PERPLEXITY_MODELS;
export const ALLOWED_GROK_MODELS = SUPPORTED_GROK_MODELS;
export const ALLOWED_DEEPSEEK_MODELS = SUPPORTED_DEEPSEEK_MODELS;
export const ALLOWED_QWEN_MODELS = SUPPORTED_QWEN_MODELS;

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Message schema for LLM conversations
 * SECURITY: Validates role enum and enforces content length limits
 */
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(100000, 'Message content exceeds 100,000 character limit'),
});

/**
 * Base LLM request schema shared across all providers
 * SECURITY: Enforces sensible defaults and bounds for all parameters
 */
export const baseLlmRequestSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Maximum 100 messages per request'),
  temperature: z
    .number()
    .min(0, 'Temperature must be >= 0')
    .max(2, 'Temperature must be <= 2')
    .default(0.7),
  max_tokens: z
    .number()
    .int('max_tokens must be an integer')
    .min(1, 'max_tokens must be >= 1')
    .max(128000, 'max_tokens cannot exceed 128,000')
    .optional(),
  system: z
    .string()
    .max(50000, 'System prompt cannot exceed 50,000 characters')
    .optional(),
  stream: z.boolean().optional(),
});

// =============================================================================
// PROVIDER-SPECIFIC LLM SCHEMAS
// =============================================================================

/**
 * Anthropic Claude API request schema
 */
export const anthropicRequestSchema = baseLlmRequestSchema.extend({
  model: z
    .enum(ALLOWED_ANTHROPIC_MODELS)
    .default(DEFAULT_ANTHROPIC_MODEL),
});

/**
 * OpenAI GPT API request schema
 */
export const openaiRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_OPENAI_MODELS).default(DEFAULT_OPENAI_MODEL),
});

/**
 * Attachment schema for multimodal requests
 * SECURITY: Validates mime type whitelist and enforces size limits
 */
const attachmentSchema = z.object({
  name: z.string().max(255, 'Attachment name too long'),
  type: z.enum([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
  ], { errorMap: () => ({ message: 'Unsupported attachment type' }) }),
  data: z.string().max(10 * 1024 * 1024, 'Attachment data cannot exceed 10MB'), // Base64 encoded
});

/**
 * Google Gemini API request schema
 * SECURITY: Includes validated attachments for multimodal requests
 */
export const googleRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_GOOGLE_MODELS).default(DEFAULT_GOOGLE_MODEL),
  attachments: z.array(attachmentSchema)
    .max(10, 'Maximum 10 attachments per request')
    .optional()
    .default([]),
});

/**
 * Perplexity API request schema
 */
export const perplexityRequestSchema = baseLlmRequestSchema.extend({
  model: z
    .enum(ALLOWED_PERPLEXITY_MODELS)
    .default(DEFAULT_PERPLEXITY_MODEL),
});

/**
 * xAI Grok API request schema
 */
export const grokRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_GROK_MODELS).default(DEFAULT_GROK_MODEL),
});

/**
 * DeepSeek API request schema
 */
export const deepseekRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_DEEPSEEK_MODELS).default(DEFAULT_DEEPSEEK_MODEL),
});

/**
 * Alibaba Qwen API request schema
 */
export const qwenRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_QWEN_MODELS).default(DEFAULT_QWEN_MODEL),
});

// =============================================================================
// PAYMENT SCHEMAS
// =============================================================================

/**
 * Create subscription request schema
 * SECURITY: Validates UUID format and restricts plan to allowed values
 */
export const createSubscriptionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  userEmail: z.string().email('Invalid email format'),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  plan: z.enum(['pro', 'max'], {
    errorMap: () => ({ message: 'Plan must be "pro" or "max"' }),
  }),
});

/**
 * Buy token pack request schema
 * SECURITY FIX (Jan 18, 2026): tokens and price are now server-side validated via packId lookup
 * Client can still send them (backward compatibility), but they're ignored in favor of trusted values
 */
export const buyTokenPackSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  userEmail: z.string().email('Invalid email format'),
  packId: z
    .string()
    .min(1, 'Pack ID is required')
    .max(50, 'Pack ID too long')
    .refine(
      (id) => ['pack_500k', 'pack_1.5m', 'pack_5m', 'pack_10m'].includes(id),
      'Invalid pack ID - must be one of: pack_500k, pack_1.5m, pack_5m, pack_10m'
    ),
  // Legacy fields (optional for backward compatibility, but ignored server-side)
  tokens: z
    .number()
    .int('Token count must be an integer')
    .positive('Token count must be positive')
    .max(100000000, 'Token count cannot exceed 100 million')
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(10000, 'Price cannot exceed $10,000')
    .optional(),
});

/**
 * Billing portal request schema
 * SECURITY: Validates Stripe customer ID format
 */
export const billingPortalSchema = z.object({
  customerId: z
    .string()
    .regex(/^cus_[a-zA-Z0-9]+$/, 'Invalid Stripe customer ID format'),
});

// =============================================================================
// AGENTS SESSION SCHEMA
// =============================================================================

/**
 * Agents session request schema
 * SECURITY: Validates all fields for OpenAI Assistants API sessions
 */
export const agentsSessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .max(100, 'Employee ID too long'),
  employeeName: z
    .string()
    .min(1, 'Employee name is required')
    .max(100, 'Employee name too long'),
  employeeRole: z
    .string()
    .max(200, 'Employee role too long')
    .optional(),
  capabilities: z
    .array(z.string().max(100, 'Capability description too long'))
    .max(50, 'Maximum 50 capabilities allowed')
    .optional(),
  sessionId: z.string().uuid('Invalid session ID format').optional(),
});

// =============================================================================
// FETCH PAGE SCHEMA
// =============================================================================

/**
 * Fetch page request schema
 * SECURITY: Validates URL format and enforces length limits
 */
export const fetchPageSchema = z.object({
  url: z
    .string()
    .url('Invalid URL format')
    .max(2000, 'URL cannot exceed 2,000 characters'),
});

// =============================================================================
// VIBE BUILD SCHEMA
// =============================================================================

/**
 * Vibe build request schema
 * SECURITY: Limits file sizes and validates project structure
 */
export const vibeBuildSchema = z.object({
  files: z.record(
    z.string().max(500000, 'File content cannot exceed 500KB')
  ),
  entryPoint: z.string().max(200, 'Entry point path too long').optional(),
  projectType: z.enum(['react', 'html', 'typescript']).optional(),
});

// =============================================================================
// AGENTS EXECUTE SCHEMA
// =============================================================================

/**
 * Agents execute request schema
 * SECURITY: Validates all fields for OpenAI Assistants API execution
 */
export const agentsExecuteSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  userId: z.string().uuid('Invalid user ID'),
  message: z.string().min(1, 'Message is required').max(100000, 'Message too long'),
  threadId: z.string().min(1, 'Thread ID is required').max(100, 'Thread ID too long'),
  assistantId: z.string().min(1, 'Assistant ID is required').max(100, 'Assistant ID too long'),
  streaming: z.boolean().optional(),
});

// =============================================================================
// MEDIA GENERATION SCHEMAS
// =============================================================================

/**
 * Allowed DALL-E models
 * SECURITY: Whitelist to prevent model injection
 */
const ALLOWED_DALLE_MODELS = ['dall-e-3', 'dall-e-2'] as const;

/**
 * Allowed DALL-E image sizes
 * SECURITY: Restrict to valid OpenAI image dimensions
 */
const ALLOWED_DALLE_SIZES = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'] as const;

/**
 * Allowed DALL-E quality options
 */
const ALLOWED_DALLE_QUALITY = ['standard', 'hd'] as const;

/**
 * Allowed DALL-E style options
 */
const ALLOWED_DALLE_STYLE = ['vivid', 'natural'] as const;

/**
 * OpenAI DALL-E image generation request schema
 * SECURITY: Validates prompt length, model whitelist, and image parameters
 */
export const openaiImageRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(4000, 'Prompt cannot exceed 4,000 characters'),
  model: z.enum(ALLOWED_DALLE_MODELS).default('dall-e-3'),
  n: z
    .number()
    .int('Image count must be an integer')
    .min(1, 'Must generate at least 1 image')
    .max(10, 'Cannot generate more than 10 images')
    .default(1),
  size: z.enum(ALLOWED_DALLE_SIZES).default('1024x1024'),
  quality: z.enum(ALLOWED_DALLE_QUALITY).default('standard'),
  style: z.enum(ALLOWED_DALLE_STYLE).default('vivid'),
  response_format: z.enum(['url', 'b64_json']).default('url'),
});

/**
 * Allowed Google Imagen models
 * SECURITY: Whitelist to prevent model injection
 */
const ALLOWED_IMAGEN_MODELS = [
  'imagen-3.0-generate-001',
  'imagen-3.0-fast-generate-001',
  'imagegeneration@006',
  'imagegeneration@005',
] as const;

/**
 * Google Imagen image generation request schema
 * SECURITY: Validates prompt, model whitelist, and generation parameters
 */
export const googleImagenRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(5000, 'Prompt cannot exceed 5,000 characters'),
  model: z.enum(ALLOWED_IMAGEN_MODELS).default('imagen-3.0-generate-001'),
  sampleCount: z
    .number()
    .int('Sample count must be an integer')
    .min(1, 'Must generate at least 1 image')
    .max(4, 'Cannot generate more than 4 images')
    .default(1),
  aspectRatio: z
    .enum(['1:1', '3:4', '4:3', '9:16', '16:9'])
    .default('1:1'),
  negativePrompt: z
    .string()
    .max(2000, 'Negative prompt cannot exceed 2,000 characters')
    .optional(),
  personGeneration: z
    .enum(['DONT_ALLOW', 'ALLOW_ADULT'])
    .default('ALLOW_ADULT'),
  safetyFilterLevel: z
    .enum(['BLOCK_LOW_AND_ABOVE', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_ONLY_HIGH'])
    .default('BLOCK_MEDIUM_AND_ABOVE'),
});

/**
 * Allowed Google Veo models
 * SECURITY: Whitelist to prevent model injection
 */
const ALLOWED_VEO_MODELS = [
  'veo-2.0-generate-001',
  'veo-001',
] as const;

/**
 * Google Veo video generation request schema
 * SECURITY: Validates prompt, model whitelist, and video parameters
 */
export const googleVeoRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(5000, 'Prompt cannot exceed 5,000 characters'),
  model: z.enum(ALLOWED_VEO_MODELS).default('veo-2.0-generate-001'),
  durationSeconds: z
    .number()
    .int('Duration must be an integer')
    .min(5, 'Video must be at least 5 seconds')
    .max(60, 'Video cannot exceed 60 seconds')
    .default(10),
  aspectRatio: z
    .enum(['9:16', '16:9', '1:1'])
    .default('16:9'),
  negativePrompt: z
    .string()
    .max(2000, 'Negative prompt cannot exceed 2,000 characters')
    .optional(),
  personGeneration: z
    .enum(['DONT_ALLOW', 'ALLOW_ADULT'])
    .default('ALLOW_ADULT'),
  // For image-to-video generation
  referenceImage: z
    .object({
      data: z.string().max(10 * 1024 * 1024, 'Image data cannot exceed 10MB'),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    })
    .optional(),
});

/**
 * Google Veo polling request schema
 * SECURITY: Validates operation name format
 */
export const googleVeoPollingSchema = z.object({
  operationName: z
    .string()
    .min(1, 'Operation name is required')
    .max(500, 'Operation name too long')
    .regex(
      /^projects\/[^/]+\/locations\/[^/]+\/operations\/[^/]+$/,
      'Invalid operation name format'
    ),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format Zod validation errors for API response
 * SECURITY: Returns sanitized error messages without internal details
 */
export function formatValidationError(error: z.ZodError): {
  error: string;
  details: Record<string, string[]>;
} {
  return {
    error: 'Validation error',
    details: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

/**
 * Safe parse helper that returns a consistent response format
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AnthropicRequest = z.infer<typeof anthropicRequestSchema>;
export type OpenAIRequest = z.infer<typeof openaiRequestSchema>;
export type GoogleRequest = z.infer<typeof googleRequestSchema>;
export type PerplexityRequest = z.infer<typeof perplexityRequestSchema>;
export type GrokRequest = z.infer<typeof grokRequestSchema>;
export type DeepSeekRequest = z.infer<typeof deepseekRequestSchema>;
export type QwenRequest = z.infer<typeof qwenRequestSchema>;
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;
export type BuyTokenPackRequest = z.infer<typeof buyTokenPackSchema>;
export type BillingPortalRequest = z.infer<typeof billingPortalSchema>;
export type AgentsSessionRequest = z.infer<typeof agentsSessionSchema>;
export type FetchPageRequest = z.infer<typeof fetchPageSchema>;
export type VibeBuildRequest = z.infer<typeof vibeBuildSchema>;
export type AgentsExecuteRequest = z.infer<typeof agentsExecuteSchema>;
export type OpenAIImageRequest = z.infer<typeof openaiImageRequestSchema>;
export type GoogleImagenRequest = z.infer<typeof googleImagenRequestSchema>;
export type GoogleVeoRequest = z.infer<typeof googleVeoRequestSchema>;
export type GoogleVeoPollingRequest = z.infer<typeof googleVeoPollingSchema>;
