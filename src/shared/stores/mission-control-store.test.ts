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
      const missionId = 'test-mission-123';

      useMissionStore.getState().startMission(missionId);

      // Get fresh state after mutation
      const state = useMissionStore.getState();
      expect(state.currentMissionId).toBe(missionId);
      expect(state.missionStatus).toBe('executing'); // Store sets 'executing' on start
      expect(state.error).toBeNull();
    });

    it('should start mission in chat mode', () => {
      useMissionStore.getState().startMission('chat-mission-1', 'chat');

      // Get fresh state after mutation
      const state = useMissionStore.getState();
      expect(state.mode).toBe('chat');
      expect(state.missionStatus).toBe('executing');
    });

    it('should complete mission successfully', () => {
      useMissionStore.getState().startMission('mission-1');
      useMissionStore.getState().completeMission();

      // Get fresh state after mutation
      const state = useMissionStore.getState();
      expect(state.missionStatus).toBe('completed');
      expect(state.error).toBeNull();
    });

    it('should fail mission with error message', () => {
      const errorMessage = 'LLM API rate limit exceeded';

      useMissionStore.getState().startMission('mission-2');
      useMissionStore.getState().failMission(errorMessage);

      // Get fresh state after mutation
      const state = useMissionStore.getState();
      expect(state.missionStatus).toBe('failed');
      expect(state.error).toBe(errorMessage);
    });

    it('should pause and resume mission', () => {
      useMissionStore.getState().startMission('mission-3');
      useMissionStore.getState().pauseMission();

      let state = useMissionStore.getState();
      expect(state.isPaused).toBe(true);
      expect(state.missionStatus).toBe('paused');

      useMissionStore.getState().resumeMission();

      state = useMissionStore.getState();
      expect(state.isPaused).toBe(false);
      expect(state.missionStatus).toBe('executing');
    });

    it('should reset mission state completely', () => {
      // Setup complex state
      useMissionStore.getState().startMission('mission-4');
      useMissionStore.getState().setMissionPlan([createPendingTask('Task 1')]);
      useMissionStore.getState().addMessage(createUserMessage('Test message'));
      useMissionStore.getState().updateEmployeeStatus('test-employee', 'thinking');

      // Reset
      useMissionStore.getState().reset();

      // Get fresh state and verify clean slate
      const state = useMissionStore.getState();
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
      const tasks: Task[] = [
        createPendingTask('Review code'),
        createPendingTask('Run tests'),
        createPendingTask('Deploy'),
      ];

      useMissionStore.getState().setMissionPlan(tasks);

      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(3);
      expect(state.missionPlan).toEqual(tasks);
    });

    it('should replace existing mission plan', () => {
      useMissionStore.getState().setMissionPlan([createPendingTask('Old task')]);
      expect(useMissionStore.getState().missionPlan).toHaveLength(1);

      useMissionStore.getState().setMissionPlan([
        createPendingTask('New task 1'),
        createPendingTask('New task 2'),
      ]);

      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(2);
      expect(state.missionPlan[0]?.description).toBe('New task 1');
    });
  });

  describe('Task Status Updates', () => {
    beforeEach(() => {
      useMissionStore.getState().setMissionPlan([
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
      useMissionStore.getState().updateTaskStatus('task-1', 'in_progress', 'code-reviewer');

      const state = useMissionStore.getState();
      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('in_progress');
      expect(task?.assignedTo).toBe('code-reviewer');
      expect(task?.startedAt).toBeInstanceOf(Date);
    });

    it('should update task to completed with result', () => {
      const result = 'Successfully reviewed code, found 3 issues';

      useMissionStore.getState().updateTaskStatus('task-1', 'completed', 'code-reviewer', result);

      const state = useMissionStore.getState();
      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');
      expect(task?.result).toBe(result);
      expect(task?.completedAt).toBeInstanceOf(Date);
    });

    it('should update task to failed with error', () => {
      const error = 'File not found: auth.ts';

      useMissionStore.getState().updateTaskStatus(
        'task-1',
        'failed',
        'code-reviewer',
        undefined,
        error
      );

      const state = useMissionStore.getState();
      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe(error);
    });

    it('should handle updating non-existent task gracefully', () => {
      // Should not throw error
      expect(() => {
        useMissionStore.getState().updateTaskStatus('non-existent-task', 'completed');
      }).not.toThrow();
    });

    it('should maintain immutability when updating tasks', () => {
      const originalPlan = [...useMissionStore.getState().missionPlan];

      useMissionStore.getState().updateTaskStatus('task-1', 'in_progress');

      // Original array should not be modified (Immer middleware)
      expect(originalPlan[0]?.status).toBe('pending');
      expect(useMissionStore.getState().missionPlan[0]?.status).toBe('in_progress');
    });
  });

  describe('Employee Status Management', () => {
    it('should add new employee to active employees', () => {
      useMissionStore.getState().updateEmployeeStatus('code-reviewer', 'thinking');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('code-reviewer');
      expect(employee?.status).toBe('thinking');
    });

    it('should update existing employee status', () => {
      useMissionStore.getState().updateEmployeeStatus('debugger', 'idle');
      useMissionStore.getState().updateEmployeeStatus('debugger', 'using_tool', 'Bash', 'Run tests');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      const employee = state.activeEmployees['debugger'];
      expect(employee?.status).toBe('using_tool');
      expect(employee?.currentTool).toBe('Bash');
      expect(employee?.currentTask).toBe('Run tests');
    });

    it('should set employee to error state', () => {
      useMissionStore.getState().updateEmployeeStatus('code-reviewer', 'error');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee?.status).toBe('error');
    });

    it('should add log entries to employee', () => {
      useMissionStore.getState().updateEmployeeStatus('debugger', 'idle');
      useMissionStore.getState().addEmployeeLog('debugger', 'Starting code review');
      useMissionStore.getState().addEmployeeLog('debugger', 'Found 2 issues');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      const employee = state.activeEmployees['debugger'];
      expect(employee?.log).toHaveLength(2);
      // Log entries are objects with timestamp, message, and type
      expect(employee?.log[0]?.message).toBe('Starting code review');
      expect(employee?.log[1]?.message).toBe('Found 2 issues');
    });

    it('should update employee progress', () => {
      useMissionStore.getState().updateEmployeeStatus('code-reviewer', 'thinking');
      useMissionStore.getState().updateEmployeeProgress('code-reviewer', 50);

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      const employee = state.activeEmployees['code-reviewer'];
      expect(employee?.progress).toBe(50);
    });

    it('should handle progress updates for non-existent employee', () => {
      expect(() => {
        useMissionStore.getState().updateEmployeeProgress('non-existent', 100);
      }).not.toThrow();
    });
  });

  describe('Message Management', () => {
    it('should add user message with auto-generated ID', () => {
      useMissionStore.getState().addMessage({
        from: 'user',
        type: 'user',
        content: 'Review my authentication code',
      });

      const state = useMissionStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]?.id).toBeDefined();
      expect(state.messages[0]?.timestamp).toBeInstanceOf(Date);
      expect(state.messages[0]?.content).toBe('Review my authentication code');
    });

    it('should add system messages', () => {
      useMissionStore.getState().addMessage({
        from: 'system',
        type: 'system',
        content: 'Analyzing request...',
      });

      const state = useMissionStore.getState();
      expect(state.messages[0]?.type).toBe('system');
      expect(state.messages[0]?.from).toBe('system');
    });

    it('should add employee messages', () => {
      useMissionStore.getState().addMessage({
        from: 'code-reviewer',
        type: 'employee',
        content: 'Found 3 code quality issues',
      });

      const state = useMissionStore.getState();
      expect(state.messages[0]?.type).toBe('employee');
      expect(state.messages[0]?.from).toBe('code-reviewer');
    });

    it('should add task update messages with metadata', () => {
      useMissionStore.getState().addMessage({
        from: 'system',
        type: 'task_update',
        content: 'Task completed successfully',
        metadata: {
          taskId: 'task-1',
          employeeName: 'debugger',
        },
      });

      const state = useMissionStore.getState();
      expect(state.messages[0]?.type).toBe('task_update');
      expect(state.messages[0]?.metadata?.taskId).toBe('task-1');
      expect(state.messages[0]?.metadata?.employeeName).toBe('debugger');
    });

    it('should maintain message order (chronological)', () => {
      useMissionStore.getState().addMessage(createUserMessage('Message 1'));
      useMissionStore.getState().addMessage(createSystemMessage('Message 2'));
      useMissionStore.getState().addMessage(createEmployeeMessage('code-reviewer', 'Message 3'));

      const state = useMissionStore.getState();
      expect(state.messages).toHaveLength(3);
      expect(state.messages[0]?.content).toBe('Message 1');
      expect(state.messages[1]?.content).toBe('Message 2');
      expect(state.messages[2]?.content).toBe('Message 3');
    });

    it('should handle large message volumes', () => {
      // Add 1000 messages
      for (let i = 0; i < 1000; i++) {
        useMissionStore.getState().addMessage(createUserMessage(`Message ${i}`));
      }

      const state = useMissionStore.getState();
      expect(state.messages).toHaveLength(1000);
      expect(state.messages[999]?.content).toBe('Message 999');
    });
  });

  describe('Orchestration Control', () => {
    it('should set orchestrating flag', () => {
      useMissionStore.getState().setOrchestrating(true);
      expect(useMissionStore.getState().isOrchestrating).toBe(true);

      useMissionStore.getState().setOrchestrating(false);
      expect(useMissionStore.getState().isOrchestrating).toBe(false);
    });

    it('should prevent concurrent orchestration', () => {
      useMissionStore.getState().setOrchestrating(true);
      expect(useMissionStore.getState().isOrchestrating).toBe(true);

      // Attempting to start another orchestration
      // (This would be handled in the orchestrator, but store tracks the flag)
      expect(useMissionStore.getState().isOrchestrating).toBe(true);
    });
  });

  describe('Collaborative Chat Integration', () => {
    it('should track active chat session', () => {
      useMissionStore.getState().startMission('mission-1', 'chat');

      const state = useMissionStore.getState();
      expect(state.mode).toBe('chat');
      expect(state.activeChatSession).toBeNull(); // Set separately if needed
    });

    it('should manage collaborative agents array', () => {
      // collaborativeAgents is an array, not a Set
      const state = useMissionStore.getState();
      expect(Array.isArray(state.collaborativeAgents)).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup completed tasks older than 1 hour', () => {
      // Create tasks with completedAt older than 1 hour
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      useMissionStore.getState().setMissionPlan([
        { ...createCompletedTask('Task 1', 'Done'), completedAt: oldDate },
        createPendingTask('Task 2'),
        { ...createCompletedTask('Task 3', 'Done'), completedAt: oldDate },
      ]);

      useMissionStore.getState().cleanupCompletedTasks();

      // Only pending task should remain
      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(1);
      expect(state.missionPlan[0]?.description).toBe('Task 2');
    });

    it('should not remove recently completed tasks', () => {
      // Create a recently completed task (completedAt is now)
      const recentTask = createCompletedTask('Task 1', 'Done');

      useMissionStore.getState().setMissionPlan([
        recentTask,
        createPendingTask('Task 2'),
      ]);

      useMissionStore.getState().cleanupCompletedTasks();

      // Both tasks should remain since completed task is recent
      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(2);
    });

    it('should not remove failed tasks that are recent', () => {
      const recentFailedTask = { ...createFailedTask('Task 1', 'Error'), completedAt: new Date() };

      useMissionStore.getState().setMissionPlan([
        recentFailedTask,
      ]);

      useMissionStore.getState().cleanupCompletedTasks();

      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(1);
      expect(state.missionPlan[0]?.status).toBe('failed');
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle rapid task status updates', () => {
      useMissionStore.getState().setMissionPlan([
        createMockTask({ id: 'task-1', status: 'pending' }),
      ]);

      // Simulate rapid updates
      useMissionStore.getState().updateTaskStatus('task-1', 'in_progress', 'employee-1');
      useMissionStore.getState().updateTaskStatus('task-1', 'completed', 'employee-1', 'Success');

      const state = useMissionStore.getState();
      const task = state.missionPlan.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');
    });

    it('should handle concurrent employee updates', () => {
      useMissionStore.getState().updateEmployeeStatus('employee-1', 'thinking');
      useMissionStore.getState().updateEmployeeStatus('employee-2', 'using_tool', 'Bash');
      useMissionStore.getState().updateEmployeeStatus('employee-3', 'idle');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      expect(Object.keys(state.activeEmployees).length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty mission plan', () => {
      useMissionStore.getState().setMissionPlan([]);
      expect(useMissionStore.getState().missionPlan).toEqual([]);
    });

    it('should handle null/undefined in task updates', () => {
      useMissionStore.getState().setMissionPlan([createMockTask({ id: 'task-1' })]);

      expect(() => {
        useMissionStore.getState().updateTaskStatus(
          'task-1',
          'completed',
          undefined,
          undefined,
          undefined
        );
      }).not.toThrow();
    });

    it('should handle very long employee names', () => {
      const longName = 'a'.repeat(1000);

      useMissionStore.getState().updateEmployeeStatus(longName, 'thinking');

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      expect(longName in state.activeEmployees).toBe(true);
    });

    it('should handle special characters in messages', () => {
      const specialContent = '<script>alert("xss")</script>';

      useMissionStore.getState().addMessage({
        from: 'user',
        type: 'user',
        content: specialContent,
      });

      // Should store raw content (sanitization happens in UI)
      const state = useMissionStore.getState();
      expect(state.messages[0]?.content).toBe(specialContent);
    });
  });

  describe('Performance', () => {
    it('should handle large mission plans efficiently', () => {
      const largePlan = Array.from({ length: 1000 }, (_, i) =>
        createPendingTask(`Task ${i}`)
      );

      const start = performance.now();
      useMissionStore.getState().setMissionPlan(largePlan);
      const end = performance.now();

      const state = useMissionStore.getState();
      expect(state.missionPlan).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should handle many active employees efficiently', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        useMissionStore.getState().updateEmployeeStatus(`employee-${i}`, 'thinking');
      }
      const end = performance.now();

      // activeEmployees is now a Record, not a Map
      const state = useMissionStore.getState();
      expect(Object.keys(state.activeEmployees).length).toBe(100);
      expect(end - start).toBeLessThan(100);
    });
  });
});
