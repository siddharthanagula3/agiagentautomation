/**
 * Company Hub Store
 * Manages multi-agent collaboration workspace state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { AgentStatus } from '@core/ai/orchestration/agent-collaboration-manager';
import type { TokenUsageByModel } from '@core/integrations/token-usage-tracker';

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  role: string;
  provider: string;
  status: AgentStatus['status'];
  currentTask?: string;
  progress: number;
  toolsUsing?: string[];
  output?: string;
  error?: string;
}

export interface HubMessage {
  id: string;
  sessionId: string;
  from: string; // Agent name or 'user' or 'system'
  to?: string; // Target agent or 'all'
  type:
    | 'user'
    | 'agent'
    | 'system'
    | 'handoff'
    | 'completion'
    | 'error'
    | 'upsell';
  content: string;
  timestamp: Date;
  metadata?: {
    agentId?: string;
    taskId?: string;
    provider?: string;
    model?: string;
  };
}

export interface UpsellRequest {
  id: string;
  requiredEmployeeId: string;
  requiredEmployeeName: string;
  requiredEmployeeRole: string;
  provider: string;
  price: number;
  reason: string;
  taskDescription: string;
  isResolved: boolean;
  userResponse?: 'approved' | 'denied';
  timestamp: Date;
}

export interface CompanyHubSession {
  id: string;
  userId: string;
  taskDescription: string;
  assignedAgents: AgentAssignment[];
  status: 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface CompanyHubState {
  // Session management
  activeSessionId: string | null;
  sessions: Record<string, CompanyHubSession>;

  // Agent tracking (using Record for Immer compatibility)
  assignedAgents: Record<string, AgentAssignment>;
  agentStatuses: Record<string, AgentStatus>;

  // Token usage
  tokenUsage: TokenUsageByModel;
  sessionTokens: number;
  sessionCost: number;

  // Messages
  messages: HubMessage[];

  // Upsell
  upsellQueue: UpsellRequest[];
  pendingUpsell: UpsellRequest | null;

  // UI state
  isOrchestrating: boolean;
  isPaused: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface CompanyHubActions {
  // Session management
  createSession: (userId: string, taskDescription: string) => string;
  setActiveSession: (sessionId: string | null) => void;
  updateSessionStatus: (
    sessionId: string,
    status: CompanyHubSession['status']
  ) => void;
  completeSession: (sessionId: string) => void;

  // Agent management
  assignAgent: (agent: AgentAssignment) => void;
  updateAgentStatus: (agentId: string, status: Partial<AgentStatus>) => void;
  removeAgent: (agentId: string) => void;
  clearAgents: () => void;

  // Token tracking
  updateTokenUsage: (usage: Partial<TokenUsageByModel>) => void;
  addTokens: (
    model: string,
    tokens: number,
    cost: number,
    provider: string
  ) => void;
  resetTokenUsage: () => void;

  // Messages
  addMessage: (message: Omit<HubMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Upsell management
  addUpsellRequest: (
    request: Omit<UpsellRequest, 'id' | 'timestamp' | 'isResolved'>
  ) => void;
  resolveUpsell: (requestId: string, response: 'approved' | 'denied') => void;
  setPendingUpsell: (request: UpsellRequest | null) => void;

  // Orchestration control
  startOrchestration: () => void;
  pauseOrchestration: () => void;
  resumeOrchestration: () => void;
  stopOrchestration: () => void;

  // Utility
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface CompanyHubStore extends CompanyHubState, CompanyHubActions {}

const INITIAL_STATE: CompanyHubState = {
  activeSessionId: null,
  sessions: {},
  assignedAgents: {},
  agentStatuses: {},
  tokenUsage: {},
  sessionTokens: 0,
  sessionCost: 0,
  messages: [],
  upsellQueue: [],
  pendingUpsell: null,
  isOrchestrating: false,
  isPaused: false,
  error: null,
  lastUpdate: null,
};

const enableDevtools = import.meta.env.MODE !== 'production';

export const useCompanyHubStore = create<CompanyHubStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...INITIAL_STATE,

        // Session management
        createSession: (userId: string, taskDescription: string) => {
          const sessionId = crypto.randomUUID();
          const now = new Date();

          set((state) => {
            const session: CompanyHubSession = {
              id: sessionId,
              userId,
              taskDescription,
              assignedAgents: [],
              status: 'planning',
              createdAt: now,
              updatedAt: now,
            };

            state.sessions[sessionId] = session;
            state.activeSessionId = sessionId;
            state.lastUpdate = now;
          });

          return sessionId;
        },

        setActiveSession: (sessionId: string | null) => {
          set((state) => {
            state.activeSessionId = sessionId;
            state.lastUpdate = new Date();
          });
        },

        updateSessionStatus: (
          sessionId: string,
          status: CompanyHubSession['status']
        ) => {
          set((state) => {
            if (state.sessions[sessionId]) {
              state.sessions[sessionId].status = status;
              state.sessions[sessionId].updatedAt = new Date();
            }
          });
        },

        completeSession: (sessionId: string) => {
          set((state) => {
            if (state.sessions[sessionId]) {
              state.sessions[sessionId].status = 'completed';
              state.sessions[sessionId].completedAt = new Date();
              state.sessions[sessionId].updatedAt = new Date();
              state.isOrchestrating = false;
            }
          });
        },

        // Agent management
        assignAgent: (agent: AgentAssignment) => {
          set((state) => {
            // Check if agent already exists with same data (avoid unnecessary updates)
            const existingAgent = state.assignedAgents[agent.agentId];
            if (
              existingAgent &&
              existingAgent.status === agent.status &&
              existingAgent.progress === agent.progress &&
              existingAgent.currentTask === agent.currentTask
            ) {
              return; // Already assigned with same state, skip update
            }

            // Atomic update: update both assignedAgents and session.assignedAgents together
            state.assignedAgents[agent.agentId] = agent;
            state.lastUpdate = new Date();

            // Update session
            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              const session = state.sessions[state.activeSessionId];
              const existingIndex = session.assignedAgents.findIndex(
                (a) => a.agentId === agent.agentId
              );
              if (existingIndex >= 0) {
                session.assignedAgents[existingIndex] = agent;
              } else {
                session.assignedAgents.push(agent);
              }
              session.updatedAt = new Date();
            }
          });
        },

        updateAgentStatus: (agentId: string, status: Partial<AgentStatus>) => {
          set((state) => {
            // Single source of truth: assignedAgents is the primary store
            // agentStatuses is kept in sync for backward compatibility
            const agent = state.assignedAgents[agentId];
            if (agent) {
              // Merge status into the agent assignment
              const updatedAgent = { ...agent, ...status };
              state.assignedAgents[agentId] = updatedAgent;

              // Also update in session's assignedAgents for consistency
              if (
                state.activeSessionId &&
                state.sessions[state.activeSessionId]
              ) {
                const session = state.sessions[state.activeSessionId];
                const sessionAgentIndex = session.assignedAgents.findIndex(
                  (a) => a.agentId === agentId
                );
                if (sessionAgentIndex >= 0) {
                  session.assignedAgents[sessionAgentIndex] = updatedAgent;
                }
              }

              state.lastUpdate = new Date();
            }

            // Keep agentStatuses in sync (secondary store for status queries)
            const existingStatus = state.agentStatuses[agentId];
            if (existingStatus) {
              state.agentStatuses[agentId] = {
                ...existingStatus,
                ...status,
              } as AgentStatus;
            } else if (agent) {
              // Only create agentStatuses entry if agent exists
              state.agentStatuses[agentId] = status as AgentStatus;
            }
          });
        },

        removeAgent: (agentId: string) => {
          set((state) => {
            delete state.assignedAgents[agentId];
            delete state.agentStatuses[agentId];
            state.lastUpdate = new Date();

            // Update session
            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              const session = state.sessions[state.activeSessionId];
              session.assignedAgents = session.assignedAgents.filter(
                (a) => a.agentId !== agentId
              );
              session.updatedAt = new Date();
            }
          });
        },

        clearAgents: () => {
          set((state) => {
            state.assignedAgents = {};
            state.agentStatuses = {};
            state.lastUpdate = new Date();

            // Update session
            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              state.sessions[state.activeSessionId].assignedAgents = [];
              state.sessions[state.activeSessionId].updatedAt = new Date();
            }
          });
        },

        // Token tracking
        updateTokenUsage: (usage: Partial<TokenUsageByModel>) => {
          set((state) => {
            Object.entries(usage).forEach(([model, stats]) => {
              if (state.tokenUsage[model]) {
                state.tokenUsage[model].totalTokens += stats.totalTokens;
                state.tokenUsage[model].cost += stats.cost;
                state.tokenUsage[model].callCount += stats.callCount || 1;
              } else {
                state.tokenUsage[model] = { ...stats };
              }
            });

            // Recalculate totals
            state.sessionTokens = Object.values(state.tokenUsage).reduce(
              (sum, stat) => sum + stat.totalTokens,
              0
            );
            state.sessionCost = Object.values(state.tokenUsage).reduce(
              (sum, stat) => sum + stat.cost,
              0
            );
            state.lastUpdate = new Date();
          });
        },

        addTokens: (
          model: string,
          tokens: number,
          cost: number,
          provider: string
        ) => {
          set((state) => {
            if (!state.tokenUsage[model]) {
              state.tokenUsage[model] = {
                provider: provider as
                  | 'anthropic'
                  | 'openai'
                  | 'google'
                  | 'perplexity',
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                cost: 0,
                callCount: 0,
              };
            }

            state.tokenUsage[model].totalTokens += tokens;
            state.tokenUsage[model].cost += cost;
            state.tokenUsage[model].callCount += 1;

            state.sessionTokens += tokens;
            state.sessionCost += cost;
            state.lastUpdate = new Date();
          });
        },

        resetTokenUsage: () => {
          set((state) => {
            state.tokenUsage = {};
            state.sessionTokens = 0;
            state.sessionCost = 0;
            state.lastUpdate = new Date();
          });
        },

        // Messages
        addMessage: (message: Omit<HubMessage, 'id' | 'timestamp'>) => {
          set((state) => {
            const newMessage: HubMessage = {
              ...message,
              id: crypto.randomUUID(),
              timestamp: new Date(),
            };

            state.messages.push(newMessage);
            state.lastUpdate = new Date();
          });
        },

        clearMessages: () => {
          set((state) => {
            state.messages = [];
            state.lastUpdate = new Date();
          });
        },

        // Upsell management
        addUpsellRequest: (
          request: Omit<UpsellRequest, 'id' | 'timestamp' | 'isResolved'>
        ) => {
          set((state) => {
            const newRequest: UpsellRequest = {
              ...request,
              id: crypto.randomUUID(),
              timestamp: new Date(),
              isResolved: false,
            };

            state.upsellQueue.push(newRequest);
            state.pendingUpsell = newRequest;
            state.isPaused = true; // Pause orchestration until resolved
            state.lastUpdate = new Date();
          });
        },

        resolveUpsell: (requestId: string, response: 'approved' | 'denied') => {
          set((state) => {
            const request = state.upsellQueue.find((r) => r.id === requestId);
            if (request) {
              request.isResolved = true;
              request.userResponse = response;
            }

            state.pendingUpsell = null;
            state.isPaused = false; // Resume orchestration
            state.lastUpdate = new Date();
          });
        },

        setPendingUpsell: (request: UpsellRequest | null) => {
          set((state) => {
            state.pendingUpsell = request;
            state.isPaused = request !== null;
          });
        },

        // Orchestration control
        startOrchestration: () => {
          set((state) => {
            state.isOrchestrating = true;
            state.isPaused = false;
            state.error = null;
            state.lastUpdate = new Date();

            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              state.sessions[state.activeSessionId].status = 'executing';
              state.sessions[state.activeSessionId].updatedAt = new Date();
            }
          });
        },

        pauseOrchestration: () => {
          set((state) => {
            state.isPaused = true;
            state.lastUpdate = new Date();

            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              state.sessions[state.activeSessionId].status = 'paused';
              state.sessions[state.activeSessionId].updatedAt = new Date();
            }
          });
        },

        resumeOrchestration: () => {
          set((state) => {
            state.isPaused = false;
            state.lastUpdate = new Date();

            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              state.sessions[state.activeSessionId].status = 'executing';
              state.sessions[state.activeSessionId].updatedAt = new Date();
            }
          });
        },

        stopOrchestration: () => {
          set((state) => {
            state.isOrchestrating = false;
            state.isPaused = false;
            state.lastUpdate = new Date();

            if (
              state.activeSessionId &&
              state.sessions[state.activeSessionId]
            ) {
              state.sessions[state.activeSessionId].status = 'completed';
              state.sessions[state.activeSessionId].completedAt = new Date();
              state.sessions[state.activeSessionId].updatedAt = new Date();
            }
          });
        },

        // Utility
        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
            if (error) {
              state.isOrchestrating = false;
              if (
                state.activeSessionId &&
                state.sessions[state.activeSessionId]
              ) {
                state.sessions[state.activeSessionId].status = 'failed';
                state.sessions[state.activeSessionId].updatedAt = new Date();
              }
            }
          });
        },

        reset: () => {
          set(() => ({ ...INITIAL_STATE }));
        },
      })),
      {
        name: 'agi-company-hub-store',
        version: 1,
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
        }),
      }
    ),
    {
      name: 'Company Hub Store',
      enabled: enableDevtools,
    }
  )
);

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

/**
 * Selector for active session - returns stable reference when session hasn't changed
 */
export const useActiveSession = () =>
  useCompanyHubStore((state) =>
    state.activeSessionId ? state.sessions[state.activeSessionId] : null
  );

/**
 * Selector for assigned agents record - returns stable reference to the record
 * Use this when you need access to agents by ID
 */
export const useAssignedAgentsRecord = () =>
  useCompanyHubStore((state) => state.assignedAgents);

/**
 * Selector for assigned agents as array - memoized through store
 * Note: Returns a new array reference on each call. For optimized renders,
 * prefer useAssignedAgentsRecord and derive the array with useMemo in the component.
 */
export const useAssignedAgents = () =>
  useCompanyHubStore((state) => Object.values(state.assignedAgents));

/**
 * Selector for a specific agent by ID - returns stable reference when agent hasn't changed
 */
export const useAssignedAgent = (agentId: string) =>
  useCompanyHubStore((state) => state.assignedAgents[agentId]);

/**
 * Selector for token usage - uses useShallow for multi-value selection
 */
export const useTokenUsage = () =>
  useCompanyHubStore(
    useShallow((state) => ({
      byModel: state.tokenUsage,
      totalTokens: state.sessionTokens,
      totalCost: state.sessionCost,
    }))
  );

/**
 * Selector for hub messages - returns stable reference when messages haven't changed
 */
export const useHubMessages = () =>
  useCompanyHubStore((state) => state.messages);

/**
 * Selector for pending upsell - returns stable reference
 */
export const usePendingUpsell = () =>
  useCompanyHubStore((state) => state.pendingUpsell);

/**
 * Selector for orchestration status - uses useShallow for multi-value selection
 */
export const useOrchestrationStatus = () =>
  useCompanyHubStore(
    useShallow((state) => ({
      isOrchestrating: state.isOrchestrating,
      isPaused: state.isPaused,
      error: state.error,
    }))
  );

/**
 * Selector for active session ID - primitive value, no shallow needed
 */
export const useActiveSessionId = () =>
  useCompanyHubStore((state) => state.activeSessionId);

/**
 * Selector for upsell queue - returns stable reference
 */
export const useUpsellQueue = () =>
  useCompanyHubStore((state) => state.upsellQueue);

/**
 * Selector for last update timestamp - primitive value
 */
export const useLastUpdate = () =>
  useCompanyHubStore((state) => state.lastUpdate);
