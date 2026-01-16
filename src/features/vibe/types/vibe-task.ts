/**
 * Vibe Task Types
 * Type definitions for parallel task execution in VIBE
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface VibeTask {
  id: string;
  session_id: string;
  description: string;
  assigned_to: string; // employee ID
  dependencies: string[]; // task IDs
  status: TaskStatus;
  // Updated: Jan 15th 2026 - Fixed any type
  result?: unknown;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface TaskResult {
  task_id: string;
  status: TaskStatus;
  output?: unknown;
  error?: string;
  artifacts?: string[];
  metadata?: Record<string, unknown>;
}

export interface ExecutionPlan {
  tasks: VibeTask[];
  dependency_graph: Map<string, string[]>;
  execution_order: string[][]; // Array of levels, each level runs in parallel
}

export interface TaskDependency {
  task_id: string;
  depends_on: string[];
}
