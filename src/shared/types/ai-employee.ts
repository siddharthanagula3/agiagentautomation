// AI Employee System Types
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

export type EmployeeCategory =
  | 'executive_leadership'
  | 'engineering_technology'
  | 'product_management'
  | 'design_ux'
  | 'ai_data_science'
  | 'it_security_ops'
  | 'marketing_growth'
  | 'sales_business'
  | 'customer_success'
  | 'human_resources'
  | 'finance_accounting'
  | 'legal_risk_compliance'
  | 'specialized_niche';

export type EmployeeLevel =
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'distinguished'
  | 'director'
  | 'vp'
  | 'c_level';

export type EmployeeStatus =
  | 'available'
  | 'working'
  | 'busy'
  | 'maintenance'
  | 'training'
  | 'offline';

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
  parameters: ToolParameter[];
  invocationPattern: string;
  integrationType: IntegrationType;
  config: Record<string, unknown>;
  isActive: boolean;
}

export type ToolType =
  | 'code_generation'
  | 'data_analysis'
  | 'api_integration'
  | 'workflow_automation'
  | 'communication'
  | 'research'
  | 'design'
  | 'testing'
  | 'deployment'
  | 'monitoring'
  | 'custom';

export type IntegrationType =
  | 'n8n_workflow'
  | 'openai_api'
  | 'anthropic_api'
  | 'cursor_agent'
  | 'replit_agent'
  | 'claude_code'
  | 'custom_api'
  | 'webhook'
  | 'database'
  | 'file_system';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

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

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'on_hold';

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
