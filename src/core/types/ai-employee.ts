/**
 * AI Employee Types
 * Type definitions for file-based AI employee system
 */

export interface AIEmployee {
  name: string;
  description: string;
  tools: string[];
  model: string;
  systemPrompt: string;
  avatar?: string;
  price?: number;
  expertise?: string[];
}

export interface AIEmployeeFrontmatter {
  name: string;
  description: string;
  tools: string | string[];
  model: string;
  avatar?: string;
  price?: number;
  expertise?: string[];
}
