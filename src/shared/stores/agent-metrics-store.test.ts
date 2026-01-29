/**
 * Agent Metrics Store Tests
 *
 * Tests for agent activity tracking, session management,
 * and metrics calculation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAgentMetricsStore } from './agent-metrics-store';
import type { AgentStatus } from '@core/ai/orchestration/agent-collaboration-manager';

describe('Agent Metrics Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAgentMetricsStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAgentMetricsStore.getState();

      expect(state.totalSessions).toBe(0);
      expect(state.activeSessions).toBe(0);
      expect(state.completedTasks).toBe(0);
      expect(state.failedTasks).toBe(0);
      expect(state.totalAgents).toBe(0);
      expect(state.activeAgents).toBe(0);
      expect(state.idleAgents).toBe(0);
      expect(state.totalTokensUsed).toBe(0);
      expect(state.totalMessagesExchanged).toBe(0);
      expect(state.currentSessions).toEqual([]);
      expect(state.recentActivity).toEqual([]);
      expect(state.isBackgroundServiceRunning).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should start a new session', () => {
      const { startSession } = useAgentMetricsStore.getState();

      const sessionId = startSession({
        userId: 'user-123',
        taskDescription: 'Test task',
        agentsInvolved: ['agent-1', 'agent-2'],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      const state = useAgentMetricsStore.getState();
      expect(sessionId).toMatch(/^session-/);
      expect(state.totalSessions).toBe(1);
      expect(state.activeSessions).toBe(1);
      expect(state.currentSessions).toHaveLength(1);
      expect(state.currentSessions[0].isActive).toBe(true);
      expect(state.currentSessions[0].status).toBe('in_progress');
    });

    it('should update session', () => {
      const { startSession, updateSession } = useAgentMetricsStore.getState();

      const sessionId = startSession({
        userId: 'user-123',
        taskDescription: 'Test task',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      updateSession(sessionId, {
        messagesCount: 5,
        tokensUsed: 1000,
      });

      const state = useAgentMetricsStore.getState();
      const session = state.currentSessions.find((s) => s.id === sessionId);
      expect(session?.messagesCount).toBe(5);
      expect(session?.tokensUsed).toBe(1000);
    });

    it('should end session as completed', () => {
      const { startSession, endSession } = useAgentMetricsStore.getState();

      const sessionId = startSession({
        userId: 'user-123',
        taskDescription: 'Test task',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      endSession(sessionId, 'completed', 'Task completed successfully');

      const state = useAgentMetricsStore.getState();
      expect(state.activeSessions).toBe(0);
      expect(state.completedTasks).toBe(1);
      expect(state.failedTasks).toBe(0);

      const session = state.currentSessions.find((s) => s.id === sessionId);
      expect(session?.isActive).toBe(false);
      expect(session?.status).toBe('completed');
      expect(session?.result).toBe('Task completed successfully');
    });

    it('should end session as failed', () => {
      const { startSession, endSession } = useAgentMetricsStore.getState();

      const sessionId = startSession({
        userId: 'user-123',
        taskDescription: 'Test task',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      endSession(sessionId, 'failed', 'Task failed due to error');

      const state = useAgentMetricsStore.getState();
      expect(state.activeSessions).toBe(0);
      expect(state.completedTasks).toBe(0);
      expect(state.failedTasks).toBe(1);

      const session = state.currentSessions.find((s) => s.id === sessionId);
      expect(session?.status).toBe('failed');
    });

    it('should handle ending non-existent session', () => {
      const { endSession } = useAgentMetricsStore.getState();

      // Should not throw
      expect(() => {
        endSession('non-existent', 'completed');
      }).not.toThrow();

      const state = useAgentMetricsStore.getState();
      expect(state.completedTasks).toBe(0);
    });

    it('should calculate average task duration', () => {
      const { startSession, endSession } = useAgentMetricsStore.getState();

      vi.setSystemTime(new Date('2024-01-01T10:00:00'));
      const sessionId = startSession({
        userId: 'user-123',
        taskDescription: 'Test task',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      endSession(sessionId, 'completed');

      const state = useAgentMetricsStore.getState();
      expect(state.averageTaskDuration).toBeGreaterThan(0);
    });
  });

  describe('Agent Status Management', () => {
    it('should update agent status', () => {
      const { updateAgentStatus } = useAgentMetricsStore.getState();

      const status: AgentStatus = {
        name: 'agent-1',
        status: 'working',
        currentTask: 'Processing request',
      };

      updateAgentStatus('agent-1', status);

      const state = useAgentMetricsStore.getState();
      expect(state.agentStatuses['agent-1']).toEqual(status);
      expect(state.totalAgents).toBe(1);
      expect(state.activeAgents).toBe(1);
      expect(state.idleAgents).toBe(0);
    });

    it('should count idle agents', () => {
      const { updateAgentStatus } = useAgentMetricsStore.getState();

      updateAgentStatus('agent-1', {
        name: 'agent-1',
        status: 'idle',
      });
      updateAgentStatus('agent-2', {
        name: 'agent-2',
        status: 'idle',
      });

      const state = useAgentMetricsStore.getState();
      expect(state.idleAgents).toBe(2);
      expect(state.activeAgents).toBe(0);
    });

    it('should count analyzing agents as active', () => {
      const { updateAgentStatus } = useAgentMetricsStore.getState();

      updateAgentStatus('agent-1', {
        name: 'agent-1',
        status: 'analyzing',
        currentTask: 'Analyzing code',
      });

      const state = useAgentMetricsStore.getState();
      expect(state.activeAgents).toBe(1);
    });

    it('should update agent counts correctly', () => {
      const { updateAgentStatus } = useAgentMetricsStore.getState();

      updateAgentStatus('agent-1', { name: 'agent-1', status: 'working' });
      updateAgentStatus('agent-2', { name: 'agent-2', status: 'idle' });
      updateAgentStatus('agent-3', { name: 'agent-3', status: 'analyzing' });

      let state = useAgentMetricsStore.getState();
      expect(state.totalAgents).toBe(3);
      expect(state.activeAgents).toBe(2); // working + analyzing
      expect(state.idleAgents).toBe(1);

      // Update agent-1 to idle
      updateAgentStatus('agent-1', { name: 'agent-1', status: 'idle' });

      state = useAgentMetricsStore.getState();
      expect(state.activeAgents).toBe(1);
      expect(state.idleAgents).toBe(2);
    });
  });

  describe('Communication Tracking', () => {
    it('should add communication', () => {
      const { addCommunication } = useAgentMetricsStore.getState();

      addCommunication({
        from: 'agent-1',
        to: 'agent-2',
        type: 'request',
        message: 'Need help with task',
        timestamp: new Date(),
      });

      const state = useAgentMetricsStore.getState();
      expect(state.agentCommunications).toHaveLength(1);
      expect(state.totalMessagesExchanged).toBe(1);
    });

    it('should track multiple communications', () => {
      const { addCommunication } = useAgentMetricsStore.getState();

      addCommunication({
        from: 'agent-1',
        to: 'agent-2',
        type: 'request',
        message: 'Request 1',
        timestamp: new Date(),
      });
      addCommunication({
        from: 'agent-2',
        to: 'agent-1',
        type: 'response',
        message: 'Response 1',
        timestamp: new Date(),
      });

      const state = useAgentMetricsStore.getState();
      expect(state.agentCommunications).toHaveLength(2);
      expect(state.totalMessagesExchanged).toBe(2);
    });
  });

  describe('Activity Tracking', () => {
    it('should add activity', () => {
      const { addActivity } = useAgentMetricsStore.getState();

      addActivity({
        type: 'session_start',
        message: 'Started new session',
      });

      const state = useAgentMetricsStore.getState();
      expect(state.recentActivity).toHaveLength(1);
      expect(state.recentActivity[0].type).toBe('session_start');
      expect(state.recentActivity[0].message).toBe('Started new session');
    });

    it('should limit recent activity to 50 items', () => {
      const { addActivity } = useAgentMetricsStore.getState();

      // Add 60 activities
      for (let i = 0; i < 60; i++) {
        addActivity({
          type: 'task_complete',
          message: `Activity ${i}`,
        });
      }

      const state = useAgentMetricsStore.getState();
      expect(state.recentActivity).toHaveLength(50);
    });

    it('should add activity with agent name', () => {
      const { addActivity } = useAgentMetricsStore.getState();

      addActivity({
        type: 'agent_communication',
        message: 'Agent communication',
        agentName: 'code-reviewer',
      });

      const state = useAgentMetricsStore.getState();
      expect(state.recentActivity[0].agentName).toBe('code-reviewer');
    });
  });

  describe('Token Tracking', () => {
    it('should increment tokens', () => {
      const { incrementTokens } = useAgentMetricsStore.getState();

      incrementTokens(1000);
      expect(useAgentMetricsStore.getState().totalTokensUsed).toBe(1000);

      incrementTokens(500);
      expect(useAgentMetricsStore.getState().totalTokensUsed).toBe(1500);
    });

    it('should handle zero token increment', () => {
      const { incrementTokens } = useAgentMetricsStore.getState();

      incrementTokens(0);
      expect(useAgentMetricsStore.getState().totalTokensUsed).toBe(0);
    });
  });

  describe('Computed Getters', () => {
    it('should get active sessions count', () => {
      const { startSession, endSession, getActiveSessionsCount } =
        useAgentMetricsStore.getState();

      startSession({
        userId: 'user-1',
        taskDescription: 'Task 1',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const session2 = startSession({
        userId: 'user-2',
        taskDescription: 'Task 2',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      expect(getActiveSessionsCount()).toBe(2);

      endSession(session2, 'completed');
      expect(useAgentMetricsStore.getState().getActiveSessionsCount()).toBe(1);
    });

    it('should get today tasks count', () => {
      const { startSession, getTodayTasksCount } =
        useAgentMetricsStore.getState();

      vi.setSystemTime(new Date('2024-01-15T10:00:00'));

      startSession({
        userId: 'user-1',
        taskDescription: 'Task 1',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      startSession({
        userId: 'user-2',
        taskDescription: 'Task 2',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      expect(getTodayTasksCount()).toBe(2);
    });

    it('should calculate success rate', () => {
      const { startSession, endSession, getSuccessRate } =
        useAgentMetricsStore.getState();

      const s1 = startSession({
        userId: 'user-1',
        taskDescription: 'Task 1',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const s2 = startSession({
        userId: 'user-2',
        taskDescription: 'Task 2',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const s3 = startSession({
        userId: 'user-3',
        taskDescription: 'Task 3',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const s4 = startSession({
        userId: 'user-4',
        taskDescription: 'Task 4',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      endSession(s1, 'completed');
      endSession(s2, 'completed');
      endSession(s3, 'completed');
      endSession(s4, 'failed');

      // 3 completed, 1 failed = 75% success rate
      expect(getSuccessRate()).toBe(75);
    });

    it('should return 0 success rate with no completed tasks', () => {
      const { getSuccessRate } = useAgentMetricsStore.getState();

      expect(getSuccessRate()).toBe(0);
    });
  });

  describe('Background Service', () => {
    it('should set background service running state', () => {
      const { setBackgroundServiceRunning } = useAgentMetricsStore.getState();

      setBackgroundServiceRunning(true);
      expect(
        useAgentMetricsStore.getState().isBackgroundServiceRunning
      ).toBe(true);

      setBackgroundServiceRunning(false);
      expect(
        useAgentMetricsStore.getState().isBackgroundServiceRunning
      ).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', () => {
      const {
        startSession,
        updateAgentStatus,
        addCommunication,
        incrementTokens,
        setBackgroundServiceRunning,
        reset,
      } = useAgentMetricsStore.getState();

      // Populate state
      startSession({
        userId: 'user-1',
        taskDescription: 'Task',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      updateAgentStatus('agent-1', { name: 'agent-1', status: 'working' });
      addCommunication({
        from: 'agent-1',
        to: 'agent-2',
        type: 'request',
        message: 'Test',
        timestamp: new Date(),
      });
      incrementTokens(5000);
      setBackgroundServiceRunning(true);

      // Reset
      reset();

      const state = useAgentMetricsStore.getState();
      expect(state.totalSessions).toBe(0);
      expect(state.currentSessions).toEqual([]);
      expect(state.agentStatuses).toEqual({});
      expect(state.agentCommunications).toEqual([]);
      expect(state.totalTokensUsed).toBe(0);
      expect(state.isBackgroundServiceRunning).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple sessions concurrently', () => {
      const { startSession, endSession, updateSession } =
        useAgentMetricsStore.getState();

      const s1 = startSession({
        userId: 'user-1',
        taskDescription: 'Task 1',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const s2 = startSession({
        userId: 'user-2',
        taskDescription: 'Task 2',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });
      const s3 = startSession({
        userId: 'user-3',
        taskDescription: 'Task 3',
        agentsInvolved: [],
        messagesCount: 0,
        tokensUsed: 0,
        status: 'pending',
      });

      updateSession(s1, { messagesCount: 10 });
      endSession(s2, 'completed');
      updateSession(s3, { tokensUsed: 500 });

      const state = useAgentMetricsStore.getState();
      expect(state.totalSessions).toBe(3);
      expect(state.activeSessions).toBe(2);
      expect(state.completedTasks).toBe(1);
    });

    it('should handle updating non-existent session', () => {
      const { updateSession } = useAgentMetricsStore.getState();

      // Should not throw
      expect(() => {
        updateSession('non-existent', { messagesCount: 10 });
      }).not.toThrow();
    });
  });
});
