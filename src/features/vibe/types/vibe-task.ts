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
  result?: any;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface TaskResult {
  task_id: string;
  status: TaskStatus;
  output?: any;
  error?: string;
  artifacts?: string[];
  metadata?: Record<string, any>;
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
