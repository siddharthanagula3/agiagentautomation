// Core TypeScript interfaces for AGI Agent Automation Platform
// Based on PRD specifications

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'starter' | 'professional' | 'business' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  category: string;
  department?: string;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  capabilities: AIEmployeeCapabilities;
  system_prompt: string;
  tools: Tool[];
  workflows?: Workflow[];
  performance: PerformanceMetrics;
  availability: AvailabilitySettings;
  cost: CostStructure;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIEmployeeCapabilities {
  coreSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  availableTools: Tool[];
  toolProficiency: Map<string, number>;
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'fully-autonomous';
  decisionMaking: DecisionCapability[];
  canCollaborate: boolean;
  collaborationProtocols: Protocol[];
  communicationChannels: Channel[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'code_generation' | 'data_analysis' | 'design' | 'marketing' | 'business';
  parameters: ToolParameter[];
  executionEndpoint: string;
  costPerExecution: number;
  estimatedDuration: number;
  requirements: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface ToolInvocation {
  toolId: string;
  employeeId: string;
  parameters: Record<string, any>;
  context: ExecutionContext;
  validate(): ValidationResult;
  execute(): Promise<ToolResult>;
  handleResult(result: ToolResult): void;
  handleError(error: Error): void;
  logExecution(): void;
  trackPerformance(): void;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  cost: number;
  metadata: Record<string, any>;
}

export interface ExecutionContext {
  userId: string;
  jobId?: string;
  sessionId: string;
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  description: string;
  requirements: JobRequirements;
  assigned_to: string[];
  workforce_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: JobResult;
}

export interface JobRequirements {
  skills: string[];
  tools: string[];
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
  deliverables: string[];
  constraints: string[];
}

export interface JobResult {
  success: boolean;
  deliverables: Deliverable[];
  metrics: JobMetrics;
  feedback: string;
  nextSteps?: string[];
}

export interface Deliverable {
  type: 'code' | 'document' | 'data' | 'design' | 'report';
  name: string;
  content: any;
  format: string;
  size: number;
  url?: string;
}

export interface JobMetrics {
  completionTime: number;
  cost: number;
  quality: number;
  satisfaction: number;
  toolsUsed: string[];
  errors: number;
}

export interface AIWorkforce {
  id: string;
  user_id: string;
  name: string;
  ceo_employee_id: string;
  members: string[];
  structure: OrganizationalStructure;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface OrganizationalStructure {
  departments: Department[];
  hierarchy: HierarchyNode[];
  communicationFlow: CommunicationFlow[];
  reportingStructure: ReportingStructure;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  members: string[];
  responsibilities: string[];
  goals: string[];
}

export interface HierarchyNode {
  id: string;
  role: string;
  reportsTo?: string;
  manages: string[];
  level: number;
}

export interface CommunicationFlow {
  from: string;
  to: string;
  type: 'direct' | 'broadcast' | 'escalation';
  frequency: 'immediate' | 'daily' | 'weekly' | 'as_needed';
}

export interface ReportingStructure {
  daily: string[];
  weekly: string[];
  monthly: string[];
  quarterly: string[];
}

export interface InterAgentMessage {
  from: string;
  to: string;
  type: 'task' | 'query' | 'response' | 'status' | 'escalation';
  content: any;
  conversationId: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

export interface ChatSession {
  id: string;
  user_id: string;
  employee_id: string;
  started_at: string;
  ended_at?: string;
  message_count: number;
  tools_used: number;
  status: 'active' | 'ended' | 'archived';
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'employee';
  sender_id: string;
  message: string;
  message_type: 'text' | 'tool_invocation' | 'tool_result' | 'file' | 'system';
  metadata: Record<string, any>;
  created_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'draft';
  last_executed?: string;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  type: 'ai_employee_task' | 'tool_invocation' | 'condition' | 'delay' | 'notification';
  config: WorkflowStepConfig;
  onSuccess: string;
  onFailure: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface WorkflowStepConfig {
  employeeId?: string;
  tool?: string;
  parameters?: Record<string, any>;
  condition?: string;
  delay?: number;
  notification?: NotificationConfig;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  template: string;
  data: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_data: Record<string, any>;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  result?: Record<string, any>;
  error_message?: string;
  steps_completed: number;
  total_steps: number;
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  averageExecutionTime: number;
  errorRate: number;
  userSatisfaction: number;
  costEfficiency: number;
  lastUpdated: string;
}

export interface AvailabilitySettings {
  timezone: string;
  workingHours: WorkingHours;
  maxConcurrentTasks: number;
  autoAcceptTasks: boolean;
  priorityLevel: 'low' | 'medium' | 'high';
}

export interface WorkingHours {
  start: string;
  end: string;
  days: string[];
  breaks: BreakPeriod[];
}

export interface BreakPeriod {
  start: string;
  end: string;
  reason: string;
}

export interface CostStructure {
  baseCost: number;
  perTaskCost: number;
  perToolExecutionCost: number;
  currency: string;
  billingPeriod: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface DecisionCapability {
  type: string;
  description: string;
  confidence: number;
  criteria: string[];
}

export interface Protocol {
  name: string;
  description: string;
  steps: string[];
  triggers: string[];
}

export interface Channel {
  type: 'direct' | 'broadcast' | 'escalation';
  name: string;
  description: string;
  participants: string[];
}

export interface Billing {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  metadata: Record<string, any>;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  employee_id?: string;
  job_id?: string;
  workflow_id?: string;
  created_at: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Event Types
export interface ClientEvents {
  'chat:message': { sessionId: string; message: string };
  'job:subscribe': { jobId: string };
  'workflow:subscribe': { workflowId: string };
  'employee:status': { employeeId: string };
}

export interface ServerEvents {
  'chat:response': { sessionId: string; message: ChatMessage };
  'chat:thinking': { sessionId: string; status: string };
  'job:update': { jobId: string; status: string; data: any };
  'workflow:update': { workflowId: string; status: string };
  'tool:execution': { toolId: string; status: string };
  'employee:update': { employeeId: string; status: string };
}

// Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolId: string,
    public parameters: Record<string, any>
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
