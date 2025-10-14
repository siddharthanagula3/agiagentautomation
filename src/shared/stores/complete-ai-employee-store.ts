// Complete AI Employee Zustand Store
// Comprehensive state management for AI employees with MCP integration

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { completeAIEmployeeService } from '@/services/complete-ai-employee-service';
import { completeMCPService } from '@/services/complete-mcp-service';
import type {
  AIEmployee,
  EmployeeSearchFilters,
  EmployeeSearchResult,
  EmployeeAnalytics,
  ChatMessage,
  ToolExecution,
  EmployeeHire,
  EmployeeSession,
  JobAssignment,
  EmployeePerformanceHistory,
  EmployeeTrainingRecord,
  EmployeeNotification,
  EmployeeError,
  MCPTool,
  MCPToolResult,
  PerformanceMetrics,
  CostMetrics,
  Availability,
  EmployeeMetadata,
  ToolDefinition,
  WorkflowDefinition,
  EmployeeCapabilities,
  AssignmentStatus,
  PaymentStatus,
  MessageType,
  TrainingStatus,
  APIResponse,
  PaginatedResponse,
  EmployeeEvent,
  RealtimeSubscription,
} from '@shared/types/complete-ai-employee';

interface AIEmployeeState {
  // Employee Data
  employees: Record<string, AIEmployee>;
  hiredEmployees: AIEmployee[];
  selectedEmployee: AIEmployee | null;
  employeeAnalytics: EmployeeAnalytics | null;

  // Search and Filtering
  searchFilters: EmployeeSearchFilters;
  searchResults: EmployeeSearchResult | null;
  searchLoading: boolean;

  // Chat and Messaging
  chatMessages: Record<string, ChatMessage[]>;
  activeSessions: Record<string, EmployeeSession>;
  currentSession: EmployeeSession | null;

  // Tool Execution
  toolExecutions: ToolExecution[];
  availableTools: MCPTool[];
  currentToolCalls: Record<string, unknown[]>;
  executionHistory: Record<string, ToolExecution[]>;

  // Performance and Analytics
  performanceHistory: Record<string, EmployeePerformanceHistory[]>;
  trainingRecords: Record<string, EmployeeTrainingRecord[]>;

  // Notifications and Errors
  notifications: EmployeeNotification[];
  errors: EmployeeError[];

  // UI State
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Real-time Subscriptions
  subscriptions: Record<string, RealtimeSubscription>;

  // Actions
  // Employee Management
  loadEmployees: (
    filters?: EmployeeSearchFilters,
    page?: number,
    limit?: number
  ) => Promise<void>;
  loadEmployee: (id: string) => Promise<void>;
  createEmployee: (employee: Partial<AIEmployee>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<AIEmployee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  selectEmployee: (employee: AIEmployee | null) => void;

  // Hiring and Sessions
  hireEmployee: (
    employeeId: string,
    userId: string,
    paymentAmount?: number
  ) => Promise<void>;
  loadHiredEmployees: (userId: string) => Promise<void>;
  startChatSession: (employeeId: string, userId: string) => Promise<void>;
  endChatSession: (sessionId: string) => Promise<void>;

  // Chat and Messaging
  sendMessage: (
    employeeId: string,
    userId: string,
    content: string,
    messageType?: MessageType
  ) => Promise<void>;
  loadChatMessages: (employeeId: string, userId: string) => Promise<void>;
  clearChatMessages: (employeeId: string) => void;

  // Tool Execution
  executeTool: (
    employeeId: string,
    toolName: string,
    parameters: Record<string, unknown>,
    userId?: string
  ) => Promise<MCPToolResult>;
  loadToolExecutions: (employeeId: string) => Promise<void>;
  clearToolExecutions: (employeeId: string) => void;

  // Performance and Analytics
  updateEmployeePerformance: (
    employeeId: string,
    performance: PerformanceMetrics
  ) => Promise<void>;
  loadPerformanceHistory: (employeeId: string) => Promise<void>;
  loadAnalytics: () => Promise<void>;

  // Training
  startTraining: (
    employeeId: string,
    trainingType: string,
    trainingData: unknown
  ) => Promise<void>;
  completeTraining: (
    trainingId: string,
    performance: Record<string, unknown>
  ) => Promise<void>;
  loadTrainingRecords: (employeeId: string) => Promise<void>;

  // Job Assignments
  assignJobToEmployee: (
    jobId: string,
    employeeId: string,
    priority?: number,
    estimatedDuration?: number
  ) => Promise<void>;
  updateAssignmentStatus: (
    assignmentId: string,
    status: AssignmentStatus,
    feedback?: string
  ) => Promise<void>;
  loadJobAssignments: (employeeId: string) => Promise<void>;

  // Search and Filtering
  setSearchFilters: (filters: EmployeeSearchFilters) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;

  // Real-time Subscriptions
  subscribeToEmployeeUpdates: (
    employeeId: string,
    callback: (data: unknown) => void
  ) => string;
  subscribeToChatMessages: (
    employeeId: string,
    userId: string,
    callback: (data: unknown) => void
  ) => string;
  subscribeToToolExecutions: (
    employeeId: string,
    callback: (data: unknown) => void
  ) => string;
  unsubscribe: (subscriptionId: string) => void;

  // Notifications
  addNotification: (notification: EmployeeNotification) => void;
  removeNotification: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;

  // Error Handling
  addError: (error: EmployeeError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCompleteAIEmployeeStore = create<AIEmployeeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        employees: {},
        hiredEmployees: [],
        selectedEmployee: null,
        employeeAnalytics: null,

        searchFilters: {},
        searchResults: null,
        searchLoading: false,

        chatMessages: {},
        activeSessions: {},
        currentSession: null,

        toolExecutions: [],
        availableTools: [],
        currentToolCalls: {},
        executionHistory: {},

        performanceHistory: {},
        trainingRecords: {},

        notifications: [],
        errors: [],

        loading: false,
        error: null,
        selectedCategory: 'all',
        viewMode: 'grid',
        sortBy: 'rating',
        sortOrder: 'desc',

        subscriptions: {},

        // Employee Management Actions
        loadEmployees: async (filters = {}, page = 1, limit = 20) => {
          set({ searchLoading: true, error: null });

          try {
            const response = await completeAIEmployeeService.getEmployees(
              filters,
              page,
              limit
            );

            if (response.success && response.data) {
              const employeesMap = response.data.data.reduce(
                (acc, employee) => {
                  acc[employee.id] = employee;
                  return acc;
                },
                {} as Record<string, AIEmployee>
              );

              set({
                employees: { ...get().employees, ...employeesMap },
                searchResults: response.data,
                searchLoading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to load employees',
                searchLoading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, searchLoading: false });
          }
        },

        loadEmployee: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.getEmployee(id);

            if (response.success && response.data) {
              set({
                employees: { ...get().employees, [id]: response.data },
                selectedEmployee: response.data,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to load employee',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        createEmployee: async employee => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.createEmployee(employee);

            if (response.success && response.data) {
              set({
                employees: {
                  ...get().employees,
                  [response.data.id]: response.data,
                },
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to create employee',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        updateEmployee: async (id, updates) => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.updateEmployee(
              id,
              updates
            );

            if (response.success && response.data) {
              set({
                employees: { ...get().employees, [id]: response.data },
                selectedEmployee:
                  get().selectedEmployee?.id === id
                    ? response.data
                    : get().selectedEmployee,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to update employee',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        deleteEmployee: async id => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.deleteEmployee(id);

            if (response.success) {
              const { [id]: deleted, ...remaining } = get().employees;
              set({
                employees: remaining,
                selectedEmployee:
                  get().selectedEmployee?.id === id
                    ? null
                    : get().selectedEmployee,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to delete employee',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        selectEmployee: employee => {
          set({ selectedEmployee: employee });
        },

        // Hiring and Sessions
        hireEmployee: async (employeeId, userId, paymentAmount = 1.0) => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.hireEmployee(
              employeeId,
              userId,
              paymentAmount
            );

            if (response.success) {
              const employee = get().employees[employeeId];
              if (employee) {
                set({
                  hiredEmployees: [...get().hiredEmployees, employee],
                  loading: false,
                });
              }
            } else {
              set({
                error: response.error || 'Failed to hire employee',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        loadHiredEmployees: async userId => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.getUserHiredEmployees(userId);

            if (response.success && response.data) {
              set({
                hiredEmployees: response.data,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to load hired employees',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        startChatSession: async (employeeId, userId) => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.startChatSession(
              employeeId,
              userId
            );

            if (response.success && response.data) {
              set({
                activeSessions: {
                  ...get().activeSessions,
                  [employeeId]: response.data,
                },
                currentSession: response.data,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to start chat session',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        endChatSession: async sessionId => {
          set({ loading: true, error: null });

          try {
            // Update session in database
            const response =
              await completeAIEmployeeService.updateAssignmentStatus(
                sessionId,
                'completed'
              );

            if (response.success) {
              const updatedSessions = { ...get().activeSessions };
              delete updatedSessions[sessionId];

              set({
                activeSessions: updatedSessions,
                currentSession: null,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to end chat session',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        // Chat and Messaging
        sendMessage: async (
          employeeId,
          userId,
          content,
          messageType = 'text'
        ) => {
          try {
            const response = await completeAIEmployeeService.sendChatMessage(
              employeeId,
              userId,
              content,
              messageType,
              { timestamp: new Date().toISOString() }
            );

            if (response.success && response.data) {
              const newMessage = response.data;
              set({
                chatMessages: {
                  ...get().chatMessages,
                  [employeeId]: [
                    ...(get().chatMessages[employeeId] || []),
                    newMessage,
                  ],
                },
              });
            }
          } catch (error: unknown) {
            set({ error: error.message });
          }
        },

        loadChatMessages: async (employeeId, userId) => {
          set({ loading: true, error: null });

          try {
            const response = await completeAIEmployeeService.getChatMessages(
              employeeId,
              userId
            );

            if (response.success && response.data) {
              set({
                chatMessages: {
                  ...get().chatMessages,
                  [employeeId]: response.data,
                },
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to load chat messages',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        clearChatMessages: employeeId => {
          set({
            chatMessages: { ...get().chatMessages, [employeeId]: [] },
          });
        },

        // Tool Execution
        executeTool: async (employeeId, toolName, parameters, userId) => {
          try {
            const response = await completeAIEmployeeService.executeTool(
              employeeId,
              toolName,
              parameters,
              userId
            );

            if (response.success) {
              const execution: ToolExecution = {
                id: `exec-${Date.now()}`,
                employeeId,
                parameters,
                result: response.data,
                success: true,
                executedAt: new Date().toISOString(),
                durationMs: 0,
                userId,
              };

              set({
                toolExecutions: [...get().toolExecutions, execution],
                executionHistory: {
                  ...get().executionHistory,
                  [employeeId]: [
                    ...(get().executionHistory[employeeId] || []),
                    execution,
                  ],
                },
              });
            }

            return {
              success: response.success,
              data: response.data,
              error: response.error,
              executionTime: 0,
            };
          } catch (error: unknown) {
            return {
              success: false,
              error: error.message,
              executionTime: 0,
            };
          }
        },

        loadToolExecutions: async employeeId => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        clearToolExecutions: employeeId => {
          set({
            executionHistory: { ...get().executionHistory, [employeeId]: [] },
          });
        },

        // Performance and Analytics
        updateEmployeePerformance: async (employeeId, performance) => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.updateEmployeePerformance(
                employeeId,
                performance
              );

            if (response.success) {
              const performanceHistory: EmployeePerformanceHistory = {
                id: `perf-${Date.now()}`,
                employeeId,
                performanceData: performance,
                recordedAt: new Date().toISOString(),
              };

              set({
                performanceHistory: {
                  ...get().performanceHistory,
                  [employeeId]: [
                    ...(get().performanceHistory[employeeId] || []),
                    performanceHistory,
                  ],
                },
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to update performance',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        loadPerformanceHistory: async employeeId => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        loadAnalytics: async () => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.getEmployeeAnalytics();

            if (response.success && response.data) {
              set({
                employeeAnalytics: response.data,
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to load analytics',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        // Training
        startTraining: async (employeeId, trainingType, trainingData) => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        completeTraining: async (trainingId, performance) => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        loadTrainingRecords: async employeeId => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        // Job Assignments
        assignJobToEmployee: async (
          jobId,
          employeeId,
          priority = 1,
          estimatedDuration = 60
        ) => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.assignJobToEmployee(
                jobId,
                employeeId,
                priority,
                estimatedDuration
              );

            if (response.success) {
              set({ loading: false });
            } else {
              set({
                error: response.error || 'Failed to assign job',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        updateAssignmentStatus: async (assignmentId, status, feedback) => {
          set({ loading: true, error: null });

          try {
            const response =
              await completeAIEmployeeService.updateAssignmentStatus(
                assignmentId,
                status,
                feedback
              );

            if (response.success) {
              set({ loading: false });
            } else {
              set({
                error: response.error || 'Failed to update assignment',
                loading: false,
              });
            }
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        loadJobAssignments: async employeeId => {
          set({ loading: true, error: null });

          try {
            // This would be implemented in the service
            set({ loading: false });
          } catch (error: unknown) {
            set({ error: error.message, loading: false });
          }
        },

        // Search and Filtering
        setSearchFilters: filters => {
          set({ searchFilters: filters });
        },

        setSearchTerm: term => {
          set({ searchFilters: { ...get().searchFilters, searchTerm: term } });
        },

        setSelectedCategory: category => {
          set({ selectedCategory: category });
        },

        setSortBy: sortBy => {
          set({ sortBy });
        },

        setSortOrder: order => {
          set({ sortOrder: order });
        },

        setViewMode: mode => {
          set({ viewMode: mode });
        },

        // Real-time Subscriptions
        subscribeToEmployeeUpdates: (employeeId, callback) => {
          const subscriptionId = `employee_${employeeId}_${Date.now()}`;
          const subscription =
            completeAIEmployeeService.subscribeToEmployeeUpdates(
              employeeId,
              callback
            );

          set({
            subscriptions: {
              ...get().subscriptions,
              [subscriptionId]: {
                id: subscriptionId,
                event: 'employee_updated',
                callback,
                isActive: true,
              },
            },
          });

          return subscriptionId;
        },

        subscribeToChatMessages: (employeeId, userId, callback) => {
          const subscriptionId = `chat_${employeeId}_${userId}_${Date.now()}`;
          const subscription =
            completeAIEmployeeService.subscribeToChatMessages(
              employeeId,
              userId,
              callback
            );

          set({
            subscriptions: {
              ...get().subscriptions,
              [subscriptionId]: {
                id: subscriptionId,
                event: 'chat_message',
                callback,
                isActive: true,
              },
            },
          });

          return subscriptionId;
        },

        subscribeToToolExecutions: (employeeId, callback) => {
          const subscriptionId = `tool_${employeeId}_${Date.now()}`;

          set({
            subscriptions: {
              ...get().subscriptions,
              [subscriptionId]: {
                id: subscriptionId,
                event: 'tool_execution',
                callback,
                isActive: true,
              },
            },
          });

          return subscriptionId;
        },

        unsubscribe: subscriptionId => {
          completeAIEmployeeService.unsubscribe(subscriptionId);

          const { [subscriptionId]: removed, ...remaining } =
            get().subscriptions;
          set({ subscriptions: remaining });
        },

        // Notifications
        addNotification: notification => {
          set({
            notifications: [...get().notifications, notification],
          });
        },

        removeNotification: notificationId => {
          set({
            notifications: get().notifications.filter(
              n => n.id !== notificationId
            ),
          });
        },

        markNotificationAsRead: notificationId => {
          set({
            notifications: get().notifications.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          });
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Error Handling
        addError: error => {
          set({
            errors: [...get().errors, error],
          });
        },

        removeError: errorId => {
          set({
            errors: get().errors.filter(e => e.id !== errorId),
          });
        },

        clearErrors: () => {
          set({ errors: [] });
        },

        // Utility
        setLoading: loading => {
          set({ loading });
        },

        setError: error => {
          set({ error });
        },

        reset: () => {
          set({
            employees: {},
            hiredEmployees: [],
            selectedEmployee: null,
            employeeAnalytics: null,
            searchFilters: {},
            searchResults: null,
            searchLoading: false,
            chatMessages: {},
            activeSessions: {},
            currentSession: null,
            toolExecutions: [],
            availableTools: [],
            currentToolCalls: {},
            executionHistory: {},
            performanceHistory: {},
            trainingRecords: {},
            notifications: [],
            errors: [],
            loading: false,
            error: null,
            selectedCategory: 'all',
            viewMode: 'grid',
            sortBy: 'rating',
            sortOrder: 'desc',
            subscriptions: {},
          });
        },
      }),
      {
        name: 'ai-employee-store',
        partialize: state => ({
          selectedCategory: state.selectedCategory,
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          searchFilters: state.searchFilters,
        }),
      }
    ),
    {
      name: 'ai-employee-store',
    }
  )
);

// Selectors for common use cases
export const useEmployeeData = () =>
  useCompleteAIEmployeeStore(state => ({
    employees: state.employees,
    hiredEmployees: state.hiredEmployees,
    selectedEmployee: state.selectedEmployee,
    loading: state.loading,
    error: state.error,
  }));

export const useEmployeeActions = () =>
  useCompleteAIEmployeeStore(state => ({
    loadEmployees: state.loadEmployees,
    loadEmployee: state.loadEmployee,
    createEmployee: state.createEmployee,
    updateEmployee: state.updateEmployee,
    deleteEmployee: state.deleteEmployee,
    selectEmployee: state.selectEmployee,
    hireEmployee: state.hireEmployee,
    loadHiredEmployees: state.loadHiredEmployees,
  }));

export const useChatData = () =>
  useCompleteAIEmployeeStore(state => ({
    chatMessages: state.chatMessages,
    activeSessions: state.activeSessions,
    currentSession: state.currentSession,
    loading: state.loading,
    error: state.error,
  }));

export const useChatActions = () =>
  useCompleteAIEmployeeStore(state => ({
    sendMessage: state.sendMessage,
    loadChatMessages: state.loadChatMessages,
    clearChatMessages: state.clearChatMessages,
    startChatSession: state.startChatSession,
    endChatSession: state.endChatSession,
  }));

export const useToolData = () =>
  useCompleteAIEmployeeStore(state => ({
    availableTools: state.availableTools,
    toolExecutions: state.toolExecutions,
    currentToolCalls: state.currentToolCalls,
    executionHistory: state.executionHistory,
    loading: state.loading,
    error: state.error,
  }));

export const useToolActions = () =>
  useCompleteAIEmployeeStore(state => ({
    executeTool: state.executeTool,
    loadToolExecutions: state.loadToolExecutions,
    clearToolExecutions: state.clearToolExecutions,
  }));

export const useSearchData = () =>
  useCompleteAIEmployeeStore(state => ({
    searchFilters: state.searchFilters,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    selectedCategory: state.selectedCategory,
    viewMode: state.viewMode,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }));

export const useSearchActions = () =>
  useCompleteAIEmployeeStore(state => ({
    setSearchFilters: state.setSearchFilters,
    setSearchTerm: state.setSearchTerm,
    setSelectedCategory: state.setSelectedCategory,
    setSortBy: state.setSortBy,
    setSortOrder: state.setSortOrder,
    setViewMode: state.setViewMode,
  }));

export const useAnalyticsData = () =>
  useCompleteAIEmployeeStore(state => ({
    employeeAnalytics: state.employeeAnalytics,
    performanceHistory: state.performanceHistory,
    trainingRecords: state.trainingRecords,
    loading: state.loading,
    error: state.error,
  }));

export const useAnalyticsActions = () =>
  useCompleteAIEmployeeStore(state => ({
    updateEmployeePerformance: state.updateEmployeePerformance,
    loadPerformanceHistory: state.loadPerformanceHistory,
    loadAnalytics: state.loadAnalytics,
    startTraining: state.startTraining,
    completeTraining: state.completeTraining,
    loadTrainingRecords: state.loadTrainingRecords,
  }));

export const useNotificationData = () =>
  useCompleteAIEmployeeStore(state => ({
    notifications: state.notifications,
    errors: state.errors,
    loading: state.loading,
    error: state.error,
  }));

export const useNotificationActions = () =>
  useCompleteAIEmployeeStore(state => ({
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    markNotificationAsRead: state.markNotificationAsRead,
    clearNotifications: state.clearNotifications,
    addError: state.addError,
    removeError: state.removeError,
    clearErrors: state.clearErrors,
  }));

export const useRealtimeData = () =>
  useCompleteAIEmployeeStore(state => ({
    subscriptions: state.subscriptions,
    loading: state.loading,
    error: state.error,
  }));

export const useRealtimeActions = () =>
  useCompleteAIEmployeeStore(state => ({
    subscribeToEmployeeUpdates: state.subscribeToEmployeeUpdates,
    subscribeToChatMessages: state.subscribeToChatMessages,
    subscribeToToolExecutions: state.subscribeToToolExecutions,
    unsubscribe: state.unsubscribe,
  }));
