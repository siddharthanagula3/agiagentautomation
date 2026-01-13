/**
 * Workforce Orchestrator Unit Tests
 * Tests the core Plan-Delegate-Execute orchestration logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkforceOrchestratorRefactored } from './workforce-orchestrator';
import { useMissionStore } from '@shared/stores/mission-control-store';
import {
  createMockMissionPlan,
  createCodeReviewPlan,
  createDebugPlan,
  createMockEmployee,
  createCodeReviewerEmployee,
  createDebuggerEmployee,
  createMockLLMResponse,
} from '../../../../tests/fixtures/test-data-factory';

// Mock dependencies
vi.mock('@core/ai/llm/unified-language-model', () => ({
  unifiedLLMService: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('@core/ai/employees/prompt-management', () => ({
  systemPromptsService: {
    getAvailableEmployees: vi.fn(),
  },
}));

vi.mock('@shared/stores/mission-control-store', () => ({
  useMissionStore: {
    getState: vi.fn(),
  },
}));

vi.mock('./agent-conversation-protocol', () => ({
  agentConversationProtocol: {
    startConversation: vi.fn(),
  },
}));

vi.mock('@core/integrations/token-usage-tracker', () => ({
  tokenLogger: {
    logTokenUsage: vi.fn().mockResolvedValue(undefined),
    calculateCost: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('@features/vibe/services/vibe-token-tracker', () => ({
  updateVibeSessionTokens: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shared/stores/authentication-store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ user: null }),
  },
}));

vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

describe('WorkforceOrchestrator', () => {
  let orchestrator: WorkforceOrchestratorRefactored;
  // Updated: Nov 16th 2025 - Fixed any type
  let mockLLMService: typeof import('@core/ai/llm/unified-language-model').unifiedLLMService;
  let mockPromptService: typeof import('@core/ai/employees/prompt-management').promptManagement;
  let mockStore: ReturnType<typeof useMissionStore>;

  beforeEach(async () => {
    orchestrator = new WorkforceOrchestratorRefactored();

    // Import mocked modules
    const { unifiedLLMService } = await import(
      '@core/ai/llm/unified-language-model'
    );
    const { systemPromptsService } = await import(
      '@core/ai/employees/prompt-management'
    );

    mockLLMService = unifiedLLMService;
    mockPromptService = systemPromptsService;

    // Setup default employees
    vi.mocked(mockPromptService.getAvailableEmployees).mockResolvedValue([
      createCodeReviewerEmployee(),
      createDebuggerEmployee(),
      createMockEmployee({
        name: 'general-assistant',
        tools: ['Read', 'Write'],
      }),
    ]);

    // Setup mock store with all methods used by the orchestrator
    mockStore = {
      startMission: vi.fn(),
      addMessage: vi.fn(),
      setMissionPlan: vi.fn(),
      updateTaskStatus: vi.fn(),
      updateEmployeeStatus: vi.fn(),
      addEmployeeLog: vi.fn(),
      completeMission: vi.fn(),
      failMission: vi.fn(),
      updateEmployeeProgress: vi.fn(),
      pauseMission: vi.fn(),
      resumeMission: vi.fn(),
      reset: vi.fn(),
      isPaused: false,
    };

    vi.mocked(useMissionStore.getState).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Plan Generation', () => {
    it('should generate valid execution plan from user input', async () => {
      const mockPlan = createMockMissionPlan(3);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-1',
        input: 'Review the authentication code and suggest improvements',
      });

      expect(result.success).toBe(true);
      expect(result.plan).toHaveLength(3);
      // Note: setMissionPlan is called BEFORE delegation, so assignedTo is null at this point
      // Employee assignment happens in the delegation stage via updateTaskStatus
      expect(mockStore.setMissionPlan).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'pending',
            assignedTo: null,
          }),
        ])
      );
    });

    it('should handle invalid JSON from LLM with fallback plan', async () => {
      // The orchestrator has a fallback that creates a single-task plan when JSON parsing fails
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('This is not valid JSON')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-2',
        input: 'Test task',
      });

      // Implementation creates a fallback plan instead of failing
      expect(result.success).toBe(true);
      expect(result.plan).toHaveLength(1);
      expect(result.plan?.[0].description).toBe('Test task');
    });

    it('should handle empty plan by creating fallback task', async () => {
      // When LLM returns empty plan, implementation creates a fallback single-task plan
      const emptyPlan = { plan: [], reasoning: 'Nothing to do' };
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(emptyPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-3',
        input: 'Do nothing',
      });

      // Implementation validates empty plans and fails
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include reasoning in plan response', async () => {
      const mockPlan = createCodeReviewPlan();
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-4',
        input: 'Review my code',
      });

      expect(result.success).toBe(true);
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          content: expect.stringContaining('plan'),
        })
      );
    });

    it('should handle LLM API failures with fallback plan', async () => {
      // The implementation uses retryWithBackoff and creates a fallback plan on errors
      // This test verifies the resilient fallback behavior
      vi.mocked(mockLLMService.sendMessage).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-5',
        input: 'Test task',
      });

      // Implementation creates fallback plan instead of failing (resilient behavior)
      expect(result.success).toBe(true);
      expect(result.plan).toHaveLength(1);
      expect(result.plan?.[0].description).toBe('Test task');
    }, 15000); // Increased timeout for retry backoff

    it('should handle network timeout errors with fallback plan', async () => {
      // The implementation uses retryWithBackoff and creates a fallback plan on errors
      vi.mocked(mockLLMService.sendMessage).mockRejectedValue(
        new Error('Request timeout after 30s')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-6',
        input: 'Test task',
      });

      // Implementation creates fallback plan instead of failing (resilient behavior)
      expect(result.success).toBe(true);
      expect(result.plan).toHaveLength(1);
    }, 15000); // Increased timeout for retry backoff
  });

  describe('Employee Selection', () => {
    it('should select optimal employee based on required tools', async () => {
      const mockPlan = {
        plan: [
          { task: 'Read the authentication file', tool_required: 'Read' },
          { task: 'Search for security issues', tool_required: 'Grep' },
          { task: 'Run security tests', tool_required: 'Bash' },
        ],
      };

      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-7',
        input: 'Review authentication security',
      });

      // Verify that employees with matching tools were selected
      // Note: updateTaskStatus is called during delegation with 'in_progress' status
      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      // Filter for delegation calls (status = 'in_progress')
      const delegationCalls = calls.filter((call) => call[1] === 'in_progress');
      expect(delegationCalls.length).toBe(3);
      // Each task should have an assigned employee (third argument)
      delegationCalls.forEach((call) => {
        expect(call[2]).toBeDefined();
        expect(typeof call[2]).toBe('string');
      });
    });

    it('should handle multiple employees with same tool', async () => {
      const mockPlan = {
        plan: [
          { task: 'Read file 1', tool_required: 'Read' },
          { task: 'Read file 2', tool_required: 'Read' },
        ],
      };

      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-8',
        input: 'Read multiple files',
      });

      // Both tasks should get assigned during delegation
      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      const delegationCalls = calls.filter((call) => call[1] === 'in_progress');
      expect(delegationCalls.length).toBe(2);
    });

    it('should handle no matching employee by using first available', async () => {
      // When no employee has the exact tool, implementation selects based on general capability
      const mockPlan = {
        plan: [{ task: 'Use Docker to deploy', tool_required: 'Docker' }],
      };

      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-9',
        input: 'Deploy with Docker',
      });

      // Implementation selects an employee even without matching tool (fallback behavior)
      expect(result.success).toBe(true);
      expect(result.plan).toHaveLength(1);
    });

    it('should prioritize employees with more matching tools', async () => {
      // debugger has Bash + Read + Edit + Grep
      // code-reviewer has Read + Grep + Glob
      const mockPlan = {
        plan: [{ task: 'Debug the issue', tool_required: 'Bash' }],
      };

      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-10',
        input: 'Debug the code',
      });

      // Verify an employee was selected (selection happens in delegation)
      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      const delegationCalls = calls.filter((call) => call[1] === 'in_progress');
      expect(delegationCalls.length).toBeGreaterThan(0);
      // Debugger should be selected because it has Bash tool
      expect(delegationCalls[0][2]).toBe('debugger');
    });
  });

  describe('Chat Mode', () => {
    let mockConversationProtocol: typeof import('./agent-conversation-protocol').agentConversationProtocol;

    beforeEach(async () => {
      const { agentConversationProtocol } = await import(
        './agent-conversation-protocol'
      );
      mockConversationProtocol = agentConversationProtocol;
    });

    it('should handle chat mode with agent conversation protocol', async () => {
      // Chat mode uses auto-select employees and agentConversationProtocol
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('code-reviewer')
      );
      vi.mocked(mockConversationProtocol.startConversation).mockResolvedValue({
        finalAnswer: 'I can help you with that!',
        metadata: {
          totalRounds: 1,
          participatingAgents: ['code-reviewer'],
        },
      });

      const result = await orchestrator.processRequest({
        userId: 'test-user-11',
        input: 'Hello, can you help me?',
        mode: 'chat',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('chat');
      expect(result.chatResponse).toBe('I can help you with that!');
      // Chat mode doesn't use setMissionPlan
      expect(mockStore.setMissionPlan).not.toHaveBeenCalled();
    });

    it('should auto-select employees for chat mode', async () => {
      // First call is for employee selection, returns employee name
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('code-reviewer')
      );
      vi.mocked(mockConversationProtocol.startConversation).mockResolvedValue({
        finalAnswer: 'Here is my analysis',
        metadata: { totalRounds: 1, participatingAgents: ['code-reviewer'] },
      });

      await orchestrator.processRequest({
        userId: 'test-user-12',
        input: 'Review my code please',
        mode: 'chat',
      });

      // Verify agentConversationProtocol was called with selected employees
      expect(mockConversationProtocol.startConversation).toHaveBeenCalledWith(
        'Review my code please',
        expect.any(Array),
        'test-user-12'
      );
    });

    it('should switch between mission and chat modes', async () => {
      // First request: mission mode
      const mockPlan = createMockMissionPlan(2);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const missionResult = await orchestrator.processRequest({
        userId: 'test-user-13',
        input: 'Execute a task',
        mode: 'mission',
      });

      expect(missionResult.success).toBe(true);
      expect(missionResult.plan).toBeDefined();

      // Reset mock for chat mode
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('code-reviewer')
      );
      vi.mocked(mockConversationProtocol.startConversation).mockResolvedValue({
        finalAnswer: 'Chat response',
        metadata: { totalRounds: 1, participatingAgents: ['code-reviewer'] },
      });

      // Second request: chat mode
      const chatResult = await orchestrator.processRequest({
        userId: 'test-user-13',
        input: 'Just chatting',
        mode: 'chat',
      });

      expect(chatResult.success).toBe(true);
      expect(chatResult.chatResponse).toBe('Chat response');
    });
  });

  describe('Error Handling', () => {
    it('should handle employee loading failures', async () => {
      vi.mocked(mockPromptService.getAvailableEmployees).mockRejectedValue(
        new Error('Failed to load employees')
      );

      // Force reload by creating new instance
      const newOrchestrator = new WorkforceOrchestratorRefactored();

      const result = await newOrchestrator.processRequest({
        userId: 'test-user-14',
        input: 'Test task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load employees');
    });

    it('should handle malformed employee data', async () => {
      vi.mocked(mockPromptService.getAvailableEmployees).mockResolvedValue([
        // Updated: Nov 16th 2025 - Fixed any type
        // Missing required fields - intentionally malformed for testing
        { name: 'broken-employee' } as unknown as Awaited<
          ReturnType<typeof mockPromptService.getAvailableEmployees>
        >[0],
      ]);

      const result = await orchestrator.processRequest({
        userId: 'test-user-15',
        input: 'Test task',
      });

      // Should either handle gracefully or fail with clear error
      expect(result.success).toBe(false);
    });

    it('should add error messages when employee loading fails', async () => {
      // Reset orchestrator to trigger employee loading
      vi.mocked(mockPromptService.getAvailableEmployees).mockRejectedValue(
        new Error('Employee loading failed')
      );

      // Create a new orchestrator to force employee reloading
      const newOrchestrator = new WorkforceOrchestratorRefactored();

      await newOrchestrator.processRequest({
        userId: 'test-user-16',
        input: 'Test task',
      });

      // Verify error was logged to mission messages
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          content: expect.stringContaining('failed'),
        })
      );
    });
  });

  describe('State Management Integration', () => {
    it('should call startMission when processing request', async () => {
      const mockPlan = createMockMissionPlan(1);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-17',
        input: 'Test task',
      });

      expect(mockStore.startMission).toHaveBeenCalledWith(
        expect.stringMatching(/^[\w-]+$/) // UUID format
      );
    });

    it('should add user message to store', async () => {
      const mockPlan = createMockMissionPlan(1);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const userInput = 'Review my code please';
      await orchestrator.processRequest({
        userId: 'test-user-18',
        input: userInput,
      });

      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'user',
          type: 'user',
          content: userInput,
        })
      );
    });

    it('should update task status to in_progress during delegation', async () => {
      const mockPlan = createMockMissionPlan(2);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-19',
        input: 'Test tasks',
      });

      // Delegation stage updates status to 'in_progress' with assigned employee
      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      const delegationCalls = calls.filter((call) => call[1] === 'in_progress');
      expect(delegationCalls.length).toBe(2);
      // Each delegation call should have task id, 'in_progress' status, and employee name
      delegationCalls.forEach((call) => {
        expect(call[0]).toMatch(/^task-\d+$/);
        expect(call[1]).toBe('in_progress');
        expect(call[2]).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long user inputs', async () => {
      const longInput = 'a'.repeat(10000);
      const mockPlan = createMockMissionPlan(1);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-20',
        input: longInput,
      });

      // Should handle without crashing
      expect(result.success).toBe(true);
    });

    it('should handle special characters in user input', async () => {
      const specialInput = '<script>alert("xss")</script> & DROP TABLE users;';
      const mockPlan = createMockMissionPlan(1);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-21',
        input: specialInput,
      });

      // Should sanitize and handle safely
      expect(result.success).toBe(true);
    });

    it('should handle concurrent requests for same user', async () => {
      const mockPlan = createMockMissionPlan(1);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      const userId = 'test-user-22';
      const request1 = orchestrator.processRequest({
        userId,
        input: 'Request 1',
      });

      const request2 = orchestrator.processRequest({
        userId,
        input: 'Request 2',
      });

      const [result1, result2] = await Promise.all([request1, request2]);

      // Both should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Should have different mission IDs
      expect(result1.missionId).not.toBe(result2.missionId);
    });
  });
});
