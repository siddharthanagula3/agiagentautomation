/**
 * Complete AI Employee Type Definitions
 * Comprehensive types for the AI Employee system with MCP integration
 *
 * Note: For basic AI employee types used in UI components (selectors, cards),
 * see AIEmployeeBasic and MarketplaceEmployee in @shared/types/common.ts
 * This file contains extended types for the full employee management system.
 *
 * Canonical types like ChatMessage, ToolCall, Attachment are in ./common.ts
 * Import from @shared/types for the canonical versions.
 */

import type {
  ToolCall as CanonicalToolCall,
  Attachment as CanonicalAttachment,
  ApiResponse,
  PaginatedResponse as CanonicalPaginatedResponse,
} from './common';

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

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'on_hold';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type MessageType =
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'system'
  | 'error';

export type TrainingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed';

// Core AI Employee Interface
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
  performance: PerformanceMetrics;
  availability: Availability;
  cost: CostMetrics;
  metadata: EmployeeMetadata;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isHired: boolean;
  hiredBy?: string;
  hiredAt?: string;
}

// Employee Capabilities
export interface EmployeeCapabilities {
  coreSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: string[];
  certifications: string[];
  experience: ExperienceLevel;
  specializations: string[];
}

export interface ExperienceLevel {
  years: number;
  level: EmployeeLevel;
  industries: string[];
  projects: number;
  achievements: string[];
}

// Tool Definitions
export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  parameters: ToolParameter[];
  invocationPattern: string;
  integrationType: IntegrationType;
  config: ToolConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  custom?: (value: unknown) => boolean;
}

export interface ToolConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
  caching?: CachingConfig;
}

export interface AuthenticationConfig {
  type: 'bearer' | 'basic' | 'api_key' | 'oauth' | 'custom';
  credentials: Record<string, string>;
  tokenEndpoint?: string;
  refreshToken?: string;
}

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  burst?: number;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number; // in seconds
  key?: string;
}

// Workflow Definitions
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  type: 'n8n' | 'custom' | 'api';
  config: WorkflowConfig;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowConfig {
  n8nWorkflowId?: string;
  n8nApiKey?: string;
  customEndpoint?: string;
  timeout?: number;
  retries?: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'tool' | 'condition' | 'loop' | 'delay';
  config: Record<string, unknown>;
  nextSteps: string[];
}

// Performance Metrics
export interface PerformanceMetrics {
  efficiency: number; // 0-100
  accuracy: number; // 0-100
  speed: number; // 0-100
  reliability: number; // 0-100
  rating: number; // 1-5
  totalTasksCompleted: number;
  averageTaskTime: number; // in minutes
  successRate: number; // 0-100
  userSatisfaction: number; // 0-100
  lastUpdated: string;
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  metric: string;
  value: number;
  timestamp: string;
  change: number; // percentage change
}

// Cost Metrics
export interface CostMetrics {
  hourlyRate: number;
  currency: string;
  billingModel: 'hourly' | 'project' | 'retainer' | 'performance';
  minimumHours?: number;
  maximumHours?: number;
  discounts?: DiscountConfig[];
  taxes?: TaxConfig[];
}

export interface DiscountConfig {
  type: 'volume' | 'loyalty' | 'promotional';
  percentage: number;
  conditions: Record<string, unknown>;
}

export interface TaxConfig {
  type: 'vat' | 'sales_tax' | 'service_tax';
  percentage: number;
  region: string;
}

// Availability
export interface Availability {
  timezone: string;
  workingHours: WorkingHours;
  availability: AvailabilitySlot[];
  holidays: Holiday[];
  maintenance: MaintenanceWindow[];
}

export interface WorkingHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  isAvailable: boolean;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  isAvailable: boolean;
  reason?: string;
}

export interface Holiday {
  name: string;
  date: string;
  isRecurring: boolean;
}

export interface MaintenanceWindow {
  start: string;
  end: string;
  reason: string;
  isScheduled: boolean;
}

// Employee Metadata
export interface EmployeeMetadata {
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
  socialLinks?: SocialLink[];
  portfolio?: PortfolioItem[];
  testimonials?: Testimonial[];
  awards?: Award[];
}

export interface SocialLink {
  platform: string;
  url: string;
  username?: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  image?: string;
  url?: string;
  technologies: string[];
  completedAt: string;
}

export interface Testimonial {
  client: string;
  content: string;
  rating: number;
  date: string;
}

export interface Award {
  name: string;
  organization: string;
  date: string;
  description?: string;
}

// Job Assignment
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
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentPerformance {
  efficiency: number;
  quality: number;
  communication: number;
  timeliness: number;
  overall: number;
}

// Tool Execution
export interface ToolExecution {
  id: string;
  toolId?: string;
  mcpToolId?: string;
  employeeId: string;
  jobId?: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  context?: Record<string, unknown>;
  executedAt: string;
  success: boolean;
  errorMessage?: string;
  durationMs: number;
  userId?: string;
}

// Chat Message - Employee system specific
// Note: For canonical ChatMessage, use import from '@shared/types'
export interface EmployeeChatMessage {
  id: string;
  employeeId: string;
  userId: string;
  messageType: MessageType;
  content: string;
  metadata: EmployeeMessageMetadata;
  createdAt: string;
}

/**
 * @deprecated Use EmployeeChatMessage instead
 */
export type ChatMessage = EmployeeChatMessage;

export interface EmployeeMessageMetadata {
  toolCalls?: EmployeeToolCall[];
  reasoning?: string;
  status?: 'thinking' | 'working' | 'completed' | 'error';
  attachments?: EmployeeAttachment[];
  reactions?: Reaction[];
}

/**
 * @deprecated Use EmployeeMessageMetadata instead
 */
export type MessageMetadata = EmployeeMessageMetadata;

// Employee-specific tool call (simpler than canonical ToolCall)
export interface EmployeeToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executionTime?: number;
}

/**
 * @deprecated Use EmployeeToolCall instead
 * Note: Canonical ToolCall is in @shared/types/common.ts
 */
export type ToolCall = EmployeeToolCall;

// Employee-specific attachment (simpler than canonical Attachment)
export interface EmployeeAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

/**
 * @deprecated Use EmployeeAttachment instead
 * Note: Canonical Attachment is in @shared/types/common.ts
 */
export type Attachment = EmployeeAttachment;

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

// Employee Performance History
export interface EmployeePerformanceHistory {
  id: string;
  employeeId: string;
  performanceData: PerformanceMetrics;
  recordedAt: string;
  periodStart?: string;
  periodEnd?: string;
}

// Training Records
export interface EmployeeTrainingRecord {
  id: string;
  employeeId: string;
  trainingType: string;
  trainingData: TrainingData;
  startedAt: string;
  completedAt?: string;
  status: TrainingStatus;
  performanceImprovement: Record<string, unknown>;
}

export interface TrainingData {
  course: string;
  instructor?: string;
  duration: number; // in hours
  materials: string[];
  assessments: Assessment[];
}

export interface Assessment {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  completedAt: string;
}

// Employee Hires
export interface EmployeeHire {
  id: string;
  userId: string;
  employeeId: string;
  hireDate: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod?: string;
  paymentReference?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

// Employee Sessions
export interface EmployeeSession {
  id: string;
  userId: string;
  employeeId: string;
  sessionStart: string;
  sessionEnd?: string;
  isActive: boolean;
  messagesCount: number;
  toolsUsedCount: number;
  createdAt: string;
}

// MCP Tool Interface
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
  metadata?: Record<string, unknown>;
}

// System Prompt
export interface SystemPrompt {
  role: string;
  category: EmployeeCategory;
  experience: string;
  capabilities: string[];
  tools: string[];
  personality: string;
  communicationStyle: string;
  prompt: string;
}

// Employee Search and Filter
export interface EmployeeSearchFilters {
  category?: EmployeeCategory[];
  level?: EmployeeLevel[];
  status?: EmployeeStatus[];
  skills?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  rating?: {
    min: number;
    max: number;
  };
  location?: string;
  languages?: string[];
}

export interface EmployeeSearchResult {
  employees: AIEmployee[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Analytics and Reporting
export interface EmployeeAnalytics {
  totalEmployees: number;
  availableEmployees: number;
  workingEmployees: number;
  hiredEmployees: number;
  totalTools: number;
  mcpTools: number;
  activeAssignments: number;
  completedAssignments: number;
  totalHires: number;
  activeSessions: number;
  averagePerformance: number;
}

export interface EmployeeReport {
  id: string;
  employeeId: string;
  reportType: 'performance' | 'usage' | 'financial' | 'custom';
  data: Record<string, unknown>;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
}

// Notification Types
export interface EmployeeNotification {
  id: string;
  userId: string;
  employeeId?: string;
  type: 'assignment' | 'completion' | 'error' | 'maintenance' | 'payment';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// Error Types
export interface EmployeeError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  employeeId?: string;
  userId?: string;
}

// API Response Types - Employee system specific
// Note: Canonical ApiResponse and PaginatedResponse are in @shared/types/common.ts
export interface EmployeeAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * @deprecated Use EmployeeAPIResponse or import ApiResponse from @shared/types
 */
export type APIResponse<T> = EmployeeAPIResponse<T>;

export interface EmployeePaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * @deprecated Use EmployeePaginatedResponse or import PaginatedResponse from @shared/types
 */
export type PaginatedResponse<T> = EmployeePaginatedResponse<T>;

// Real-time Event Types
export interface EmployeeEvent {
  type:
    | 'employee_updated'
    | 'assignment_created'
    | 'tool_executed'
    | 'message_sent'
    | 'performance_updated';
  employeeId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface RealtimeSubscription {
  id: string;
  event: string;
  callback: (data: unknown) => void;
  isActive: boolean;
}

// Configuration Types
export interface EmployeeSystemConfig {
  maxEmployeesPerUser: number;
  defaultSessionTimeout: number; // in minutes
  maxToolExecutionsPerHour: number;
  enableRealTimeUpdates: boolean;
  enablePerformanceTracking: boolean;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  features: {
    hiring: boolean;
    chat: boolean;
    tools: boolean;
    workflows: boolean;
    analytics: boolean;
    admin: boolean;
  };
}

// Validation Schemas
export interface ValidationSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Export all types for easy importing
export type {
  AIEmployee,
  EmployeeCapabilities,
  ToolDefinition,
  WorkflowDefinition,
  PerformanceMetrics,
  CostMetrics,
  Availability,
  EmployeeMetadata,
  JobAssignment,
  ToolExecution,
  ChatMessage,
  EmployeePerformanceHistory,
  EmployeeTrainingRecord,
  EmployeeHire,
  EmployeeSession,
  MCPTool,
  MCPRequest,
  MCPResponse,
  MCPToolResult,
  SystemPrompt,
  EmployeeSearchFilters,
  EmployeeSearchResult,
  EmployeeAnalytics,
  EmployeeReport,
  EmployeeNotification,
  EmployeeError,
  APIResponse,
  PaginatedResponse,
  EmployeeEvent,
  RealtimeSubscription,
  EmployeeSystemConfig,
  ValidationSchema,
  ValidationResult,
};
