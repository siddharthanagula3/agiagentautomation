/**
 * Server-Side Validation Schemas
 * Centralized Zod schemas for all Netlify Functions
 * SECURITY: Provides strict input validation to prevent injection attacks
 *
 * Created: January 10, 2026
 */

import { z } from 'zod';

// =============================================================================
// ALLOWED MODEL WHITELISTS
// SECURITY: Only allow known, valid model identifiers to prevent arbitrary model injection
// =============================================================================

export const ALLOWED_ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
] as const;

export const ALLOWED_OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1-preview',
  'o1-mini',
  'o1',
  'o3-mini',
] as const;

export const ALLOWED_GOOGLE_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-pro',
] as const;

export const ALLOWED_PERPLEXITY_MODELS = [
  'llama-3.1-sonar-small-128k-online',
  'llama-3.1-sonar-large-128k-online',
  'llama-3.1-sonar-huge-128k-online',
  'sonar',
  'sonar-pro',
] as const;

export const ALLOWED_GROK_MODELS = [
  'grok-beta',
  'grok-2',
  'grok-2-mini',
] as const;

export const ALLOWED_DEEPSEEK_MODELS = [
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-reasoner',
] as const;

export const ALLOWED_QWEN_MODELS = [
  'qwen-turbo',
  'qwen-plus',
  'qwen-max',
  'qwen2.5-72b-instruct',
  'qwen2.5-32b-instruct',
] as const;

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
    .default('claude-3-5-sonnet-20241022'),
});

/**
 * OpenAI GPT API request schema
 */
export const openaiRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_OPENAI_MODELS).default('gpt-4o-mini'),
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
  model: z.enum(ALLOWED_GOOGLE_MODELS).default('gemini-1.5-flash'),
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
    .default('llama-3.1-sonar-small-128k-online'),
});

/**
 * xAI Grok API request schema
 */
export const grokRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_GROK_MODELS).default('grok-beta'),
});

/**
 * DeepSeek API request schema
 */
export const deepseekRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_DEEPSEEK_MODELS).default('deepseek-chat'),
});

/**
 * Alibaba Qwen API request schema
 */
export const qwenRequestSchema = baseLlmRequestSchema.extend({
  model: z.enum(ALLOWED_QWEN_MODELS).default('qwen-turbo'),
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
 * SECURITY: Enforces reasonable limits on token amounts and prices
 */
export const buyTokenPackSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  userEmail: z.string().email('Invalid email format'),
  packId: z
    .string()
    .min(1, 'Pack ID is required')
    .max(50, 'Pack ID too long'),
  tokens: z
    .number()
    .int('Token count must be an integer')
    .positive('Token count must be positive')
    .max(100000000, 'Token count cannot exceed 100 million'),
  price: z
    .number()
    .positive('Price must be positive')
    .max(10000, 'Price cannot exceed $10,000'),
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
