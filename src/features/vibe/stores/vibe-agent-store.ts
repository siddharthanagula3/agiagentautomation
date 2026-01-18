/**
 * Vibe Agent Store
 * State management for active agents and their real-time status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { ActiveAgent, AgentStatus } from '../types';
import type { AIEmployee } from '@core/types/ai-employee';

export interface VibeAgentState {
  // Active agents
  activeAgents: Record<string, ActiveAgent>;

  // Current primary agent
  primaryAgent: ActiveAgent | null;

  // Supervisor mode
  isSupervisorMode: boolean;
  supervisorAgent: ActiveAgent | null;

  // Actions
  addActiveAgent: (employee: AIEmployee) => void;
  removeActiveAgent: (employeeId: string) => void;
  updateAgentStatus: (
    employeeId: string,
    status: AgentStatus,
    currentTask?: string,
    progress?: number
  ) => void;
  setPrimaryAgent: (employee: AIEmployee) => void;
  setSupervisorMode: (isEnabled: boolean, supervisor?: AIEmployee) => void;
  clearActiveAgents: () => void;
  getActiveAgent: (employeeId: string) => ActiveAgent | undefined;
}

export const useVibeAgentStore = create<VibeAgentState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      activeAgents: {},
      primaryAgent: null,
      isSupervisorMode: false,
      supervisorAgent: null,

      // Actions
      addActiveAgent: (employee) => {
        set((state) => {
          const activeAgent: ActiveAgent = {
            employee,
            status: 'idle',
            last_activity: new Date(),
          };
          state.activeAgents[employee.name] = activeAgent;
        });
      },

      removeActiveAgent: (employeeId) => {
        set((state) => {
          delete state.activeAgents[employeeId];
        });
      },

      updateAgentStatus: (employeeId, status, currentTask, progress) => {
        set((state) => {
          const agent = state.activeAgents[employeeId];
          if (agent) {
            agent.status = status;
            agent.last_activity = new Date();
            if (currentTask !== undefined) {
              agent.current_task = currentTask;
            }
            if (progress !== undefined) {
              agent.progress = progress;
            }
          }
        });
      },

      setPrimaryAgent: (employee) => {
        set((state) => {
          const activeAgent: ActiveAgent = {
            employee,
            status: 'idle',
            last_activity: new Date(),
          };
          state.primaryAgent = activeAgent;

          // Ensure agent is in active agents
          if (!(employee.name in state.activeAgents)) {
            state.activeAgents[employee.name] = activeAgent;
          }
        });
      },

      setSupervisorMode: (isEnabled, supervisor) => {
        set((state) => {
          state.isSupervisorMode = isEnabled;
          if (supervisor) {
            state.supervisorAgent = {
              employee: supervisor,
              status: 'idle',
              last_activity: new Date(),
            };
            // Add supervisor to active agents
            state.activeAgents[supervisor.name] = state.supervisorAgent;
          } else {
            state.supervisorAgent = null;
          }
        });
      },

      clearActiveAgents: () => {
        set((state) => {
          state.activeAgents = {};
          state.primaryAgent = null;
          state.isSupervisorMode = false;
          state.supervisorAgent = null;
        });
      },

      getActiveAgent: (employeeId) => {
        return get().activeAgents[employeeId];
      },
    })),
    { name: 'VibeAgentStore' }
  )
);

// ============================================================================
// SELECTOR HOOKS (optimized with useShallow to prevent stale closures)
// ============================================================================

/**
 * Selector for active agents record - returns stable reference
 */
export const useActiveAgentsRecord = () =>
  useVibeAgentStore((state) => state.activeAgents);

/**
 * Selector for primary agent - returns stable reference when agent hasn't changed
 */
export const usePrimaryAgent = () =>
  useVibeAgentStore((state) => state.primaryAgent);

/**
 * Selector for supervisor mode state - uses useShallow for multi-value selection
 */
export const useSupervisorModeState = () =>
  useVibeAgentStore(
    useShallow((state) => ({
      isSupervisorMode: state.isSupervisorMode,
      supervisorAgent: state.supervisorAgent,
    }))
  );

/**
 * Selector for a specific active agent by ID - returns stable reference
 */
export const useVibeActiveAgent = (employeeId: string) =>
  useVibeAgentStore((state) => state.activeAgents[employeeId]);

/**
 * Selector for active agents count - derived value
 */
export const useActiveAgentsCount = () =>
  useVibeAgentStore((state) => Object.keys(state.activeAgents).length);
