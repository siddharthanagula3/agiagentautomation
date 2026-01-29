/**
 * Company Hub Store Tests
 *
 * Tests for multi-agent collaboration workspace state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCompanyHubStore } from './company-hub-store';
import type { AgentAssignment, UpsellRequest } from './company-hub-store';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

describe('Company Hub Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCompanyHubStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useCompanyHubStore.getState();

      expect(state.activeSessionId).toBeNull();
      expect(state.sessions).toEqual({});
      expect(state.assignedAgents).toEqual({});
      expect(state.agentStatuses).toEqual({});
      expect(state.tokenUsage).toEqual({});
      expect(state.sessionTokens).toBe(0);
      expect(state.sessionCost).toBe(0);
      expect(state.messages).toEqual([]);
      expect(state.upsellQueue).toEqual([]);
      expect(state.pendingUpsell).toBeNull();
      expect(state.isOrchestrating).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create session', () => {
      const { createSession } = useCompanyHubStore.getState();

      const sessionId = createSession('user-123', 'Build a login system');

      const state = useCompanyHubStore.getState();
      expect(sessionId).toBeDefined();
      expect(state.activeSessionId).toBe(sessionId);
      expect(state.sessions[sessionId]).toBeDefined();
      expect(state.sessions[sessionId].userId).toBe('user-123');
      expect(state.sessions[sessionId].taskDescription).toBe('Build a login system');
      expect(state.sessions[sessionId].status).toBe('planning');
    });

    it('should set active session', () => {
      const { createSession, setActiveSession } = useCompanyHubStore.getState();

      const sessionId = createSession('user-123', 'Task 1');
      setActiveSession(null);

      expect(useCompanyHubStore.getState().activeSessionId).toBeNull();

      setActiveSession(sessionId);
      expect(useCompanyHubStore.getState().activeSessionId).toBe(sessionId);
    });

    it('should update session status', () => {
      const { createSession, updateSessionStatus } =
        useCompanyHubStore.getState();

      const sessionId = createSession('user-123', 'Task');
      updateSessionStatus(sessionId, 'executing');

      const state = useCompanyHubStore.getState();
      expect(state.sessions[sessionId].status).toBe('executing');
    });

    it('should complete session', () => {
      const { createSession, completeSession } = useCompanyHubStore.getState();

      const sessionId = createSession('user-123', 'Task');
      useCompanyHubStore.getState().startOrchestration();

      completeSession(sessionId);

      const state = useCompanyHubStore.getState();
      expect(state.sessions[sessionId].status).toBe('completed');
      expect(state.sessions[sessionId].completedAt).toBeDefined();
      expect(state.isOrchestrating).toBe(false);
    });
  });

  describe('Agent Management', () => {
    it('should assign agent', () => {
      const { createSession, assignAgent } = useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      const agent: AgentAssignment = {
        agentId: 'agent-1',
        agentName: 'Code Reviewer',
        role: 'reviewer',
        provider: 'anthropic',
        status: 'working',
        progress: 0,
      };

      assignAgent(agent);

      const state = useCompanyHubStore.getState();
      expect(state.assignedAgents['agent-1']).toEqual(agent);
    });

    it('should update agent status', () => {
      const { createSession, assignAgent, updateAgentStatus } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      const agent: AgentAssignment = {
        agentId: 'agent-1',
        agentName: 'Code Reviewer',
        role: 'reviewer',
        provider: 'anthropic',
        status: 'idle',
        progress: 0,
      };

      assignAgent(agent);
      updateAgentStatus('agent-1', {
        status: 'working',
        currentTask: 'Reviewing code',
      });

      const state = useCompanyHubStore.getState();
      expect(state.assignedAgents['agent-1'].status).toBe('working');
    });

    it('should remove agent', () => {
      const { createSession, assignAgent, removeAgent } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      assignAgent({
        agentId: 'agent-1',
        agentName: 'Agent 1',
        role: 'worker',
        provider: 'anthropic',
        status: 'idle',
        progress: 0,
      });

      removeAgent('agent-1');

      const state = useCompanyHubStore.getState();
      expect(state.assignedAgents['agent-1']).toBeUndefined();
    });

    it('should clear all agents', () => {
      const { createSession, assignAgent, clearAgents } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      assignAgent({
        agentId: 'agent-1',
        agentName: 'Agent 1',
        role: 'worker',
        provider: 'anthropic',
        status: 'idle',
        progress: 0,
      });
      assignAgent({
        agentId: 'agent-2',
        agentName: 'Agent 2',
        role: 'worker',
        provider: 'openai',
        status: 'idle',
        progress: 0,
      });

      clearAgents();

      const state = useCompanyHubStore.getState();
      expect(Object.keys(state.assignedAgents)).toHaveLength(0);
    });

    it('should skip assignment if agent already exists with same state', () => {
      const { createSession, assignAgent } = useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      const agent: AgentAssignment = {
        agentId: 'agent-1',
        agentName: 'Agent 1',
        role: 'worker',
        provider: 'anthropic',
        status: 'idle',
        progress: 50,
        currentTask: 'Working',
      };

      assignAgent(agent);
      const firstUpdate = useCompanyHubStore.getState().lastUpdate;

      // Assign same agent with same state
      vi.advanceTimersByTime(1000);
      assignAgent({ ...agent });

      // lastUpdate should not change if agent state is same
      const secondUpdate = useCompanyHubStore.getState().lastUpdate;
      expect(secondUpdate).toEqual(firstUpdate);
    });
  });

  describe('Token Tracking', () => {
    it('should update token usage', () => {
      const { updateTokenUsage } = useCompanyHubStore.getState();

      updateTokenUsage({
        'claude-3-sonnet': {
          provider: 'anthropic',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          cost: 0.01,
          callCount: 1,
        },
      });

      const state = useCompanyHubStore.getState();
      expect(state.tokenUsage['claude-3-sonnet']).toBeDefined();
      expect(state.sessionTokens).toBe(150);
      expect(state.sessionCost).toBe(0.01);
    });

    it('should accumulate token usage', () => {
      const { updateTokenUsage } = useCompanyHubStore.getState();

      updateTokenUsage({
        'claude-3-sonnet': {
          provider: 'anthropic',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          cost: 0.01,
          callCount: 1,
        },
      });

      updateTokenUsage({
        'claude-3-sonnet': {
          provider: 'anthropic',
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
          cost: 0.02,
          callCount: 1,
        },
      });

      const state = useCompanyHubStore.getState();
      expect(state.tokenUsage['claude-3-sonnet'].totalTokens).toBe(450);
      expect(state.sessionTokens).toBe(450);
      expect(state.sessionCost).toBeCloseTo(0.03);
    });

    it('should add tokens', () => {
      const { addTokens } = useCompanyHubStore.getState();

      addTokens('gpt-4', 1000, 0.05, 'openai');

      const state = useCompanyHubStore.getState();
      expect(state.tokenUsage['gpt-4']).toBeDefined();
      expect(state.tokenUsage['gpt-4'].totalTokens).toBe(1000);
      expect(state.sessionTokens).toBe(1000);
    });

    it('should reset token usage', () => {
      const { addTokens, resetTokenUsage } = useCompanyHubStore.getState();

      addTokens('gpt-4', 1000, 0.05, 'openai');
      resetTokenUsage();

      const state = useCompanyHubStore.getState();
      expect(state.tokenUsage).toEqual({});
      expect(state.sessionTokens).toBe(0);
      expect(state.sessionCost).toBe(0);
    });
  });

  describe('Messages', () => {
    it('should add message', () => {
      const { createSession, addMessage } = useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      addMessage({
        sessionId: 'session-1',
        from: 'user',
        type: 'user',
        content: 'Hello, please help me',
      });

      const state = useCompanyHubStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].content).toBe('Hello, please help me');
      expect(state.messages[0].id).toBeDefined();
      expect(state.messages[0].timestamp).toBeDefined();
    });

    it('should clear messages', () => {
      const { createSession, addMessage, clearMessages } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');

      addMessage({
        sessionId: 'session-1',
        from: 'user',
        type: 'user',
        content: 'Message 1',
      });
      addMessage({
        sessionId: 'session-1',
        from: 'agent',
        type: 'agent',
        content: 'Message 2',
      });

      clearMessages();

      expect(useCompanyHubStore.getState().messages).toHaveLength(0);
    });
  });

  describe('Upsell Management', () => {
    it('should add upsell request', () => {
      const { addUpsellRequest } = useCompanyHubStore.getState();

      addUpsellRequest({
        requiredEmployeeId: 'emp-1',
        requiredEmployeeName: 'Premium Agent',
        requiredEmployeeRole: 'specialist',
        provider: 'anthropic',
        price: 29.99,
        reason: 'Required for advanced analysis',
        taskDescription: 'Complex data analysis',
      });

      const state = useCompanyHubStore.getState();
      expect(state.upsellQueue).toHaveLength(1);
      expect(state.pendingUpsell).not.toBeNull();
      expect(state.isPaused).toBe(true);
    });

    it('should resolve upsell as approved', () => {
      const { addUpsellRequest, resolveUpsell } = useCompanyHubStore.getState();

      addUpsellRequest({
        requiredEmployeeId: 'emp-1',
        requiredEmployeeName: 'Premium Agent',
        requiredEmployeeRole: 'specialist',
        provider: 'anthropic',
        price: 29.99,
        reason: 'Required',
        taskDescription: 'Task',
      });

      const requestId = useCompanyHubStore.getState().upsellQueue[0].id;
      resolveUpsell(requestId, 'approved');

      const state = useCompanyHubStore.getState();
      expect(state.upsellQueue[0].isResolved).toBe(true);
      expect(state.upsellQueue[0].userResponse).toBe('approved');
      expect(state.pendingUpsell).toBeNull();
      expect(state.isPaused).toBe(false);
    });

    it('should resolve upsell as denied', () => {
      const { addUpsellRequest, resolveUpsell } = useCompanyHubStore.getState();

      addUpsellRequest({
        requiredEmployeeId: 'emp-1',
        requiredEmployeeName: 'Premium Agent',
        requiredEmployeeRole: 'specialist',
        provider: 'anthropic',
        price: 29.99,
        reason: 'Required',
        taskDescription: 'Task',
      });

      const requestId = useCompanyHubStore.getState().upsellQueue[0].id;
      resolveUpsell(requestId, 'denied');

      const state = useCompanyHubStore.getState();
      expect(state.upsellQueue[0].userResponse).toBe('denied');
    });

    it('should set pending upsell', () => {
      const { setPendingUpsell } = useCompanyHubStore.getState();

      const upsell: UpsellRequest = {
        id: 'upsell-1',
        requiredEmployeeId: 'emp-1',
        requiredEmployeeName: 'Agent',
        requiredEmployeeRole: 'specialist',
        provider: 'anthropic',
        price: 19.99,
        reason: 'Needed',
        taskDescription: 'Task',
        isResolved: false,
        timestamp: new Date(),
      };

      setPendingUpsell(upsell);

      const state = useCompanyHubStore.getState();
      expect(state.pendingUpsell).toEqual(upsell);
      expect(state.isPaused).toBe(true);

      setPendingUpsell(null);
      expect(useCompanyHubStore.getState().isPaused).toBe(false);
    });
  });

  describe('Orchestration Control', () => {
    it('should start orchestration', () => {
      const { createSession, startOrchestration } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');
      startOrchestration();

      const state = useCompanyHubStore.getState();
      expect(state.isOrchestrating).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.error).toBeNull();
      expect(state.sessions[state.activeSessionId!].status).toBe('executing');
    });

    it('should pause orchestration', () => {
      const { createSession, startOrchestration, pauseOrchestration } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');
      startOrchestration();
      pauseOrchestration();

      const state = useCompanyHubStore.getState();
      expect(state.isPaused).toBe(true);
      expect(state.sessions[state.activeSessionId!].status).toBe('paused');
    });

    it('should resume orchestration', () => {
      const {
        createSession,
        startOrchestration,
        pauseOrchestration,
        resumeOrchestration,
      } = useCompanyHubStore.getState();

      createSession('user-123', 'Task');
      startOrchestration();
      pauseOrchestration();
      resumeOrchestration();

      const state = useCompanyHubStore.getState();
      expect(state.isPaused).toBe(false);
      expect(state.sessions[state.activeSessionId!].status).toBe('executing');
    });

    it('should stop orchestration', () => {
      const { createSession, startOrchestration, stopOrchestration } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');
      startOrchestration();
      stopOrchestration();

      const state = useCompanyHubStore.getState();
      expect(state.isOrchestrating).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.sessions[state.activeSessionId!].status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should set error', () => {
      const { createSession, startOrchestration, setError } =
        useCompanyHubStore.getState();

      createSession('user-123', 'Task');
      startOrchestration();
      setError('Something went wrong');

      const state = useCompanyHubStore.getState();
      expect(state.error).toBe('Something went wrong');
      expect(state.isOrchestrating).toBe(false);
      expect(state.sessions[state.activeSessionId!].status).toBe('failed');
    });

    it('should clear error', () => {
      const { setError } = useCompanyHubStore.getState();

      setError('Error');
      setError(null);

      expect(useCompanyHubStore.getState().error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const {
        createSession,
        assignAgent,
        addMessage,
        addTokens,
        startOrchestration,
        setError,
        reset,
      } = useCompanyHubStore.getState();

      // Populate state
      createSession('user-123', 'Task');
      assignAgent({
        agentId: 'agent-1',
        agentName: 'Agent',
        role: 'worker',
        provider: 'anthropic',
        status: 'idle',
        progress: 0,
      });
      addMessage({
        sessionId: 'session-1',
        from: 'user',
        type: 'user',
        content: 'Hello',
      });
      addTokens('model', 1000, 0.01, 'anthropic');
      startOrchestration();
      setError('Error');

      // Reset
      reset();

      const state = useCompanyHubStore.getState();
      expect(state.activeSessionId).toBeNull();
      expect(state.sessions).toEqual({});
      expect(state.assignedAgents).toEqual({});
      expect(state.messages).toEqual([]);
      expect(state.isOrchestrating).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating session status for non-existent session', () => {
      const { updateSessionStatus } = useCompanyHubStore.getState();

      // Should not throw
      expect(() => {
        updateSessionStatus('non-existent', 'completed');
      }).not.toThrow();
    });

    it('should handle completing non-existent session', () => {
      const { completeSession } = useCompanyHubStore.getState();

      // Should not throw
      expect(() => {
        completeSession('non-existent');
      }).not.toThrow();
    });

    it('should handle operations without active session', () => {
      const { startOrchestration, pauseOrchestration, stopOrchestration } =
        useCompanyHubStore.getState();

      // These should not throw even without active session
      expect(() => {
        startOrchestration();
        pauseOrchestration();
        stopOrchestration();
      }).not.toThrow();
    });

    it('should handle resolving non-existent upsell', () => {
      const { resolveUpsell } = useCompanyHubStore.getState();

      // Should not throw
      expect(() => {
        resolveUpsell('non-existent', 'approved');
      }).not.toThrow();
    });
  });
});
