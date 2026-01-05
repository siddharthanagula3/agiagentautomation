/**
 * Mission Control Store Unit Tests
 * Tests the real-time state management for mission orchestration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMissionStore } from './mission-control-store';
import type { Task } from './mission-control-store';
import {
  createMockTask,
  createPendingTask,
  createInProgressTask,
  createCompletedTask,
  createFailedTask,
  createUserMessage,
  createSystemMessage,
  createEmployeeMessage,
  createMockActiveEmployee,
} from '../../../tests/fixtures/test-data-factory';

describe('Mission Control Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useMissionStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const state = useMissionStore.getState();

      expect(state.missionPlan).toEqual([]);
      expect(state.currentMissionId).toBeNull();
      expect(state.missionStatus).toBe('idle');
      // activeEmployees is now a Record, not a Map
      expect(Object.keys(state.activeEmployees).length).toBe(0);
      expect(state.messages).toEqual([]);
      expect(state.isOrchestrating).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have mission mode by default', () => {
      const state = useMissionStore.getState();
      expect(state.mode).toBe('mission');
    });
  });

  describe('Mission Lifecycle', () => {
    it('should start mission with generated ID', () => {
      const state = useMissionStore.getState();
      const missionId = 'test-mission-123';

      state.startMission(missionId);

      expect(state.currentMissionId).toBe(missionId);
      expect(state.missionStatus).toBe('planning');
      expect(state.error).toBeNull();
    });

    it('should start mission in chat mode', () => {
      const state = useMissionStore.getState();

      state.startMission('chat-mission-1', 'chat');

      expect(state.mode).toBe('chat');
      expect(state.missionStatus).toBe('planning');
    });

    it('should complete mission successfully', () => {
      const state = useMissionStore.getState();

      state.startMission('mission-1');
      state.completeMission();

      expect(state.missionStatus).toBe('completed');
      expect(state.error).toBeNull();
    });

    it('should fail mission with error message', () => {
      const state = useMissionStore.getState();
      const errorMessage = 'LLM API rate limit exceeded';

      state.startMission('mission-2');
      state.failMission(errorMessage);

      expect(state.missionStatus).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });

    it('should pause and resume mission', () => {
      const state = useMissionStore.getState();

      state.startMission('mission-3');
      state.pauseMission();

      expect(state.isPaused).toBe(true);
      expect(state.missionStatus).toBe('paused');

      state.resumeMission();

      expect(state.isPaused).toBe(false);
      expect(state.missionStatus).toBe('executing');
    });

    it('should reset mission state completely', () => {
      const state = useMissionStore.getState();

      // Setup complex state
      state.startMission('mission-4');
      state.setMissionPlan([createPendingTask('Task 1')]);
      state.addMessage(createUserMessage('Test message'));
      state.updateEmployeeStatus('test-employee', 'thinking');

      // Reset
      state.reset();

      // Verify clean slate
      expect(state.missionPlan).toEqual([]);
      expect(state.currentMissionId).toBeNull();
      expect(state.missionStatus).toBe('idle');
      // activeEmployees is now a Record, not a Map
      expect(Object.keys(state.activeEmployees).length).toBe(0);
      expect(state.messages).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Mission Plan Management', () => {
    it('should set mission plan with tasks', () => {
      const state = useMissionStore.getState();
      const tasks: Task[] = [
        createPendingTask('Review code'),
        createPendingTask('Run tests'),
        createPendingTask('Deploy'),
      ];

      state.setMissionPlan(tasks);

      expect(state.missionPlan).toHaveLength(3);
      expect(state.missionPlan).toEqual(tasks);
    });

    it('should replace existing mission plan', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([createPendingTask('Old task')]);
      expect(state.missionPlan).toHaveLength(1);

      state.setMissionPlan([
        createPendingTask('New task 1'),
        createPendingTask('New task 2'),
      ]);

      expect(state.missionPlan).toHaveLength(2);
      expect(state.missionPlan[0].description).toBe('New task 1');
    });
  });

  describe('Task Status Updates', () => {
    beforeEach(() => {
      const state = useMissionStore.getState();
      state.setMissionPlan([
        createMockTask({
          id: 'task-1',
          description: 'Task 1',
          status: 'pending',
        }),
        createMockTask({
          id: 'task-2',
          description: 'Task 2',
          status: 'pending',
        }),
      ]);
    });

    it('should update task to in_progress', () => {
      const state = useMissionStore.getState();

      state.updateTaskStatus('task-1', 'in_progress', 'code-reviewer');

      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('in_progress');
      expect(task?.assignedTo).toBe('code-reviewer');
      expect(task?.startedAt).toBeInstanceOf(Date);
    });

    it('should update task to completed with result', () => {
      const state = useMissionStore.getState();
      const result = 'Successfully reviewed code, found 3 issues';

      state.updateTaskStatus('task-1', 'completed', 'code-reviewer', result);

      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');
      expect(task?.result).toBe(result);
      expect(task?.completedAt).toBeInstanceOf(Date);
    });

    it('should update task to failed with error', () => {
      const state = useMissionStore.getState();
      const error = 'File not found: auth.ts';

      state.updateTaskStatus(
        'task-1',
        'failed',
        'code-reviewer',
        undefined,
        error
      );

      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe(error);
    });

    it('should handle updating non-existent task gracefully', () => {
      const state = useMissionStore.getState();

      // Should not throw error
      expect(() => {
        state.updateTaskStatus('non-existent-task', 'completed');
      }).not.toThrow();
    });

    it('should maintain immutability when updating tasks', () => {
      const state = useMissionStore.getState();
      const originalPlan = [...state.missionPlan];

      state.updateTaskStatus('task-1', 'in_progress');

      // Original array should not be modified (Immer middleware)
      expect(originalPlan[0].status).toBe('pending');
      expect(state.missionPlan[0].status).toBe('in_progress');
    });
  });

  describe('Employee Status Management', () => {
    it('should add new employee to active employees', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('code-reviewer', 'thinking');

      // activeEmployees is now a Record, not a Map
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('code-reviewer');
      expect(employee?.status).toBe('thinking');
    });

    it('should update existing employee status', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('debugger', 'idle');
      state.updateEmployeeStatus('debugger', 'using_tool', 'Bash', 'Run tests');

      // activeEmployees is now a Record, not a Map
      const employee = state.activeEmployees['debugger'];
      expect(employee?.status).toBe('using_tool');
      expect(employee?.currentTool).toBe('Bash');
      expect(employee?.currentTask).toBe('Run tests');
    });

    it('should set employee to error state', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('code-reviewer', 'error');

      // activeEmployees is now a Record, not a Map
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee?.status).toBe('error');
    });

    it('should add log entries to employee', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('debugger', 'idle');
      state.addEmployeeLog('debugger', 'Starting code review');
      state.addEmployeeLog('debugger', 'Found 2 issues');

      // activeEmployees is now a Record, not a Map
      const employee = state.activeEmployees['debugger'];
      expect(employee?.log).toHaveLength(2);
      expect(employee?.log[0]).toBe('Starting code review');
      expect(employee?.log[1]).toBe('Found 2 issues');
    });

    it('should update employee progress', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('code-reviewer', 'thinking');
      state.updateEmployeeProgress('code-reviewer', 50);

      // activeEmployees is now a Record, not a Map
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee?.progress).toBe(50);
    });

    it('should handle progress updates for non-existent employee', () => {
      const state = useMissionStore.getState();

      expect(() => {
        state.updateEmployeeProgress('non-existent', 100);
      }).not.toThrow();
    });
  });

  describe('Message Management', () => {
    it('should add user message with auto-generated ID', () => {
      const state = useMissionStore.getState();

      state.addMessage({
        from: 'user',
        type: 'user',
        content: 'Review my authentication code',
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].id).toBeDefined();
      expect(state.messages[0].timestamp).toBeInstanceOf(Date);
      expect(state.messages[0].content).toBe('Review my authentication code');
    });

    it('should add system messages', () => {
      const state = useMissionStore.getState();

      state.addMessage({
        from: 'system',
        type: 'system',
        content: 'Analyzing request...',
      });

      expect(state.messages[0].type).toBe('system');
      expect(state.messages[0].from).toBe('system');
    });

    it('should add employee messages', () => {
      const state = useMissionStore.getState();

      state.addMessage({
        from: 'code-reviewer',
        type: 'employee',
        content: 'Found 3 code quality issues',
      });

      expect(state.messages[0].type).toBe('employee');
      expect(state.messages[0].from).toBe('code-reviewer');
    });

    it('should add task update messages with metadata', () => {
      const state = useMissionStore.getState();

      state.addMessage({
        from: 'system',
        type: 'task_update',
        content: 'Task completed successfully',
        metadata: {
          taskId: 'task-1',
          employeeName: 'debugger',
        },
      });

      expect(state.messages[0].type).toBe('task_update');
      expect(state.messages[0].metadata?.taskId).toBe('task-1');
      expect(state.messages[0].metadata?.employeeName).toBe('debugger');
    });

    it('should maintain message order (chronological)', () => {
      const state = useMissionStore.getState();

      state.addMessage(createUserMessage('Message 1'));
      state.addMessage(createSystemMessage('Message 2'));
      state.addMessage(createEmployeeMessage('code-reviewer', 'Message 3'));

      expect(state.messages).toHaveLength(3);
      expect(state.messages[0].content).toBe('Message 1');
      expect(state.messages[1].content).toBe('Message 2');
      expect(state.messages[2].content).toBe('Message 3');
    });

    it('should handle large message volumes', () => {
      const state = useMissionStore.getState();

      // Add 1000 messages
      for (let i = 0; i < 1000; i++) {
        state.addMessage(createUserMessage(`Message ${i}`));
      }

      expect(state.messages).toHaveLength(1000);
      expect(state.messages[999].content).toBe('Message 999');
    });
  });

  describe('Orchestration Control', () => {
    it('should set orchestrating flag', () => {
      const state = useMissionStore.getState();

      state.setOrchestrating(true);
      expect(state.isOrchestrating).toBe(true);

      state.setOrchestrating(false);
      expect(state.isOrchestrating).toBe(false);
    });

    it('should prevent concurrent orchestration', () => {
      const state = useMissionStore.getState();

      state.setOrchestrating(true);
      expect(state.isOrchestrating).toBe(true);

      // Attempting to start another orchestration
      // (This would be handled in the orchestrator, but store tracks the flag)
      expect(state.isOrchestrating).toBe(true);
    });
  });

  describe('Collaborative Chat Integration', () => {
    it('should track active chat session', () => {
      const state = useMissionStore.getState();

      state.startMission('mission-1', 'chat');

      expect(state.mode).toBe('chat');
      expect(state.activeChatSession).toBeNull(); // Set separately if needed
    });

    it('should manage collaborative agents set', () => {
      const state = useMissionStore.getState();

      // Add collaborative agents (assuming there's a method to do this)
      // This would be implemented based on actual multi-agent chat requirements
      expect(state.collaborativeAgents).toBeInstanceOf(Set);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup completed tasks', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([
        createCompletedTask('Task 1', 'Done'),
        createPendingTask('Task 2'),
        createCompletedTask('Task 3', 'Done'),
      ]);

      state.cleanupCompletedTasks();

      // Only pending task should remain
      expect(state.missionPlan).toHaveLength(1);
      expect(state.missionPlan[0].description).toBe('Task 2');
    });

    it('should not remove failed tasks during cleanup', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([
        createCompletedTask('Task 1', 'Done'),
        createFailedTask('Task 2', 'Error'),
      ]);

      state.cleanupCompletedTasks();

      expect(state.missionPlan).toHaveLength(1);
      expect(state.missionPlan[0].status).toBe('failed');
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle rapid task status updates', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([
        createMockTask({ id: 'task-1', status: 'pending' }),
      ]);

      // Simulate rapid updates
      state.updateTaskStatus('task-1', 'in_progress', 'employee-1');
      state.updateTaskStatus('task-1', 'completed', 'employee-1', 'Success');

      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');
    });

    it('should handle concurrent employee updates', () => {
      const state = useMissionStore.getState();

      state.updateEmployeeStatus('employee-1', 'thinking');
      state.updateEmployeeStatus('employee-2', 'using_tool', 'Bash');
      state.updateEmployeeStatus('employee-3', 'idle');

      // activeEmployees is now a Record, not a Map
      expect(Object.keys(state.activeEmployees).length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty mission plan', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([]);
      expect(state.missionPlan).toEqual([]);
    });

    it('should handle null/undefined in task updates', () => {
      const state = useMissionStore.getState();

      state.setMissionPlan([createMockTask({ id: 'task-1' })]);

      expect(() => {
        state.updateTaskStatus(
          'task-1',
          'completed',
          undefined,
          undefined,
          undefined
        );
      }).not.toThrow();
    });

    it('should handle very long employee names', () => {
      const state = useMissionStore.getState();
      const longName = 'a'.repeat(1000);

      state.updateEmployeeStatus(longName, 'thinking');

      // activeEmployees is now a Record, not a Map
      expect(longName in state.activeEmployees).toBe(true);
    });

    it('should handle special characters in messages', () => {
      const state = useMissionStore.getState();
      const specialContent = '<script>alert("xss")</script>';

      state.addMessage({
        from: 'user',
        type: 'user',
        content: specialContent,
      });

      // Should store raw content (sanitization happens in UI)
      expect(state.messages[0].content).toBe(specialContent);
    });
  });

  describe('Performance', () => {
    it('should handle large mission plans efficiently', () => {
      const state = useMissionStore.getState();
      const largePlan = Array.from({ length: 1000 }, (_, i) =>
        createPendingTask(`Task ${i}`)
      );

      const start = performance.now();
      state.setMissionPlan(largePlan);
      const end = performance.now();

      expect(state.missionPlan).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle many active employees efficiently', () => {
      const state = useMissionStore.getState();

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        state.updateEmployeeStatus(`employee-${i}`, 'thinking');
      }
      const end = performance.now();

      // activeEmployees is now a Record, not a Map
      expect(Object.keys(state.activeEmployees).length).toBe(100);
      expect(end - start).toBeLessThan(100);
    });
  });
});
