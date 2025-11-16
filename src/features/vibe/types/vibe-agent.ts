/**
 * Vibe Agent Types
 * Type definitions for AI employees in the VIBE interface
 */

import type { AIEmployee } from '@core/types/ai-employee';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'error';

export interface ActiveAgent {
  employee: AIEmployee;
  status: AgentStatus;
  current_task?: string;
  progress?: number;
  last_activity?: Date;
}

export interface AgentMatch {
  employee: AIEmployee;
  confidence: number;
  reasoning: string;
  matched_keywords?: string[];
}

export type RoutingMode = 'single' | 'supervisor';

export interface RoutingResult {
  mode: RoutingMode;
  primaryAgent?: AIEmployee;
  supervisorPlan?: SupervisorPlan;
  confidence: number;
  reasoning: string;
}

export interface SupervisorPlan {
  supervisor: AIEmployee;
  tasks: TaskAssignment[];
  execution_strategy: 'sequential' | 'parallel' | 'mixed';
}

export interface TaskAssignment {
  id: string;
  description: string;
  assigned_to: AIEmployee;
  dependencies: string[];
  estimated_duration?: number;
  priority: 'high' | 'medium' | 'low';
}

export type TaskComplexity = 'SIMPLE' | 'COMPLEX';

export interface ComplexityAnalysis {
  complexity: TaskComplexity;
  reasoning: string;
  factors: {
    scope: 'narrow' | 'broad';
    steps: number;
    tools_required: string[];
    knowledge_domains: string[];
  };
}
