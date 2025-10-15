/**
 * Agent Metrics Store
 * Tracks real-time metrics from agent activity and chat sessions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AgentStatus,
  AgentCommunication,
} from '@_core/orchestration/multi-agent-orchestrator';

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  taskDescription: string;
  agentsInvolved: string[];
  messagesCount: number;
  tokensUsed: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export interface AgentMetrics {
  // Overall statistics
  totalSessions: number;
  activeSessions: number;
  completedTasks: number;
  failedTasks: number;

  // Agent workforce
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;

  // Usage metrics
  totalTokensUsed: number;
  totalMessagesExchanged: number;
  averageResponseTime: number;

  // Success metrics
  successRate: number;
  averageTaskDuration: number;

  // Real-time tracking
  currentSessions: ChatSession[];
  recentActivity: Array<{
    id: string;
    type:
      | 'session_start'
      | 'session_end'
      | 'agent_communication'
      | 'task_complete'
      | 'task_failed';
    message: string;
    timestamp: Date;
    agentName?: string;
  }>;

  // Agent status tracking
  agentStatuses: Map<string, AgentStatus>;
  agentCommunications: AgentCommunication[];
}

interface AgentMetricsState extends AgentMetrics {
  // Actions
  startSession: (
    session: Omit<ChatSession, 'id' | 'startTime' | 'lastActivity' | 'isActive'>
  ) => string;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  endSession: (
    sessionId: string,
    status: 'completed' | 'failed',
    result?: string
  ) => void;

  updateAgentStatus: (agentName: string, status: AgentStatus) => void;
  addCommunication: (communication: AgentCommunication) => void;

  addActivity: (
    activity: Omit<AgentMetricsState['recentActivity'][0], 'id' | 'timestamp'>
  ) => void;

  incrementTokens: (amount: number) => void;

  // Computed getters
  getActiveSessionsCount: () => number;
  getTodayTasksCount: () => number;
  getSuccessRate: () => number;

  // Background service control
  isBackgroundServiceRunning: boolean;
  setBackgroundServiceRunning: (running: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState: AgentMetrics = {
  totalSessions: 0,
  activeSessions: 0,
  completedTasks: 0,
  failedTasks: 0,

  totalAgents: 0,
  activeAgents: 0,
  idleAgents: 0,

  totalTokensUsed: 0,
  totalMessagesExchanged: 0,
  averageResponseTime: 0,

  successRate: 0,
  averageTaskDuration: 0,

  currentSessions: [],
  recentActivity: [],

  agentStatuses: new Map(),
  agentCommunications: [],
};

export const useAgentMetricsStore = create<AgentMetricsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      isBackgroundServiceRunning: false,

      startSession: (sessionData) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const newSession: ChatSession = {
          ...sessionData,
          id: sessionId,
          startTime: now,
          lastActivity: now,
          isActive: true,
          status: 'in_progress',
          messagesCount: 0,
          tokensUsed: 0,
        };

        set((state) => ({
          totalSessions: state.totalSessions + 1,
          activeSessions: state.activeSessions + 1,
          currentSessions: [...state.currentSessions, newSession],
        }));

        get().addActivity({
          type: 'session_start',
          message: `Started new task: ${sessionData.taskDescription}`,
        });

        return sessionId;
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          currentSessions: state.currentSessions.map((session) =>
            session.id === sessionId
              ? { ...session, ...updates, lastActivity: new Date() }
              : session
          ),
        }));
      },

      endSession: (sessionId, status, result) => {
        const session = get().currentSessions.find((s) => s.id === sessionId);

        if (session) {
          const duration = Date.now() - session.startTime.getTime();

          set((state) => ({
            currentSessions: state.currentSessions.map((s) =>
              s.id === sessionId ? { ...s, isActive: false, status, result } : s
            ),
            activeSessions: state.activeSessions - 1,
            completedTasks:
              status === 'completed'
                ? state.completedTasks + 1
                : state.completedTasks,
            failedTasks:
              status === 'failed' ? state.failedTasks + 1 : state.failedTasks,
            averageTaskDuration:
              state.completedTasks > 0
                ? (state.averageTaskDuration * state.completedTasks +
                    duration) /
                  (state.completedTasks + 1)
                : duration,
          }));

          get().addActivity({
            type: status === 'completed' ? 'task_complete' : 'task_failed',
            message:
              status === 'completed'
                ? `Completed task: ${session.taskDescription}`
                : `Failed task: ${session.taskDescription}`,
          });
        }
      },

      updateAgentStatus: (agentName, status) => {
        set((state) => {
          const newStatuses = new Map(state.agentStatuses);
          const oldStatus = newStatuses.get(agentName);
          newStatuses.set(agentName, status);

          // Count active vs idle agents
          let activeCount = 0;
          let idleCount = 0;

          newStatuses.forEach((s) => {
            if (s.status === 'working' || s.status === 'analyzing') {
              activeCount++;
            } else if (s.status === 'idle') {
              idleCount++;
            }
          });

          return {
            agentStatuses: newStatuses,
            totalAgents: newStatuses.size,
            activeAgents: activeCount,
            idleAgents: idleCount,
          };
        });
      },

      addCommunication: (communication) => {
        set((state) => ({
          agentCommunications: [...state.agentCommunications, communication],
          totalMessagesExchanged: state.totalMessagesExchanged + 1,
        }));

        get().addActivity({
          type: 'agent_communication',
          message: `${communication.from} → ${communication.to}: ${communication.type}`,
          agentName: communication.from,
        });
      },

      addActivity: (activity) => {
        const newActivity = {
          ...activity,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          recentActivity: [newActivity, ...state.recentActivity].slice(0, 50), // Keep last 50
        }));
      },

      incrementTokens: (amount) => {
        set((state) => ({
          totalTokensUsed: state.totalTokensUsed + amount,
        }));
      },

      getActiveSessionsCount: () => {
        return get().currentSessions.filter((s) => s.isActive).length;
      },

      getTodayTasksCount: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return get().currentSessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        }).length;
      },

      getSuccessRate: () => {
        const state = get();
        const total = state.completedTasks + state.failedTasks;

        if (total === 0) return 0;

        return (state.completedTasks / total) * 100;
      },

      setBackgroundServiceRunning: (running) => {
        set({ isBackgroundServiceRunning: running });
      },

      reset: () => {
        set({
          ...initialState,
          isBackgroundServiceRunning: false,
        });
      },
    }),
    {
      name: 'agent-metrics-storage',
      partialize: (state) => ({
        totalSessions: state.totalSessions,
        completedTasks: state.completedTasks,
        failedTasks: state.failedTasks,
        totalTokensUsed: state.totalTokensUsed,
        totalMessagesExchanged: state.totalMessagesExchanged,
        currentSessions: state.currentSessions,
        recentActivity: state.recentActivity,
      }),
    }
  )
);
