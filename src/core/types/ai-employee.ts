/**
 * AI Employee Types
 * Type definitions for file-based AI employee system
 */

/** Available tools that can be assigned to AI employees */
export type AIEmployeeTool =
  | 'Read'
  | 'Grep'
  | 'Glob'
  | 'Bash'
  | 'Edit'
  | 'Write'
  | 'WebSearch'
  | 'ImageGeneration'
  | 'CodeExecution'
  | string; // Allow for custom tools

/** Model configuration for AI employees */
export type AIEmployeeModel =
  | 'inherit' // Inherit from parent configuration
  | `claude-${string}` // Anthropic Claude models
  | `gpt-${string}` // OpenAI GPT models
  | `gemini-${string}` // Google Gemini models
  | `sonar-${string}` // Perplexity Sonar models
  | `grok-${string}` // xAI Grok models
  | `deepseek-${string}` // DeepSeek models
  | `qwen-${string}` // Alibaba Qwen models
  | string; // Allow for future models

/** Parsed and validated AI employee definition */
export interface AIEmployee {
  /** Unique identifier/name of the employee */
  name: string;
  /** Human-readable description of the employee's role and capabilities */
  description: string;
  /** List of tools available to this employee */
  tools: AIEmployeeTool[];
  /** LLM model to use for this employee */
  model: AIEmployeeModel;
  /** System prompt defining the employee's behavior and personality */
  systemPrompt: string;
  /** Optional avatar image URL or path */
  avatar?: string;
  /** Price in tokens/credits to hire this employee (0 = free) */
  price?: number;
  /** List of expertise areas for matching tasks */
  expertise?: string[];
}

/** Raw frontmatter from employee markdown files (before parsing) */
export interface AIEmployeeFrontmatter {
  name: string;
  description: string;
  /** Can be comma-separated string or YAML array */
  tools: string | string[];
  model: string;
  avatar?: string;
  price?: number;
  expertise?: string[];
}

/** Status of an AI employee during task execution */
export type AIEmployeeStatus =
  | 'idle'
  | 'thinking'
  | 'using_tool'
  | 'responding'
  | 'error';

/** Runtime state of an AI employee */
export interface AIEmployeeState {
  employee: AIEmployee;
  status: AIEmployeeStatus;
  currentTask?: string;
  currentTool?: string;
  progress: number;
  logs: string[];
}
