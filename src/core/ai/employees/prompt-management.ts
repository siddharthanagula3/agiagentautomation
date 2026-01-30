/**
 * System Prompts Service
 * Manages system prompts, guidelines, and optimization for each LLM provider
 * Based on official documentation and best practices
 */

import matter from 'gray-matter';
import { z } from 'zod';
import type {
  AIEmployee,
} from '@core/types/ai-employee';
import { logger } from '@shared/lib/logger';

/**
 * Zod schema for AI Employee frontmatter validation
 * Validates the YAML frontmatter in .agi/employees/*.md files
 */
const EmployeeFrontmatterSchema = z.object({
  /** Unique identifier/name of the employee (required) */
  name: z.string().min(1, 'Employee name is required'),
  /** Human-readable description of the employee's role (required) */
  description: z.string().min(1, 'Employee description is required'),
  /** Tools available to this employee - can be comma-separated string or YAML array */
  tools: z.union([
    z.string().min(1, 'At least one tool must be specified'),
    z.array(z.string()).min(1, 'At least one tool must be specified'),
  ]),
  /** LLM model to use - defaults to 'inherit' */
  model: z.string().optional().default('inherit'),
  /** Optional avatar image URL or path */
  avatar: z.string().optional(),
  /** Price in tokens/credits to hire this employee */
  price: z.number().nonnegative().optional(),
  /** List of expertise areas for matching tasks */
  expertise: z.array(z.string()).optional(),
  /** Optional role identifier for workflow integration */
  role: z.string().optional(),
});

/** Validated employee frontmatter type inferred from Zod schema */
export type ValidatedEmployeeFrontmatter = z.infer<typeof EmployeeFrontmatterSchema>;

/**
 * Validates employee frontmatter data against the schema
 * @param data - Raw frontmatter data from gray-matter
 * @param filePath - Path to the employee file (for error logging)
 * @returns Validated frontmatter or null if validation fails
 */
function validateEmployeeFrontmatter(
  data: unknown,
  filePath: string
): ValidatedEmployeeFrontmatter | null {
  const result = EmployeeFrontmatterSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    logger.warn(
      `[SystemPromptsService] Invalid employee frontmatter in ${filePath}:\n${errors}`
    );
    return null;
  }

  return result.data;
}

/** Supported LLM providers for system prompts */
export type SystemPromptProvider = 'openai' | 'anthropic' | 'google' | 'perplexity' | 'grok' | 'deepseek' | 'qwen';

/** Categories of system prompts */
export type SystemPromptCategory = 'general' | 'role-specific' | 'task-specific' | 'safety';

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  provider: SystemPromptProvider | string;
  model?: string;
  category: SystemPromptCategory;
  guidelines: string[];
  cacheKey: string;
  lastUpdated: Date;
}

/** Provider-specific capabilities and features */
export interface ProviderCapabilities {
  supportsFunctionCalling?: boolean;
  supportsSystemMessages?: boolean;
  supportsFewShot?: boolean;
  supportsSystemInstructions?: boolean;
  supportsConstitutionalAI?: boolean;
  supportsLongContext?: boolean;
  supportsMultimodal?: boolean;
  supportsSafetySettings?: boolean;
  supportsWebSearch?: boolean;
  supportsCitations?: boolean;
  supportsRealTimeData?: boolean;
}

export interface PromptGuidelines {
  maxLength: number;
  recommendedLength: number;
  keyElements: string[];
  optimizationTips: string[];
  providerSpecific: ProviderCapabilities;
}

/** Cache entry for system prompts */
interface PromptCacheEntry {
  prompt: SystemPrompt;
  timestamp: Date;
}

/** Cache duration in milliseconds (1 hour) for system prompts */
const CACHE_DURATION_MS = 3600000;

/** Cache TTL for AI employees in milliseconds (5 minutes) */
const EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;

/** Result of prompt validation */
export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Cache statistics */
export interface CacheStats {
  size: number;
  entries: string[];
}

export class SystemPromptsService {
  private static instance: SystemPromptsService;
  private prompts: Map<string, SystemPrompt> = new Map();
  private guidelines: Map<string, PromptGuidelines> = new Map();
  private cache: Map<string, PromptCacheEntry> = new Map();

  /** Cached AI employees list */
  private cachedEmployees: AIEmployee[] = [];
  /** Flag indicating if employees have been loaded */
  private employeesLoaded = false;
  /** Timestamp of last employee cache load */
  private employeesLastLoadTime = 0;

  static getInstance(): SystemPromptsService {
    if (!SystemPromptsService.instance) {
      SystemPromptsService.instance = new SystemPromptsService();
    }
    return SystemPromptsService.instance;
  }

  constructor() {
    this.initializeDefaultPrompts();
    this.initializeGuidelines();
  }

  /**
   * Initialize default system prompts for each provider
   */
  private initializeDefaultPrompts(): void {
    // OpenAI/ChatGPT prompts
    this.addPrompt({
      id: 'openai-general',
      name: 'General Assistant',
      content: `You are a helpful, harmless, and honest AI assistant. You provide accurate information, admit when you don't know something, and always prioritize user safety and well-being.`,
      provider: 'openai',
      category: 'general',
      guidelines: [
        'Be concise and clear',
        'Admit uncertainty when appropriate',
        'Provide accurate information',
        'Maintain helpful and professional tone',
      ],
      cacheKey: 'openai-general',
      lastUpdated: new Date(),
    });

    // Anthropic/Claude prompts
    this.addPrompt({
      id: 'anthropic-general',
      name: 'General Assistant',
      content: `You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest. You provide accurate information and admit when you don't know something.`,
      provider: 'anthropic',
      category: 'general',
      guidelines: [
        'Be thorough and thoughtful',
        'Consider multiple perspectives',
        'Provide detailed explanations',
        'Maintain ethical standards',
      ],
      cacheKey: 'anthropic-general',
      lastUpdated: new Date(),
    });

    // Google/Gemini prompts
    this.addPrompt({
      id: 'google-general',
      name: 'General Assistant',
      content: `You are Gemini, a helpful AI assistant. You provide accurate, helpful, and safe responses. You are designed to be informative and assist users with their questions and tasks.`,
      provider: 'google',
      category: 'general',
      guidelines: [
        'Be informative and helpful',
        'Provide clear explanations',
        'Use appropriate language',
        'Ensure safety and accuracy',
      ],
      cacheKey: 'google-general',
      lastUpdated: new Date(),
    });

    // Perplexity prompts
    this.addPrompt({
      id: 'perplexity-general',
      name: 'Research Assistant',
      content: `You are a research assistant that provides accurate, up-to-date information. You can search the web for current information and provide comprehensive answers with citations.`,
      provider: 'perplexity',
      category: 'general',
      guidelines: [
        'Provide current information',
        'Include citations when possible',
        'Be comprehensive in research',
        'Verify information accuracy',
      ],
      cacheKey: 'perplexity-general',
      lastUpdated: new Date(),
    });
  }

  /**
   * Initialize guidelines for each provider
   */
  private initializeGuidelines(): void {
    // OpenAI guidelines
    this.guidelines.set('openai', {
      maxLength: 2000,
      recommendedLength: 500,
      keyElements: [
        'Role definition',
        'Behavior guidelines',
        'Response format',
        'Safety instructions',
      ],
      optimizationTips: [
        'Keep prompts concise',
        'Be specific about behavior',
        'Include examples when helpful',
        'Test with different scenarios',
      ],
      providerSpecific: {
        supportsFunctionCalling: true,
        supportsSystemMessages: true,
        supportsFewShot: true,
      },
    });

    // Anthropic guidelines
    this.guidelines.set('anthropic', {
      maxLength: 4000,
      recommendedLength: 800,
      keyElements: [
        'Role and identity',
        'Capabilities and limitations',
        'Response style',
        'Ethical guidelines',
      ],
      optimizationTips: [
        'Be detailed about capabilities',
        'Include ethical considerations',
        'Specify response format',
        'Consider context length',
      ],
      providerSpecific: {
        supportsSystemInstructions: true,
        supportsConstitutionalAI: true,
        supportsLongContext: true,
      },
    });

    // Google guidelines
    this.guidelines.set('google', {
      maxLength: 3000,
      recommendedLength: 600,
      keyElements: [
        'Assistant identity',
        'Response guidelines',
        'Safety measures',
        'Multimodal capabilities',
      ],
      optimizationTips: [
        'Include safety instructions',
        'Specify multimodal capabilities',
        'Be clear about limitations',
        'Test with different inputs',
      ],
      providerSpecific: {
        supportsMultimodal: true,
        supportsSystemInstructions: true,
        supportsSafetySettings: true,
      },
    });

    // Perplexity guidelines
    this.guidelines.set('perplexity', {
      maxLength: 1500,
      recommendedLength: 400,
      keyElements: [
        'Research focus',
        'Citation requirements',
        'Accuracy standards',
        'Response format',
      ],
      optimizationTips: [
        'Emphasize accuracy',
        'Request citations',
        'Specify research depth',
        'Include verification steps',
      ],
      providerSpecific: {
        supportsWebSearch: true,
        supportsCitations: true,
        supportsRealTimeData: true,
      },
    });
  }

  /**
   * Add a new system prompt
   */
  addPrompt(prompt: SystemPrompt): void {
    this.prompts.set(prompt.id, prompt);
    this.cache.set(prompt.cacheKey, { prompt, timestamp: new Date() });
  }

  /**
   * Get system prompt for provider and role
   */
  getPrompt(provider: string, role?: string, model?: string): SystemPrompt {
    const cacheKey = `${provider}-${role || 'general'}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_DURATION_MS) {
      return cached.prompt;
    }

    // Find appropriate prompt
    let prompt = this.prompts.get(`${provider}-${role || 'general'}`);

    if (!prompt) {
      // Fallback to general prompt
      prompt = this.prompts.get(`${provider}-general`);
    }

    if (!prompt) {
      // Create default prompt
      prompt = {
        id: `${provider}-${role || 'general'}`,
        name: `${role || 'General'} Assistant`,
        content: `You are a helpful AI assistant. You provide accurate, helpful, and safe responses.`,
        provider,
        category: 'general',
        guidelines: ['Be helpful', 'Be accurate', 'Be safe'],
        cacheKey,
        lastUpdated: new Date(),
      };
    }

    // Cache the result
    this.cache.set(cacheKey, { prompt, timestamp: new Date() });

    return prompt;
  }

  /**
   * Create role-specific prompt
   */
  createRolePrompt(
    role: string,
    provider: string,
    additionalInstructions?: string
  ): SystemPrompt {
    const basePrompt = this.getPrompt(provider);
    const guidelines = this.guidelines.get(provider.toLowerCase());

    let content = `You are a ${role}. `;

    // Add role-specific instructions
    switch (role.toLowerCase()) {
      case 'product manager':
        content += `You help with product strategy, roadmap planning, feature prioritization, and stakeholder communication. You understand user needs, market trends, and technical constraints.`;
        break;
      case 'data scientist':
        content += `You help with data analysis, statistical modeling, machine learning, and data-driven insights. You can work with various data types and analytical tools.`;
        break;
      case 'software engineer':
        content += `You help with software development, code review, architecture design, and technical problem-solving. You understand various programming languages and development practices.`;
        break;
      case 'marketing specialist':
        content += `You help with marketing strategy, campaign planning, content creation, and brand positioning. You understand market research and consumer behavior.`;
        break;
      default:
        content += `You provide expert assistance in your field of expertise.`;
    }

    // Add provider-specific optimizations
    if (guidelines?.providerSpecific) {
      if (guidelines.providerSpecific.supportsFunctionCalling) {
        content += ` You can use tools and functions when appropriate.`;
      }
      if (guidelines.providerSpecific.supportsWebSearch) {
        content += ` You can search for current information when needed.`;
      }
    }

    // Add additional instructions
    if (additionalInstructions) {
      content += ` ${additionalInstructions}`;
    }

    // Add safety and behavior guidelines
    content += ` Always provide accurate, helpful, and safe responses. Admit when you don't know something and ask for clarification when needed.`;

    return {
      id: `${provider}-${role.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${role} Assistant`,
      content,
      provider,
      category: 'role-specific',
      guidelines: basePrompt.guidelines,
      cacheKey: `${provider}-${role.toLowerCase()}`,
      lastUpdated: new Date(),
    };
  }

  /**
   * Optimize prompt for specific use case
   */
  optimizePrompt(prompt: SystemPrompt, useCase: string): SystemPrompt {
    const guidelines = this.guidelines.get(prompt.provider.toLowerCase());
    if (!guidelines) return prompt;

    let optimizedContent = prompt.content;

    // Add use case specific instructions
    switch (useCase.toLowerCase()) {
      case 'creative':
        optimizedContent += ` Be creative and think outside the box. Provide innovative solutions and ideas.`;
        break;
      case 'technical':
        optimizedContent += ` Focus on technical accuracy and provide detailed technical explanations.`;
        break;
      case 'educational':
        optimizedContent += ` Explain concepts clearly and provide examples. Break down complex topics into understandable parts.`;
        break;
      case 'analytical':
        optimizedContent += ` Provide thorough analysis and consider multiple perspectives. Support your conclusions with evidence.`;
        break;
    }

    // Ensure prompt length is within limits
    if (optimizedContent.length > guidelines.maxLength) {
      optimizedContent =
        optimizedContent.substring(0, guidelines.maxLength - 100) + '...';
    }

    return {
      ...prompt,
      content: optimizedContent,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get guidelines for provider
   */
  getGuidelines(provider: string): PromptGuidelines | undefined {
    return this.guidelines.get(provider.toLowerCase());
  }

  /**
   * Validate prompt
   */
  validatePrompt(prompt: SystemPrompt): PromptValidationResult {
    const errors: string[] = [];
    const guidelines = this.guidelines.get(prompt.provider.toLowerCase());

    if (!guidelines) {
      errors.push('No guidelines found for provider');
      return { isValid: false, errors };
    }

    if (prompt.content.length > guidelines.maxLength) {
      errors.push(
        `Prompt too long: ${prompt.content.length} > ${guidelines.maxLength}`
      );
    }

    if (prompt.content.length < 50) {
      errors.push('Prompt too short: minimum 50 characters recommended');
    }

    // Check for key elements
    const missingElements = guidelines.keyElements.filter(
      (element) => !prompt.content.toLowerCase().includes(element.toLowerCase())
    );

    if (missingElements.length > 0) {
      errors.push(`Missing key elements: ${missingElements.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get available AI employees from .agi/employees directory
   * Reads markdown files with frontmatter and returns structured employee data
   * Invalid employee files are logged as warnings but do not crash the application
   *
   * Uses caching with TTL to avoid re-loading employees on every call.
   *
   * @param forceRefresh - If true, bypasses cache and reloads from disk
   * @returns Promise resolving to array of AI employees
   */
  async getAvailableEmployees(forceRefresh = false): Promise<AIEmployee[]> {
    const now = Date.now();
    const cacheAge = now - this.employeesLastLoadTime;
    const cacheValid = this.employeesLoaded && cacheAge < EMPLOYEE_CACHE_TTL_MS;

    // Return cached employees if valid and not forcing refresh
    if (!forceRefresh && cacheValid) {
      logger.debug(
        `[SystemPromptsService] Returning ${this.cachedEmployees.length} cached employees (age: ${Math.round(cacheAge / 1000)}s)`
      );
      return this.cachedEmployees;
    }

    // Log reason for reload
    if (forceRefresh) {
      logger.info('[SystemPromptsService] Force refreshing employee cache');
    } else if (!this.employeesLoaded) {
      logger.info('[SystemPromptsService] Loading employees for first time');
    } else {
      logger.info(
        `[SystemPromptsService] Employee cache expired (age: ${Math.round(cacheAge / 1000)}s), reloading`
      );
    }

    const employees: AIEmployee[] = [];
    let validCount = 0;
    let invalidCount = 0;

    try {
      // In browser environment, we'll use a static list for now
      // In a real implementation, this would read from the filesystem via a backend API
      // For the browser, we'll fetch from a known location or use import.meta.glob

      if (typeof window !== 'undefined') {
        // Browser environment - use import.meta.glob for Vite
        const employeeFiles = import.meta.glob('/.agi/employees/*.md', {
          as: 'raw',
          eager: false,
        });

        for (const [path, loader] of Object.entries(employeeFiles)) {
          try {
            const content = await (loader as () => Promise<string>)();
            const parsed = matter(content);

            // Validate frontmatter with Zod schema
            const frontmatter = validateEmployeeFrontmatter(parsed.data, path);

            // Skip invalid employees (warning already logged by validateEmployeeFrontmatter)
            if (!frontmatter) {
              invalidCount++;
              continue;
            }

            // Updated: Jan 15th 2026 - Fixed employee tools field parsing to support YAML arrays
            // Tools can be either a comma-separated string or a YAML array
            const tools = Array.isArray(frontmatter.tools)
              ? frontmatter.tools // Already an array from YAML
              : frontmatter.tools.split(',').map((t) => t.trim()); // Parse comma-separated string

            employees.push({
              name: frontmatter.name,
              description: frontmatter.description,
              tools,
              model: frontmatter.model,
              systemPrompt: parsed.content.trim(),
              avatar: frontmatter.avatar,
              price: frontmatter.price,
              expertise: frontmatter.expertise,
            });
            validCount++;
          } catch (err) {
            invalidCount++;
            logger.error(`[SystemPromptsService] Failed to parse employee file ${path}:`, err);
          }
        }

        // Log summary of loaded employees
        if (invalidCount > 0) {
          logger.warn(
            `[SystemPromptsService] Loaded ${validCount} valid employees, skipped ${invalidCount} invalid`
          );
        } else {
          logger.info(
            `[SystemPromptsService] Loaded ${validCount} AI employees successfully`
          );
        }
      }

      // Update cache
      this.cachedEmployees = employees;
      this.employeesLoaded = true;
      this.employeesLastLoadTime = Date.now();

      return employees;
    } catch (error) {
      logger.error('[SystemPromptsService] Error loading AI employees:', error);
      return [];
    }
  }

  /**
   * Invalidate the employee cache, forcing a reload on next access
   * Use this when employee files have been modified at runtime
   */
  invalidateEmployeeCache(): void {
    this.employeesLoaded = false;
    this.employeesLastLoadTime = 0;
    this.cachedEmployees = [];
    logger.info('[SystemPromptsService] Employee cache invalidated');
  }

  /**
   * Refresh the employee cache by reloading all employees from disk
   * Convenience method that combines invalidation and reload
   *
   * @returns Promise resolving to the freshly loaded employees
   */
  async refreshEmployees(): Promise<AIEmployee[]> {
    return this.getAvailableEmployees(true);
  }

  /**
   * Get employee cache statistics for debugging/monitoring
   */
  getEmployeeCacheStats(): {
    loaded: boolean;
    count: number;
    ageMs: number;
    ttlMs: number;
    isExpired: boolean;
  } {
    const now = Date.now();
    const ageMs = now - this.employeesLastLoadTime;
    return {
      loaded: this.employeesLoaded,
      count: this.cachedEmployees.length,
      ageMs: this.employeesLoaded ? ageMs : 0,
      ttlMs: EMPLOYEE_CACHE_TTL_MS,
      isExpired: !this.employeesLoaded || ageMs >= EMPLOYEE_CACHE_TTL_MS,
    };
  }

  /**
   * Get AI employee by name
   */
  async getEmployeeByName(name: string): Promise<AIEmployee | undefined> {
    const employees = await this.getAvailableEmployees();
    return employees.find(
      (emp) => emp.name.toLowerCase() === name.toLowerCase()
    );
  }
}

// Export singleton instance
export const systemPromptsService = SystemPromptsService.getInstance();

/**
 * Convenience export for prompt management operations
 * Provides cleaner API for common operations without accessing the service directly
 */
export const promptManagement = {
  /**
   * Get all available AI employees (uses cache with TTL)
   * @param forceRefresh - If true, bypasses cache and reloads from disk
   */
  getAvailableEmployees: (forceRefresh = false) =>
    systemPromptsService.getAvailableEmployees(forceRefresh),

  /**
   * Get a specific AI employee by name
   */
  getEmployeeByName: (name: string) => systemPromptsService.getEmployeeByName(name),

  /**
   * Invalidate the employee cache (forces reload on next access)
   */
  invalidateEmployeeCache: () => systemPromptsService.invalidateEmployeeCache(),

  /**
   * Force refresh employees from disk immediately
   */
  refreshEmployees: () => systemPromptsService.refreshEmployees(),

  /**
   * Get employee cache statistics for debugging
   */
  getEmployeeCacheStats: () => systemPromptsService.getEmployeeCacheStats(),
};

/**
 * Standalone function to invalidate the employee cache
 * @deprecated Use promptManagement.invalidateEmployeeCache() instead
 */
export function invalidateEmployeeCache(): void {
  systemPromptsService.invalidateEmployeeCache();
}

/**
 * Standalone function to refresh employees
 * @deprecated Use promptManagement.refreshEmployees() instead
 */
export function refreshEmployees(): Promise<AIEmployee[]> {
  return systemPromptsService.refreshEmployees();
}
