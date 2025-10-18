/**
 * System Prompts Service
 * Manages system prompts, guidelines, and optimization for each LLM provider
 * Based on official documentation and best practices
 */

import matter from 'gray-matter';
import type {
  AIEmployee,
  AIEmployeeFrontmatter,
} from '@core/types/ai-employee';

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  provider: string;
  model?: string;
  category: 'general' | 'role-specific' | 'task-specific' | 'safety';
  guidelines: string[];
  cacheKey: string;
  lastUpdated: Date;
}

export interface PromptGuidelines {
  maxLength: number;
  recommendedLength: number;
  keyElements: string[];
  optimizationTips: string[];
  providerSpecific: Record<string, unknown>;
}

export class SystemPromptsService {
  private static instance: SystemPromptsService;
  private prompts: Map<string, SystemPrompt> = new Map();
  private guidelines: Map<string, PromptGuidelines> = new Map();
  private cache: Map<string, { prompt: SystemPrompt; timestamp: Date }> =
    new Map();

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
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      // Cache for 1 hour
      if (Date.now() - cached.timestamp.getTime() < 3600000) {
        return cached.prompt;
      }
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
  validatePrompt(prompt: SystemPrompt): { isValid: boolean; errors: string[] } {
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
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get available AI employees from .agi/employees directory
   * Reads markdown files with frontmatter and returns structured employee data
   */
  async getAvailableEmployees(): Promise<AIEmployee[]> {
    const employees: AIEmployee[] = [];

    try {
      // In browser environment, we'll use a static list for now
      // In a real implementation, this would read from the filesystem via a backend API
      // For the browser, we'll fetch from a known location or use import.meta.glob

      if (typeof window !== 'undefined') {
        // Browser environment - use import.meta.glob for Vite
        const employeeFiles = import.meta.glob('/../.agi/employees/*.md', {
          as: 'raw',
          eager: false,
        });

        for (const [path, loader] of Object.entries(employeeFiles)) {
          try {
            const content = await (loader as () => Promise<string>)();
            const parsed = matter(content);
            const frontmatter = parsed.data as AIEmployeeFrontmatter;

            employees.push({
              name: frontmatter.name,
              description: frontmatter.description,
              tools: frontmatter.tools.split(',').map((t) => t.trim()),
              model: frontmatter.model || 'inherit',
              systemPrompt: parsed.content.trim(),
            });
          } catch (err) {
            console.error(`Failed to parse employee file ${path}:`, err);
          }
        }
      }

      return employees;
    } catch (error) {
      console.error('Error loading AI employees:', error);
      return [];
    }
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
