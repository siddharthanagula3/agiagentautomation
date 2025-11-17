/**
 * Mission Store - AI Workforce Mission Control State Management
 * Manages mission planning, task delegation, and real-time employee status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Task interface for mission plan
export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string | null; // Employee name
  toolRequired?: string;
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// Updated: Nov 16th 2025 - Fixed type mismatch bug - log now accepts objects or strings
export interface EmployeeLogEntry {
  timestamp: Date;
  message: string;
  type: 'contribution' | 'tool_use' | 'error' | 'status';
  metadata?: Record<string, unknown>;
}

// Active employee status
export interface ActiveEmployee {
  name: string;
  status: 'thinking' | 'using_tool' | 'idle' | 'error';
  currentTool: string | null;
  currentTask: string | null;
  log: (string | EmployeeLogEntry)[]; // Accepts both strings and structured entries
  progress: number; // 0-100
}

// Message types for the mission log
export interface MissionMessage {
  id: string;
  from: string; // 'user' | 'system' | employee name
  type:
    | 'user'
    | 'system'
    | 'employee'
    | 'agent' // Multi-agent conversation messages
    | 'assistant' // AI assistant responses
    | 'status' // Status updates
    | 'task_update'
    | 'plan'
    | 'error';
  content: string;
  timestamp: Date;
  metadata?: {
    taskId?: string;
    employeeName?: string;
    employeeAvatar?: string;
    role?: 'agent' | 'supervisor' | 'user'; // Agent conversation roles
    tool?: string;
    model?: string;
    tokens?: number;
    conversationMetadata?: {
      turnCount: number;
      participantCount: number;
      duration: number;
      wasInterrupted: boolean;
      loopDetected: boolean;
    };
  };
}

interface MissionState {
  // Mission planning
  missionPlan: Task[];
  currentMissionId: string | null;
  missionStatus:
    | 'idle'
    | 'planning'
    | 'executing'
    | 'paused'
    | 'completed'
    | 'failed';

  // Active employees
  activeEmployees: Map<string, ActiveEmployee>;

  // Messages/logs
  messages: MissionMessage[];

  // Execution context
  isOrchestrating: boolean;
  isPaused: boolean;
  error: string | null;

  // NEW: Multi-agent chat integration
  mode: 'mission' | 'chat'; // Orchestration mode
  activeChatSession: string | null; // Active chat session ID
  collaborativeAgents: Set<string>; // Agents in collaborative mode

  // Actions
  setMissionPlan: (plan: Task[]) => void;
  updateTaskStatus: (
    taskId: string,
    status: Task['status'],
    assignedTo?: string,
    result?: string,
    error?: string
  ) => void;
  updateEmployeeStatus: (
    employeeName: string,
    status: ActiveEmployee['status'],
    currentTool?: string,
    currentTask?: string
  ) => void;
  addEmployeeLog: (employeeName: string, logEntry: string) => void;
  updateEmployeeProgress: (employeeName: string, progress: number) => void;
  addMessage: (message: Omit<MissionMessage, 'id' | 'timestamp'>) => void;
  startMission: (missionId: string, mode?: 'mission' | 'chat') => void;
  pauseMission: () => void;
  resumeMission: () => void;
  completeMission: () => void;
  failMission: (error: string) => void;
  reset: () => void;
  setOrchestrating: (value: boolean) => void;
  cleanupCompletedTasks: () => void;

  // NEW: Multi-agent chat actions
  setMode: (mode: 'mission' | 'chat') => void;
  setChatSession: (sessionId: string | null) => void;
  addCollaborativeAgent: (agentName: string) => void;
  removeCollaborativeAgent: (agentName: string) => void;
  clearCollaborativeAgents: () => void;
  getAgentStatus: (agentName: string) => ActiveEmployee | undefined;
}

export const useMissionStore = create<MissionState>()(
  devtools(
    immer((set) => ({
      // Initial state
      missionPlan: [],
      currentMissionId: null,
      missionStatus: 'idle',
      activeEmployees: new Map(),
      messages: [],
      isOrchestrating: false,
      isPaused: false,
      error: null,
      mode: 'mission',
      activeChatSession: null,
      collaborativeAgents: new Set(),

      // Set mission plan from orchestrator
      setMissionPlan: (plan) =>
        set((state) => {
          state.missionPlan = plan;
          state.missionStatus = 'planning';
        }),

      // Update individual task status
      updateTaskStatus: (taskId, status, assignedTo, result, error) =>
        set((state) => {
          const task = state.missionPlan.find((t) => t.id === taskId);
          if (task) {
            task.status = status;
            if (assignedTo) task.assignedTo = assignedTo;
            if (result) task.result = result;
            if (error) task.error = error;
            if (status === 'in_progress' && !task.startedAt) {
              task.startedAt = new Date();
            }
            if (
              (status === 'completed' || status === 'failed') &&
              !task.completedAt
            ) {
              task.completedAt = new Date();
            }
          }
        }),

      // Update employee status
      updateEmployeeStatus: (employeeName, status, currentTool, currentTask) =>
        set((state) => {
          let employee = state.activeEmployees.get(employeeName);
          if (!employee) {
            employee = {
              name: employeeName,
              status,
              currentTool: currentTool || null,
              currentTask: currentTask || null,
              log: [],
              progress: 0,
            };
            state.activeEmployees.set(employeeName, employee);
          } else {
            employee.status = status;
            if (currentTool !== undefined) employee.currentTool = currentTool;
            if (currentTask !== undefined) employee.currentTask = currentTask;
          }
        }),

      // Add log entry to employee
      addEmployeeLog: (employeeName, logEntry) =>
        set((state) => {
          const employee = state.activeEmployees.get(employeeName);
          if (employee) {
            employee.log.push(logEntry);
          }
        }),

      // Update employee progress
      updateEmployeeProgress: (employeeName, progress) =>
        set((state) => {
          const employee = state.activeEmployees.get(employeeName);
          if (employee) {
            employee.progress = Math.min(100, Math.max(0, progress));
          }
        }),

      // Add message to mission log
      addMessage: (message) =>
        set((state) => {
          state.messages.push({
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          });
        }),

      // Start mission
      startMission: (missionId, mode = 'mission') =>
        set((state) => {
          // Updated: Nov 16th 2025 - Fixed concurrent mission state corruption with mutex check
          // Prevent concurrent mission starts from corrupting state
          if (state.isOrchestrating) {
            throw new Error('Mission already in progress');
          }
          state.currentMissionId = missionId;
          state.missionStatus = 'executing';
          state.isOrchestrating = true;
          state.error = null;
          state.mode = mode;
        }),

      // Pause mission
      pauseMission: () =>
        set((state) => {
          state.missionStatus = 'paused';
          state.isPaused = true;
        }),

      // Resume mission
      resumeMission: () =>
        set((state) => {
          state.missionStatus = 'executing';
          state.isPaused = false;
        }),

      // Complete mission
      completeMission: () =>
        set((state) => {
          state.missionStatus = 'completed';
          state.isOrchestrating = false;
          state.isPaused = false;
        }),

      // Fail mission
      failMission: (error) =>
        set((state) => {
          state.missionStatus = 'failed';
          state.isOrchestrating = false;
          state.isPaused = false;
          state.error = error;
        }),

      // Reset state
      reset: () =>
        set((state) => {
          state.missionPlan = [];
          state.currentMissionId = null;
          state.missionStatus = 'idle';
          state.activeEmployees.clear();
          state.messages = [];
          state.isOrchestrating = false;
          state.isPaused = false;
          state.error = null;
          state.mode = 'mission';
          state.activeChatSession = null;
          state.collaborativeAgents.clear();
        }),

      // Set orchestrating flag
      setOrchestrating: (value) =>
        set((state) => {
          state.isOrchestrating = value;
        }),

      // Cleanup completed tasks and idle employees
      // Should be called periodically to prevent memory leaks
      cleanupCompletedTasks: () =>
        set((state) => {
          const oneHourAgo = Date.now() - 60 * 60 * 1000;

          // Remove completed/failed tasks older than 1 hour
          state.missionPlan = state.missionPlan.filter((task) => {
            if (
              (task.status === 'completed' || task.status === 'failed') &&
              task.completedAt
            ) {
              return task.completedAt.getTime() > oneHourAgo;
            }
            return true; // Keep pending and in_progress tasks
          });

          // Remove idle employees that haven't been active for 1 hour
          const employeesToRemove: string[] = [];
          state.activeEmployees.forEach((employee, name) => {
            if (employee.status === 'idle' || employee.status === 'error') {
              // Check if employee has any log entries
              if (employee.log.length > 0) {
                // If no recent activity, mark for removal
                const lastLogTime = employee.log.length > 0 ? Date.now() : 0;
                if (lastLogTime < oneHourAgo) {
                  employeesToRemove.push(name);
                }
              }
            }
          });

          // Remove marked employees
          employeesToRemove.forEach((name) => {
            state.activeEmployees.delete(name);
          });

          // Limit message history to last 100 messages
          if (state.messages.length > 100) {
            state.messages = state.messages.slice(-100);
          }

          if (employeesToRemove.length > 0 || state.missionPlan.length > 0) {
            console.log(
              `[MissionStore] Cleaned up ${employeesToRemove.length} idle employees and pruned old tasks/messages`
            );
          }
        }),

      // NEW: Multi-agent chat actions
      setMode: (mode: 'mission' | 'chat') =>
        set((state) => {
          state.mode = mode;
        }),

      setChatSession: (sessionId: string | null) =>
        set((state) => {
          state.activeChatSession = sessionId;
        }),

      addCollaborativeAgent: (agentName: string) =>
        set((state) => {
          state.collaborativeAgents.add(agentName);
        }),

      removeCollaborativeAgent: (agentName: string) =>
        set((state) => {
          state.collaborativeAgents.delete(agentName);
        }),

      clearCollaborativeAgents: () =>
        set((state) => {
          state.collaborativeAgents.clear();
        }),

      getAgentStatus: (agentName: string) => {
        return useMissionStore.getState().activeEmployees.get(agentName);
      },
    })),
    { name: 'MissionStore' }
  )
);

// Setup periodic cleanup (runs every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      useMissionStore.getState().cleanupCompletedTasks();
    },
    5 * 60 * 1000
  ); // Every 5 minutes
}

// Selector hooks for optimized re-renders
export const useMissionPlan = () =>
  useMissionStore((state) => state.missionPlan);
export const useActiveEmployees = () =>
  useMissionStore((state) => state.activeEmployees);
export const useMissionMessages = () =>
  useMissionStore((state) => state.messages);
export const useMissionStatus = () =>
  useMissionStore((state) => ({
    status: state.missionStatus,
    isOrchestrating: state.isOrchestrating,
    isPaused: state.isPaused,
    error: state.error,
  }));
