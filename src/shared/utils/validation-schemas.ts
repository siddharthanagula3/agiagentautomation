// src/shared/utils/validation-schemas.ts
// Centralized validation schemas using Zod

import { z } from 'zod';

// ===================================
// COMMON VALIDATION PATTERNS
// ===================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;
const urlRegex = /^https?:\/\/.+/;

// ===================================
// AUTH SCHEMAS
// ===================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ===================================
// USER PROFILE SCHEMAS
// ===================================

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: emailSchema,
  company: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const userSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyDigest: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'es', 'fr', 'de']),
});

// ===================================
// AI CONFIGURATION SCHEMAS
// ===================================

export const aiConfigSchema = z.object({
  openaiApiKey: z.string().startsWith('sk-', 'Invalid OpenAI API key format').optional().or(z.literal('')),
  anthropicApiKey: z.string().startsWith('sk-ant-', 'Invalid Anthropic API key format').optional().or(z.literal('')),
  googleApiKey: z.string().min(20, 'Invalid Google API key').optional().or(z.literal('')),
  perplexityApiKey: z.string().min(20, 'Invalid Perplexity API key').optional().or(z.literal('')),
  defaultProvider: z.enum(['openai', 'anthropic', 'google', 'perplexity']),
  defaultModel: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(100000).default(2000),
});

// ===================================
// CHAT & MESSAGING SCHEMAS
// ===================================

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  sessionId: z.string().uuid().optional(),
});

export const chatSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'google', 'perplexity']),
});

// ===================================
// CUSTOM SHORTCUTS SCHEMAS
// ===================================

export const customShortcutSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100, 'Label too long').trim(),
  prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long').trim(),
  category: z.enum(['coding', 'writing', 'business', 'creative', 'analysis', 'general']),
});

// ===================================
// ARTIFACT SCHEMAS
// ===================================

export const artifactSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['html', 'react', 'svg', 'mermaid', 'markdown', 'code', 'document']),
  content: z.string().min(1, 'Content is required').max(100000, 'Content too large'),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublic: z.boolean().default(false),
});

// ===================================
// EMPLOYEE MANAGEMENT SCHEMAS
// ===================================

export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  tools: z.array(z.string()).min(1, 'At least one tool is required'),
  model: z.string().min(1, 'Model is required'),
  systemPrompt: z.string().min(50, 'System prompt must be detailed').max(10000),
  category: z.string().max(50).optional(),
  price: z.number().min(0).default(0),
});

// ===================================
// MISSION CONTROL SCHEMAS
// ===================================

export const missionSchema = z.object({
  objective: z.string().min(10, 'Objective must be detailed').max(5000),
  employeeIds: z.array(z.string().uuid()).min(1, 'At least one employee required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  deadline: z.string().datetime().optional(),
});

// ===================================
// BILLING SCHEMAS
// ===================================

export const tokenPackPurchaseSchema = z.object({
  packId: z.string().min(1, 'Pack ID is required'),
  tokens: z.number().int().positive('Tokens must be positive'),
  price: z.number().positive('Price must be positive'),
});

export const subscriptionSchema = z.object({
  plan: z.enum(['free', 'pro', 'max']),
  billingPeriod: z.enum(['monthly', 'yearly']),
});

// ===================================
// CONTACT & SUPPORT SCHEMAS
// ===================================

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: emailSchema,
  subject: z.string().min(5, 'Subject is required').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject is required').max(200),
  description: z.string().min(20, 'Description must be detailed').max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['bug', 'feature', 'question', 'billing', 'other']),
  attachments: z.array(z.string().url()).max(5).optional(),
});

// ===================================
// SEARCH & FILTER SCHEMAS
// ===================================

export const searchQuerySchema = z.object({
  query: z.string().max(500),
  filters: z.record(z.string()).optional(),
  sort: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Sanitizes HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 10000); // Max 10k characters
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  return urlRegex.test(url);
}

/**
 * Validates UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Type-safe validation wrapper
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Formats Zod errors for display
 */
export function formatZodErrors(errors: z.ZodError): string[] {
  return errors.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Safe parse with default value
 */
export function safeParseWithDefault<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

// ===================================
// TYPE EXPORTS
// ===================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type AIConfig = z.infer<typeof aiConfigSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type CustomShortcut = z.infer<typeof customShortcutSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
