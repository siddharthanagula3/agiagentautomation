/**
 * Mission-Chat State Bridge
 * Bridges mission-control-store (orchestration) with chat-store (UI)
 * Converts mission events into chat messages with work stream data
 */

import { useEffect } from 'react';
import { useMissionStore } from './mission-control-store';
import { useChatStore } from './chat-store';
import type { MissionMessage } from './mission-control-store';
import type { Message } from './chat-store';

/**
 * Convert MissionMessage to ChatMessage with work stream data
 */
function missionMessageToChatMessage(
  missionMsg: MissionMessage,
  conversationId: string
): Omit<Message, 'id' | 'timestamp'> {
  const isSystem = missionMsg.type === 'system' || missionMsg.from === 'system';
  const isEmployee = missionMsg.type === 'employee';

  // Build work stream data if this is an employee message
  const workStreamData = isEmployee
    ? {
        employeeId: missionMsg.metadata?.employeeName || missionMsg.from,
        employeeName: missionMsg.metadata?.employeeName || missionMsg.from,
        employeeColor: getEmployeeColor(missionMsg.from),
        workItems: [],
        isActive: false,
      }
    : undefined;

  return {
    conversationId,
    role: isSystem ? 'system' : 'assistant',
    content: missionMsg.content,
    metadata: {
      model: 'multi-agent',
      hasWorkStream: isEmployee,
      workStreamData,
      employeeName: missionMsg.metadata?.employeeName,
      taskId: missionMsg.metadata?.taskId,
    },
  };
}

/**
 * Get consistent color for employee
 */
function getEmployeeColor(employeeName: string): string {
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#f97316', // Orange
    '#06b6d4', // Cyan
  ];

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < employeeName.length; i++) {
    hash = employeeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Custom hook to bridge mission store and chat store
 *
 * Usage:
 * ```tsx
 * function ChatInterface() {
 *   useMissionChatBridge(sessionId);
 *   // ... rest of component
 * }
 * ```
 */
export function useMissionChatBridge(conversationId: string | null) {
  const missionMessages = useMissionStore((state) => state.messages);
  const missionStatus = useMissionStore((state) => state.missionStatus);
  const activeEmployees = useMissionStore((state) => state.activeEmployees);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateWorkingProcess = useChatStore(
    (state) => state.updateWorkingProcess
  );

  // Sync mission messages to chat
  useEffect(() => {
    if (!conversationId) return;

    // Get the last mission message
    const lastMissionMsg = missionMessages[missionMessages.length - 1];
    if (!lastMissionMsg) return;

    // Convert and add to chat
    const chatMsg = missionMessageToChatMessage(lastMissionMsg, conversationId);
    addMessage(conversationId, chatMsg);
  }, [missionMessages, conversationId, addMessage]);

  // Sync active employees to working processes
  useEffect(() => {
    if (!conversationId) return;

    activeEmployees.forEach((employee) => {
      updateWorkingProcess(employee.name, {
        employeeId: employee.name,
        steps: employee.log.map((logEntry, index) => ({
          id: `step-${index}`,
          description: logEntry,
          type: determineStepType(logEntry),
          timestamp: new Date(),
          status: index === employee.log.length - 1 ? 'active' : 'completed',
        })),
        currentStep: employee.log.length - 1,
        status:
          employee.status === 'thinking' || employee.status === 'using_tool'
            ? 'working'
            : employee.status === 'error'
              ? 'error'
              : employee.status === 'idle'
                ? 'idle'
                : 'working',
        totalSteps: employee.log.length,
      });
    });
  }, [activeEmployees, conversationId, updateWorkingProcess]);

  // Return mission status for component use
  return {
    missionStatus,
    isOrchestrating: useMissionStore((state) => state.isOrchestrating),
    activeEmployeeCount: activeEmployees.size,
  };
}

/**
 * Determine step type from log entry text
 */
function determineStepType(
  logEntry: string
): 'thinking' | 'writing' | 'executing' | 'reading' | 'analyzing' {
  const lower = logEntry.toLowerCase();

  if (lower.includes('writing') || lower.includes('creating file')) {
    return 'writing';
  }
  if (lower.includes('executing') || lower.includes('running')) {
    return 'executing';
  }
  if (lower.includes('reading') || lower.includes('analyzing file')) {
    return 'reading';
  }
  if (lower.includes('analyzing') || lower.includes('reviewing')) {
    return 'analyzing';
  }
  return 'thinking';
}

/**
 * Hook to manually trigger mission orchestration from chat
 *
 * Usage:
 * ```tsx
 * const { startMission } = useMissionOrchestration();
 *
 * const handleSend = async (message: string) => {
 *   await startMission(message, {
 *     userId,
 *     sessionId,
 *     employees: selectedEmployees,
 *   });
 * };
 * ```
 */
export function useMissionOrchestration() {
  const startMission = useMissionStore((state) => state.startMission);
  const pauseMission = useMissionStore((state) => state.pauseMission);
  const resumeMission = useMissionStore((state) => state.resumeMission);
  const reset = useMissionStore((state) => state.reset);

  return {
    startMission,
    pauseMission,
    resumeMission,
    resetMission: reset,
  };
}

/**
 * Hook to get current mission progress
 */
export function useMissionProgress() {
  const missionPlan = useMissionStore((state) => state.missionPlan);
  const missionStatus = useMissionStore((state) => state.missionStatus);

  const completedTasks = missionPlan.filter(
    (t) => t.status === 'completed'
  ).length;
  const totalTasks = missionPlan.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return {
    progress,
    completedTasks,
    totalTasks,
    isComplete: missionStatus === 'completed',
    isFailed: missionStatus === 'failed',
    isRunning: missionStatus === 'executing',
  };
}
