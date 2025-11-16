/**
 * Vibe Agent Store
 * State management for active agents and their real-time status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ActiveAgent, AgentStatus } from '../types';
import type { AIEmployee } from '@core/types/ai-employee';

export interface VibeAgentState {
  // Active agents
  activeAgents: Map<string, ActiveAgent>;

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
  setSupervisorMode: (
    isEnabled: boolean,
    supervisor?: AIEmployee
  ) => void;
  clearActiveAgents: () => void;
  getActiveAgent: (employeeId: string) => ActiveAgent | undefined;
}

export const useVibeAgentStore = create<VibeAgentState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      activeAgents: new Map(),
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
          state.activeAgents.set(employee.name, activeAgent);
        });
      },

      removeActiveAgent: (employeeId) => {
        set((state) => {
          state.activeAgents.delete(employeeId);
        });
      },

      updateAgentStatus: (employeeId, status, currentTask, progress) => {
        set((state) => {
          const agent = state.activeAgents.get(employeeId);
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
          if (!state.activeAgents.has(employee.name)) {
            state.activeAgents.set(employee.name, activeAgent);
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
            state.activeAgents.set(supervisor.name, state.supervisorAgent);
          } else {
            state.supervisorAgent = null;
          }
        });
      },

      clearActiveAgents: () => {
        set((state) => {
          state.activeAgents.clear();
          state.primaryAgent = null;
          state.isSupervisorMode = false;
          state.supervisorAgent = null;
        });
      },

      getActiveAgent: (employeeId) => {
        return get().activeAgents.get(employeeId);
      },
    })),
    { name: 'VibeAgentStore' }
  )
);
