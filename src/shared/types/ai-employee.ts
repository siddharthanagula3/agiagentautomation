/**
 * AI Employee System Types
 *
 * Note: For basic AI employee types used in UI components (selectors, cards),
 * see AIEmployeeBasic and MarketplaceEmployee in @shared/types/common.ts
 * This file contains extended types for the AI employee system with workflows.
 *
 * CONSOLIDATION NOTE: Many types are duplicated in ./complete-ai-employee.ts
 * which provides MCP integration types. Re-export common types from there.
 */

// Re-export shared types from complete-ai-employee.ts
export type {
  EmployeeCategory,
  EmployeeLevel,
  EmployeeStatus,
  ToolType,
  IntegrationType,
  ToolParameter,
} from './complete-ai-employee';

// Import for use in local interfaces
import type {
  EmployeeCategory,
  EmployeeLevel,
  EmployeeStatus,
  ToolType,
  IntegrationType,
  ToolParameter as CompleteToolParameter,
  AssignmentStatus,
} from './complete-ai-employee';

/**
 * AIEmployee for workflow system (subset of complete-ai-employee.ts AIEmployee)
 * For file-based employees, use AIEmployee from @core/types/ai-employee.ts
 */
export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  category: EmployeeCategory;
  department: string;
  level: EmployeeLevel;
  status: EmployeeStatus;
  capabilities: EmployeeCapabilities;
  systemPrompt: string;
  tools: ToolDefinition[];
  workflows: WorkflowDefinition[];
  performance: EmployeePerformance;
  availability: AvailabilitySchedule;
  cost: CostStructure;
  metadata: EmployeeMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCapabilities {
  coreSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  certifications: string[];
  languages: string[];
  specializations: string[];
  limitations: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  parameters: CompleteToolParameter[];
  invocationPattern: string;
  integrationType: IntegrationType;
  config: Record<string, unknown>;
  isActive: boolean;
}

// ToolType, IntegrationType, and ToolParameter are re-exported from complete-ai-employee.ts above

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  n8nWorkflowId?: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  condition: string;
  parameters: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  toolId: string;
  parameters: Record<string, unknown>;
  nextSteps: string[];
}

export interface EmployeePerformance {
  efficiency: number; // 0-100
  accuracy: number; // 0-100
  speed: number; // 0-100
  reliability: number; // 0-100
  quality: number; // 0-100
  collaboration: number; // 0-100
  innovation: number; // 0-100
  totalTasksCompleted: number;
  averageTaskDuration: number; // in minutes
  successRate: number; // 0-100
  customerSatisfaction: number; // 0-100
  lastUpdated: string;
}

export interface AvailabilitySchedule {
  timezone: string;
  workingHours: WorkingHours[];
  breaks: BreakSchedule[];
  holidays: string[];
  maxConcurrentTasks: number;
  responseTime: number; // in minutes
}

export interface WorkingHours {
  day: string;
  start: string;
  end: string;
  isActive: boolean;
}

export interface BreakSchedule {
  name: string;
  start: string;
  end: string;
  duration: number; // in minutes
  isRecurring: boolean;
}

export interface CostStructure {
  hourlyRate: number;
  currency: string;
  billingModel: 'hourly' | 'task' | 'subscription' | 'performance';
  minimumCharge: number;
  maximumCharge?: number;
  discounts: DiscountRule[];
}

export interface DiscountRule {
  condition: string;
  percentage: number;
  description: string;
}

export interface EmployeeMetadata {
  version: string;
  lastTraining: string;
  modelProvider: string;
  modelVersion: string;
  customInstructions: string;
  personalityTraits: string[];
  communicationStyle: string;
  preferredTools: string[];
  collaborationPreferences: string[];
}

// Job Assignment Types
export interface JobAssignment {
  id: string;
  jobId: string;
  employeeId: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  status: AssignmentStatus;
  priority: number;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  toolsUsed: string[];
  workflowsExecuted: string[];
  performance: AssignmentPerformance;
  feedback?: string;
}

// Re-export AssignmentStatus from complete-ai-employee.ts
export type { AssignmentStatus } from './complete-ai-employee';

export interface AssignmentPerformance {
  efficiency: number;
  quality: number;
  timeliness: number;
  toolUsage: Record<string, number>;
  errors: number;
  iterations: number;
}

// System Configuration
export interface AIEmployeeSystemConfig {
  maxConcurrentEmployees: number;
  defaultResponseTime: number;
  qualityThreshold: number;
  autoAssignment: boolean;
  loadBalancing: boolean;
  monitoringEnabled: boolean;
  alertingEnabled: boolean;
  backupEmployees: string[];
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  action: 'reassign' | 'escalate' | 'notify' | 'pause';
  targetEmployee?: string;
  notificationChannels: string[];
  timeout: number; // in minutes
}
