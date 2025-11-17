/**
 * Test Data Factory
 * Provides reusable test fixtures and builders for consistent test data
 */

import type {
  Task,
  ActiveEmployee,
  MissionMessage,
} from '@shared/stores/mission-control-store';
import type { AIEmployee } from '@core/types/ai-employee';

let idCounter = 0;
const generateId = () => `test-${Date.now()}-${idCounter++}`;

// Updated: Nov 16th 2025 - Fixed any type
/**
 * User Factory
 */
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: generateId(),
  email: `test-${generateId()}@example.com`,
  name: 'Test User',
  avatar: undefined,
  role: 'user' as const,
  plan: 'free' as const,
  user_metadata: {
    full_name: 'Test User',
    role: 'user',
    plan: 'free',
  },
  ...overrides,
});

/**
 * AI Employee Factory
 */
export const createMockEmployee = (
  overrides: Partial<AIEmployee> = {}
): AIEmployee => ({
  name: `employee-${generateId()}`,
  description: 'A skilled AI employee for testing',
  tools: ['Read', 'Write', 'Bash'],
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: 'You are a helpful AI assistant specialized in testing.',
  ...overrides,
});

/**
 * Specialized Employee Factories
 */
export const createCodeReviewerEmployee = (): AIEmployee =>
  createMockEmployee({
    name: 'code-reviewer',
    description: 'Reviews code for best practices and potential issues',
    tools: ['Read', 'Grep', 'Glob'],
    systemPrompt:
      'You are an expert code reviewer focused on quality and maintainability.',
  });

export const createDebuggerEmployee = (): AIEmployee =>
  createMockEmployee({
    name: 'debugger',
    description: 'Finds and fixes bugs in code',
    tools: ['Bash', 'Read', 'Edit', 'Grep'],
    systemPrompt:
      'You are an expert debugger skilled at identifying and resolving issues.',
  });

export const createDataAnalystEmployee = (): AIEmployee =>
  createMockEmployee({
    name: 'data-analyst',
    description: 'Analyzes data and generates insights',
    tools: ['Read', 'Bash'],
    systemPrompt:
      'You are a data analyst expert at extracting insights from data.',
  });

/**
 * Task Factory
 */
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: generateId(),
  description: 'Test task description',
  status: 'pending',
  assignedTo: null,
  ...overrides,
});

/**
 * Task Builders for Common Scenarios
 */
export const createPendingTask = (description: string): Task =>
  createMockTask({ description, status: 'pending' });

export const createInProgressTask = (
  description: string,
  assignedTo: string
): Task =>
  createMockTask({
    description,
    status: 'in_progress',
    assignedTo,
    startedAt: new Date(),
  });

export const createCompletedTask = (
  description: string,
  result: string
): Task =>
  createMockTask({
    description,
    status: 'completed',
    result,
    completedAt: new Date(),
  });

export const createFailedTask = (description: string, error: string): Task =>
  createMockTask({
    description,
    status: 'failed',
    error,
  });

/**
 * Active Employee Factory
 */
export const createMockActiveEmployee = (
  overrides: Partial<ActiveEmployee> = {}
): ActiveEmployee => ({
  name: `employee-${generateId()}`,
  status: 'idle',
  currentTool: null,
  currentTask: null,
  log: [],
  progress: 0,
  ...overrides,
});

/**
 * Mission Message Factory
 */
export const createMockMessage = (
  overrides: Partial<MissionMessage> = {}
): MissionMessage => ({
  id: generateId(),
  from: 'system',
  type: 'system',
  content: 'Test message',
  timestamp: new Date(),
  ...overrides,
});

/**
 * Message Builders for Common Types
 */
export const createUserMessage = (content: string): MissionMessage =>
  createMockMessage({ from: 'user', type: 'user', content });

export const createSystemMessage = (content: string): MissionMessage =>
  createMockMessage({ from: 'system', type: 'system', content });

export const createEmployeeMessage = (
  employeeName: string,
  content: string
): MissionMessage =>
  createMockMessage({ from: employeeName, type: 'employee', content });

export const createTaskUpdateMessage = (
  taskId: string,
  content: string
): MissionMessage =>
  createMockMessage({
    type: 'task_update',
    content,
    metadata: { taskId },
  });

/**
 * Mission Plan Factory
 */
export interface MockMissionPlan {
  plan: Array<{
    task: string;
    tool_required?: string;
  }>;
  reasoning?: string;
}

export const createMockMissionPlan = (
  taskCount: number = 3,
  overrides: Partial<MockMissionPlan> = {}
): MockMissionPlan => {
  const defaultPlan = Array.from({ length: taskCount }, (_, i) => ({
    task: `Task ${i + 1}: Execute test operation`,
    tool_required: ['Read', 'Write', 'Bash'][i % 3],
  }));

  return {
    plan: defaultPlan,
    reasoning:
      'Test plan reasoning: Breaking down the task into manageable steps.',
    ...overrides,
  };
};

/**
 * Specialized Plan Builders
 */
export const createCodeReviewPlan = (): MockMissionPlan => ({
  plan: [
    {
      task: 'Read the source file to understand the code',
      tool_required: 'Read',
    },
    { task: 'Search for common anti-patterns', tool_required: 'Grep' },
    {
      task: 'Analyze code complexity and suggest improvements',
      tool_required: 'Read',
    },
  ],
  reasoning: 'Systematic code review approach: read, search, analyze.',
});

export const createDebugPlan = (): MockMissionPlan => ({
  plan: [
    { task: 'Read the error logs', tool_required: 'Read' },
    { task: 'Reproduce the bug with tests', tool_required: 'Bash' },
    { task: 'Identify root cause', tool_required: 'Read' },
    { task: 'Apply fix to the code', tool_required: 'Edit' },
    { task: 'Verify fix with tests', tool_required: 'Bash' },
  ],
  reasoning: 'Standard debugging workflow: reproduce, identify, fix, verify.',
});

/**
 * Supabase Test Data Factory
 */
export const createMockSupabaseEmployee = (
  overrides: Record<string, unknown> = {}
) => ({
  id: generateId(),
  name: 'Test Employee',
  description: 'A test AI employee',
  tools: ['Read', 'Write'],
  price: 0,
  category: 'general',
  model: 'claude-3-5-sonnet-20241022',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPurchasedEmployee = (
  userId: string,
  employeeId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: generateId(),
  user_id: userId,
  employee_id: employeeId,
  purchased_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Stripe Test Data Factory
 */
export const createMockStripeSession = (
  overrides: Record<string, unknown> = {}
) => ({
  id: `cs_test_${generateId()}`,
  object: 'checkout.session',
  mode: 'subscription',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  customer: `cus_${generateId()}`,
  status: 'open',
  ...overrides,
});

export const createMockStripeSubscription = (
  overrides: Record<string, unknown> = {}
) => ({
  id: `sub_${generateId()}`,
  object: 'subscription',
  customer: `cus_${generateId()}`,
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  ...overrides,
});

export const createMockStripeWebhookEvent = (type: string, data: unknown) => ({
  id: `evt_${generateId()}`,
  object: 'event',
  type,
  data: { object: data },
  created: Math.floor(Date.now() / 1000),
});

/**
 * LLM Response Factory
 */
export const createMockLLMResponse = (
  content: string,
  overrides: Record<string, unknown> = {}
) => ({
  content: [{ text: content, type: 'text' }],
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  ...overrides,
});

/**
 * Chat Session Factory
 */
export const createMockChatSession = (
  userId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: generateId(),
  user_id: userId,
  title: 'Test Chat Session',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockChatMessage = (
  sessionId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: generateId(),
  session_id: sessionId,
  role: 'user',
  content: 'Test message',
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Reset counter for test isolation
 */
export const resetTestDataFactory = () => {
  idCounter = 0;
};
