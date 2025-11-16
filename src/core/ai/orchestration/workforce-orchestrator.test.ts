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

describe('WorkforceOrchestrator', () => {
  let orchestrator: WorkforceOrchestratorRefactored;
  let mockLLMService: any;
  let mockPromptService: any;
  let mockStore: any;

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

    // Setup mock store
    mockStore = {
      startMission: vi.fn(),
      addMessage: vi.fn(),
      setMissionPlan: vi.fn(),
      updateTaskStatus: vi.fn(),
      updateEmployeeStatus: vi.fn(),
      addEmployeeLog: vi.fn(),
      completeMission: vi.fn(),
      failMission: vi.fn(),
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
      expect(mockStore.setMissionPlan).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'pending',
            assignedTo: expect.any(String),
          }),
        ])
      );
    });

    it('should handle invalid JSON from LLM gracefully', async () => {
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('This is not valid JSON')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-2',
        input: 'Test task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate execution plan');
      expect(mockStore.failMission).toHaveBeenCalled();
    });

    it('should handle empty plan gracefully', async () => {
      const emptyPlan = { plan: [], reasoning: 'Nothing to do' };
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(emptyPlan))
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-3',
        input: 'Do nothing',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate execution plan');
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

    it('should handle LLM API failures gracefully', async () => {
      vi.mocked(mockLLMService.sendMessage).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-5',
        input: 'Test task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
      expect(mockStore.failMission).toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      vi.mocked(mockLLMService.sendMessage).mockRejectedValue(
        new Error('Request timeout after 30s')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-6',
        input: 'Test task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
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

      // code-reviewer has Grep tool
      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      const grepTaskCall = calls.find((call) => call[0].includes('task-2'));
      expect(grepTaskCall?.[2]).toBe('code-reviewer');
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

      // Both tasks should get assigned (could be different employees)
      expect(mockStore.updateTaskStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle no matching employee gracefully', async () => {
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('No employee available');
      expect(result.error).toContain('Docker');
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

      const calls = vi.mocked(mockStore.updateTaskStatus).mock.calls;
      expect(calls[0][2]).toBe('debugger'); // debugger has Bash
    });
  });

  describe('Chat Mode', () => {
    it('should handle chat mode without orchestration', async () => {
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('I can help you with that!')
      );

      const result = await orchestrator.processRequest({
        userId: 'test-user-11',
        input: 'Hello, can you help me?',
        mode: 'chat',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('chat');
      expect(result.chatResponse).toBe('I can help you with that!');
      expect(mockStore.setMissionPlan).not.toHaveBeenCalled();
    });

    it('should include conversation history in chat mode', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];

      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('Follow-up response')
      );

      await orchestrator.processRequest({
        userId: 'test-user-12',
        input: 'Follow-up question',
        mode: 'chat',
        conversationHistory,
      });

      expect(mockLLMService.sendMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Previous message',
          }),
          expect.objectContaining({ content: 'Follow-up question' }),
        ])
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

      // Second request: chat mode
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse('Chat response')
      );

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
        // Missing required fields
        { name: 'broken-employee' } as any,
      ]);

      const result = await orchestrator.processRequest({
        userId: 'test-user-15',
        input: 'Test task',
      });

      // Should either handle gracefully or fail with clear error
      expect(result.success).toBe(false);
    });

    it('should add error messages to mission log', async () => {
      vi.mocked(mockLLMService.sendMessage).mockRejectedValue(
        new Error('API Error')
      );

      await orchestrator.processRequest({
        userId: 'test-user-16',
        input: 'Test task',
      });

      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          content: expect.stringContaining('API Error'),
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

    it('should update task status to pending after assignment', async () => {
      const mockPlan = createMockMissionPlan(2);
      vi.mocked(mockLLMService.sendMessage).mockResolvedValue(
        createMockLLMResponse(JSON.stringify(mockPlan))
      );

      await orchestrator.processRequest({
        userId: 'test-user-19',
        input: 'Test tasks',
      });

      // Should update status for each task
      expect(mockStore.updateTaskStatus).toHaveBeenCalledTimes(2);
      expect(mockStore.updateTaskStatus).toHaveBeenCalledWith(
        expect.any(String),
        'pending',
        expect.any(String) // assigned employee
      );
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
