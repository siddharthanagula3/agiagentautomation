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

// Active employee status
export interface ActiveEmployee {
  name: string;
  status: 'thinking' | 'using_tool' | 'idle' | 'error';
  currentTool: string | null;
  currentTask: string | null;
  log: string[];
  progress: number; // 0-100
}

// Message types for the mission log
export interface MissionMessage {
  id: string;
  from: string; // 'user' | 'system' | employee name
  type: 'user' | 'system' | 'employee' | 'task_update' | 'plan' | 'error';
  content: string;
  timestamp: Date;
  metadata?: {
    taskId?: string;
    employeeName?: string;
    tool?: string;
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
  startMission: (missionId: string) => void;
  pauseMission: () => void;
  resumeMission: () => void;
  completeMission: () => void;
  failMission: (error: string) => void;
  reset: () => void;
  setOrchestrating: (value: boolean) => void;
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
      startMission: (missionId) =>
        set((state) => {
          state.currentMissionId = missionId;
          state.missionStatus = 'executing';
          state.isOrchestrating = true;
          state.error = null;
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
        }),

      // Set orchestrating flag
      setOrchestrating: (value) =>
        set((state) => {
          state.isOrchestrating = value;
        }),
    })),
    { name: 'MissionStore' }
  )
);

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
