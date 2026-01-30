/**
 * Shared Types Index
 * Central export point for all shared type definitions
 *
 * Import pattern: import { TypeName } from '@shared/types';
 */

// ============================================================================
// COMMON TYPES (Primary source for frequently-used types)
// ============================================================================

export {
  // Status and primitives
  type Status,
  type MessageRole,
  type MessageDeliveryStatus,
  type ToolCallStatus,
  type ParticipantType,

  // API response types
  type ApiResponse,
  type APIResponse, // Alias for backward compatibility
  type PaginatedResponse,
  type ApiError,

  // Chat message types
  type MessageMetadata,
  type BaseChatMessage,
  type SimpleChatMessage,
  type ChatMessage,
  type MissionChatMessage,
  type MCPToolCallInfo,
  type ChatMessageRecord,
  type ToolCall,
  type Attachment,
  type MessageReaction,
  type ThinkingStep,
  type Citation,

  // Chat session types
  type ChatSession,
  type ChatSettings,
  type TypingIndicator,

  // AI Employee types
  type AIProvider,
  type AIEmployeeStatus,
  type AIEmployeeBasic,
  type MarketplaceEmployee,
  type AIEmployeePerformance,

  // Tool types
  type Tool,
  type ToolResult,

  // Streaming types
  type StreamingUpdate,

  // Base entity
  type BaseEntity,

  // Orchestration types
  type CollaborationAgentCapability,
  type ProtocolAgentCapability,
  type SelectionAgentCapability,
} from './common';

// ============================================================================
// STORE TYPES
// ============================================================================

export {
  type UserRole,
  type UserPlan,
  type UserProfile,
  type UserPreferences,
  type UserUsage,
  type UserBilling,
  type ConversationSettings,
  type ConversationMetadata,
  type EmployeeTier,
  type EmployeeStatus,
  type EmployeeCapabilities,
  type EmployeePerformance,
  type EmployeePricing,
  type JobStatus,
  type JobPriority,
  type WorkerStatus,
  type JobRequirements as StoreJobRequirements,
  type JobProgress,
  type JobResult as StoreJobResult,
  type SubTask,
  type NotificationType,
  type NotificationPriority,
  type NotificationCategory,
  type NotificationAction,
  type NotificationSettings,
  type Theme,
  type ColorScheme,
  type FontSize,
  type Density,
  type ThemeConfig,
  type LayoutConfig,
  type FileType,
  type FileUpload,
  type FileMetadata,
  type MetricPoint,
  type TimeSeries,
  type DashboardWidget,
  type Integration,
  type WebhookEvent,
  type SearchFilters,
  type SearchResult,
} from './store-types';

// ============================================================================
// EMPLOYEE TYPES (Extended definitions)
// ============================================================================

export {
  type Employee,
  type PurchasedEmployee,
  type EmployeeSession,
  type EmployeeMessage,
  type EmployeePerformance as ExtendedEmployeePerformance,
  type EmployeeCategory,
  type EmployeeProvider,
  type SubscriptionStatus,
} from './employee';

// ============================================================================
// MULTI-AGENT CHAT TYPES
// ============================================================================

export {
  type ConversationType,
  type ConversationStatus,
  type OrchestrationMode,
  type CollaborationStrategy,
  type ParticipantRole,
  type ParticipantStatus,
  type SessionType,
  type TaskStatus,
  type ReactionType,
  type MultiAgentConversation,
  type ConversationParticipant,
  type AgentCollaboration,
  type MessageReaction as MultiAgentMessageReaction,
  type ConversationMetadata as MultiAgentConversationMetadata,
  type MultiAgentConversationInsert,
  type ConversationParticipantInsert,
  type AgentCollaborationInsert,
  type MessageReactionInsert,
  type ConversationMetadataInsert,
  type MultiAgentConversationUpdate,
  type ConversationParticipantUpdate,
  type AgentCollaborationUpdate,
  type MessageReactionUpdate,
  type ConversationMetadataUpdate,
  type ConversationWithParticipants,
  type ConversationWithDetails,
  type ParticipantWithStats,
  type CreateConversationRequest,
  type AddParticipantRequest,
  type CreateCollaborationRequest,
  type ConversationListFilters,
  type ConversationStats,
  type RealtimeConversationUpdate,
  type RealtimeParticipantUpdate,
  type TypingIndicator as MultiAgentTypingIndicator,
  type PresenceState,
  type DatabaseError,
  MultiAgentChatError,
} from './multi-agent-chat';

// ============================================================================
// LEGACY TYPES (Domain-specific, kept for compatibility)
// ============================================================================

// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'starter' | 'professional' | 'business' | 'enterprise';
  created_at: string;
  updated_at: string;
}

// Extended AI Employee (full definition with all fields)
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
  tools: LegacyTool[];
  workflows?: Workflow[];
  performance: PerformanceMetrics;
  availability: AvailabilitySettings;
  cost: CostStructure;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AIEmployeeCapabilities {
  coreSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  availableTools: LegacyTool[];
  toolProficiency: Map<string, number>;
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'fully-autonomous';
  decisionMaking: DecisionCapability[];
  canCollaborate: boolean;
  collaborationProtocols: Protocol[];
  communicationChannels: Channel[];
}

// Legacy Tool definition (extended)
export interface LegacyTool {
  id: string;
  name: string;
  description: string;
  category:
    | 'code_generation'
    | 'data_analysis'
    | 'design'
    | 'marketing'
    | 'business';
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
  defaultValue?: unknown;
}

export interface ToolInvocation {
  toolId: string;
  employeeId: string;
  parameters: Record<string, unknown>;
  context: ExecutionContext;
  validate(): ValidationResult;
  execute(): Promise<LegacyToolResult>;
  handleResult(result: LegacyToolResult): void;
  handleError(error: Error): void;
  logExecution(): void;
  trackPerformance(): void;
}

export interface LegacyToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
  cost: number;
  metadata: Record<string, unknown>;
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
  content: unknown;
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
  content: unknown;
  conversationId: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
}

// Legacy ChatSession (database schema version)
export interface LegacyChatSession {
  id: string;
  user_id: string;
  employee_id: string;
  started_at: string;
  ended_at?: string;
  message_count: number;
  tools_used: number;
  status: 'active' | 'ended' | 'archived';
}

// Legacy ChatMessage (database schema version)
export interface LegacyChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'employee';
  sender_id: string;
  message: string;
  message_type: 'text' | 'tool_invocation' | 'tool_result' | 'file' | 'system';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
  trigger_config: Record<string, unknown>;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'draft';
  last_executed?: string;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  type:
    | 'ai_employee_task'
    | 'tool_invocation'
    | 'condition'
    | 'delay'
    | 'notification';
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
  parameters?: Record<string, unknown>;
  condition?: string;
  delay?: number;
  notification?: NotificationConfig;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  template: string;
  data: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_data: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  result?: Record<string, unknown>;
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
  metadata: Record<string, unknown>;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  employee_id?: string;
  job_id?: string;
  workflow_id?: string;
  created_at: string;
}

// WebSocket Event Types
export interface ClientEvents {
  'chat:message': { sessionId: string; message: string };
  'job:subscribe': { jobId: string };
  'workflow:subscribe': { workflowId: string };
  'employee:status': { employeeId: string };
}

export interface ServerEvents {
  'chat:response': { sessionId: string; message: LegacyChatMessage };
  'chat:thinking': { sessionId: string; status: string };
  'job:update': { jobId: string; status: string; data: unknown };
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
    public parameters: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
