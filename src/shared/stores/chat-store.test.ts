/**
 * Chat Store Tests
 *
 * Tests for chat conversations, messages, and AI interactions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useChatStore, type Conversation, type Message } from './chat-store';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () =>
    `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useChatStore.getState().clearHistory();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Conversation Management', () => {
    describe('createConversation', () => {
      it('should create a new conversation with default values', () => {
        const { createConversation } = useChatStore.getState();

        const id = createConversation();

        const state = useChatStore.getState();
        expect(state.conversations[id]).toBeDefined();
        expect(state.conversations[id].title).toBe('New Conversation');
        expect(state.conversations[id].messages).toHaveLength(0);
        expect(state.conversations[id].model).toBe('gpt-4o-mini');
        expect(state.activeConversationId).toBe(id);
      });

      it('should create conversation with custom title', () => {
        const { createConversation } = useChatStore.getState();

        const id = createConversation('My Custom Chat');

        expect(useChatStore.getState().conversations[id].title).toBe(
          'My Custom Chat'
        );
      });

      it('should create conversation with custom model', () => {
        const { createConversation } = useChatStore.getState();

        const id = createConversation('Test', 'gpt-4');

        expect(useChatStore.getState().conversations[id].model).toBe('gpt-4');
      });

      it('should set metadata timestamps', () => {
        const { createConversation } = useChatStore.getState();
        const now = new Date();
        vi.setSystemTime(now);

        const id = createConversation();

        const conv = useChatStore.getState().conversations[id];
        expect(conv.metadata.createdAt).toEqual(now);
        expect(conv.metadata.updatedAt).toEqual(now);
      });
    });

    describe('updateConversation', () => {
      it('should update conversation properties', () => {
        const { createConversation, updateConversation } =
          useChatStore.getState();

        const id = createConversation();
        updateConversation(id, { title: 'Updated Title' });

        expect(useChatStore.getState().conversations[id].title).toBe(
          'Updated Title'
        );
      });

      it('should update metadata.updatedAt', () => {
        const { createConversation, updateConversation } =
          useChatStore.getState();
        const createTime = new Date();
        vi.setSystemTime(createTime);

        const id = createConversation();

        vi.setSystemTime(new Date(createTime.getTime() + 1000));
        updateConversation(id, { title: 'Updated' });

        const conv = useChatStore.getState().conversations[id];
        expect(conv.metadata.updatedAt.getTime()).toBeGreaterThan(
          conv.metadata.createdAt.getTime()
        );
      });

      it('should handle non-existent conversation', () => {
        const { updateConversation } = useChatStore.getState();

        // Should not throw
        expect(() => {
          updateConversation('nonexistent', { title: 'Test' });
        }).not.toThrow();
      });
    });

    describe('deleteConversation', () => {
      it('should delete conversation', () => {
        const { createConversation, deleteConversation } =
          useChatStore.getState();

        const id = createConversation();
        deleteConversation(id);

        expect(useChatStore.getState().conversations[id]).toBeUndefined();
      });

      it('should clear activeConversationId if deleted', () => {
        const { createConversation, deleteConversation } =
          useChatStore.getState();

        const id = createConversation();
        expect(useChatStore.getState().activeConversationId).toBe(id);

        deleteConversation(id);

        expect(useChatStore.getState().activeConversationId).toBeNull();
      });
    });

    describe('setActiveConversation', () => {
      it('should set active conversation', () => {
        const { createConversation, setActiveConversation } =
          useChatStore.getState();

        const id1 = createConversation('Chat 1');
        const id2 = createConversation('Chat 2');

        setActiveConversation(id1);
        expect(useChatStore.getState().activeConversationId).toBe(id1);

        useChatStore.getState().setActiveConversation(id2);
        expect(useChatStore.getState().activeConversationId).toBe(id2);
      });

      it('should allow setting to null', () => {
        const { createConversation, setActiveConversation } =
          useChatStore.getState();

        createConversation();
        setActiveConversation(null);

        expect(useChatStore.getState().activeConversationId).toBeNull();
      });

      it('should update lastActivity', () => {
        const { createConversation, setActiveConversation } =
          useChatStore.getState();

        const id = createConversation();
        setActiveConversation(id);

        expect(useChatStore.getState().lastActivity).not.toBeNull();
      });
    });

    describe('duplicateConversation', () => {
      it('should create a copy of conversation', () => {
        const { createConversation, addMessage, duplicateConversation } =
          useChatStore.getState();

        const originalId = createConversation('Original');
        addMessage(originalId, {
          conversationId: originalId,
          role: 'user',
          content: 'Hello',
        });

        const copyId = duplicateConversation(originalId);

        const copy = useChatStore.getState().conversations[copyId];
        expect(copy.title).toBe('Original (Copy)');
        expect(copy.messages).toHaveLength(1);
        expect(copy.id).not.toBe(originalId);
      });

      it('should return empty string for non-existent conversation', () => {
        const { duplicateConversation } = useChatStore.getState();

        const result = duplicateConversation('nonexistent');

        expect(result).toBe('');
      });
    });
  });

  describe('Message Management', () => {
    describe('addMessage', () => {
      it('should add message to conversation', () => {
        const { createConversation, addMessage } = useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Hello, AI!',
        });

        const conv = useChatStore.getState().conversations[convId];
        expect(conv.messages).toHaveLength(1);
        expect(conv.messages[0].id).toBe(msgId);
        expect(conv.messages[0].content).toBe('Hello, AI!');
        expect(conv.messages[0].role).toBe('user');
      });

      it('should auto-generate id and timestamp', () => {
        const { createConversation, addMessage } = useChatStore.getState();
        const now = new Date();
        vi.setSystemTime(now);

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Test',
        });

        const msg = useChatStore.getState().conversations[convId].messages[0];
        expect(msg.id).toBe(msgId);
        expect(msg.timestamp).toEqual(now);
      });

      it('should increment totalMessages count', () => {
        const { createConversation, addMessage } = useChatStore.getState();

        const convId = createConversation();
        expect(
          useChatStore.getState().conversations[convId].metadata.totalMessages
        ).toBe(0);

        addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Test',
        });

        expect(
          useChatStore.getState().conversations[convId].metadata.totalMessages
        ).toBe(1);
      });

      it('should track token usage in metadata', () => {
        const { createConversation, addMessage } = useChatStore.getState();

        const convId = createConversation();
        addMessage(convId, {
          conversationId: convId,
          role: 'assistant',
          content: 'Response',
          metadata: {
            tokensUsed: 100,
            cost: 0.01,
          },
        });

        const conv = useChatStore.getState().conversations[convId];
        expect(conv.metadata.totalTokens).toBe(100);
        expect(conv.metadata.totalCost).toBe(0.01);
      });
    });

    describe('updateMessage', () => {
      it('should update message content', () => {
        const { createConversation, addMessage, updateMessage } =
          useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'assistant',
          content: 'Initial response',
          isStreaming: true,
        });

        updateMessage(msgId, {
          content: 'Updated response',
          isStreaming: false,
        });

        const msg = useChatStore.getState().conversations[convId].messages[0];
        expect(msg.content).toBe('Updated response');
        expect(msg.isStreaming).toBe(false);
      });
    });

    describe('deleteMessage', () => {
      it('should delete message', () => {
        const { createConversation, addMessage, deleteMessage } =
          useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Test',
        });

        deleteMessage(msgId);

        expect(
          useChatStore.getState().conversations[convId].messages
        ).toHaveLength(0);
      });

      it('should decrement totalMessages count', () => {
        const { createConversation, addMessage, deleteMessage } =
          useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Test',
        });

        expect(
          useChatStore.getState().conversations[convId].metadata.totalMessages
        ).toBe(1);

        deleteMessage(msgId);

        expect(
          useChatStore.getState().conversations[convId].metadata.totalMessages
        ).toBe(0);
      });
    });

    describe('reactToMessage', () => {
      it('should add reaction to message', () => {
        const { createConversation, addMessage, reactToMessage } =
          useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'assistant',
          content: 'Response',
        });

        reactToMessage(msgId, 'helpful');

        const msg = useChatStore.getState().conversations[convId].messages[0];
        expect(msg.reactions).toHaveLength(1);
        expect(msg.reactions![0].type).toBe('helpful');
      });

      it('should toggle reaction on second click', () => {
        const { createConversation, addMessage, reactToMessage } =
          useChatStore.getState();

        const convId = createConversation();
        const msgId = addMessage(convId, {
          conversationId: convId,
          role: 'assistant',
          content: 'Response',
        });

        reactToMessage(msgId, 'helpful');
        useChatStore.getState().reactToMessage(msgId, 'helpful');

        const msg = useChatStore.getState().conversations[convId].messages[0];
        expect(msg.reactions).toHaveLength(0);
      });
    });
  });

  describe('Search and Filtering', () => {
    describe('setSearchQuery', () => {
      it('should update search query', () => {
        const { setSearchQuery } = useChatStore.getState();

        setSearchQuery('test query');

        expect(useChatStore.getState().searchQuery).toBe('test query');
      });
    });

    describe('addFilterTag/removeFilterTag', () => {
      it('should add filter tag', () => {
        const { addFilterTag } = useChatStore.getState();

        addFilterTag('work');

        expect(useChatStore.getState().filterTags).toContain('work');
      });

      it('should not add duplicate tags', () => {
        const { addFilterTag } = useChatStore.getState();

        addFilterTag('work');
        addFilterTag('work');

        expect(
          useChatStore.getState().filterTags.filter((t) => t === 'work')
        ).toHaveLength(1);
      });

      it('should remove filter tag', () => {
        const { addFilterTag, removeFilterTag } = useChatStore.getState();

        addFilterTag('work');
        removeFilterTag('work');

        expect(useChatStore.getState().filterTags).not.toContain('work');
      });
    });

    describe('clearFilters', () => {
      it('should clear all filters', () => {
        const { setSearchQuery, addFilterTag, clearFilters } =
          useChatStore.getState();

        setSearchQuery('test');
        addFilterTag('work');
        clearFilters();

        const state = useChatStore.getState();
        expect(state.searchQuery).toBe('');
        expect(state.filterTags).toHaveLength(0);
      });
    });
  });

  describe('Model Management', () => {
    describe('setSelectedModel', () => {
      it('should update selected model', () => {
        const { setSelectedModel } = useChatStore.getState();

        setSelectedModel('gpt-4');

        expect(useChatStore.getState().selectedModel).toBe('gpt-4');
      });
    });

    describe('updateModelSettings', () => {
      it('should update default settings', () => {
        const { updateModelSettings } = useChatStore.getState();

        updateModelSettings({ temperature: 0.9 });

        expect(useChatStore.getState().defaultSettings.temperature).toBe(0.9);
      });

      it('should merge with existing settings', () => {
        const { updateModelSettings } = useChatStore.getState();

        updateModelSettings({ temperature: 0.9 });

        const settings = useChatStore.getState().defaultSettings;
        expect(settings.temperature).toBe(0.9);
        expect(settings.maxTokens).toBe(2048); // Unchanged
      });
    });
  });

  describe('Utility Actions', () => {
    describe('exportConversation', () => {
      it('should export as JSON', () => {
        const { createConversation, addMessage, exportConversation } =
          useChatStore.getState();

        const convId = createConversation('Test Chat');
        addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Hello',
        });

        const json = exportConversation(convId, 'json');
        const parsed = JSON.parse(json);

        expect(parsed.title).toBe('Test Chat');
        expect(parsed.messages).toHaveLength(1);
      });

      it('should export as markdown', () => {
        const { createConversation, addMessage, exportConversation } =
          useChatStore.getState();

        const convId = createConversation('Test Chat');
        addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Hello',
        });

        const markdown = exportConversation(convId, 'markdown');

        expect(markdown).toContain('# Test Chat');
        expect(markdown).toContain('## User');
        expect(markdown).toContain('Hello');
      });

      it('should export as plain text', () => {
        const { createConversation, addMessage, exportConversation } =
          useChatStore.getState();

        const convId = createConversation('Test Chat');
        addMessage(convId, {
          conversationId: convId,
          role: 'user',
          content: 'Hello',
        });

        const txt = exportConversation(convId, 'txt');

        expect(txt).toContain('user: Hello');
      });

      it('should return empty string for non-existent conversation', () => {
        const { exportConversation } = useChatStore.getState();

        const result = exportConversation('nonexistent', 'json');

        expect(result).toBe('');
      });
    });

    describe('importConversations', () => {
      it('should import valid conversations', () => {
        const { importConversations } = useChatStore.getState();

        const conversations: Conversation[] = [
          {
            id: 'imported-1',
            title: 'Imported Chat',
            messages: [
              {
                id: 'msg-1',
                conversationId: 'imported-1',
                role: 'user',
                content: 'Hello',
                timestamp: new Date(),
              },
            ],
            participants: [],
            model: 'gpt-4',
            settings: {
              temperature: 0.7,
              maxTokens: 2048,
              topP: 1.0,
              frequencyPenalty: 0.0,
              presencePenalty: 0.0,
            },
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              totalMessages: 1,
              totalTokens: 0,
              totalCost: 0,
              tags: [],
              starred: false,
              pinned: false,
              archived: false,
            },
          },
        ];

        importConversations(conversations);

        expect(
          useChatStore.getState().conversations['imported-1']
        ).toBeDefined();
      });

      it('should skip invalid conversations', () => {
        const { importConversations } = useChatStore.getState();

        // @ts-expect-error - testing invalid data
        importConversations([{ invalid: 'data' }]);

        expect(Object.keys(useChatStore.getState().conversations)).toHaveLength(
          0
        );
      });

      it('should skip duplicates', () => {
        const { createConversation, importConversations } =
          useChatStore.getState();

        const id = createConversation('Original');

        const conversations: Conversation[] = [
          {
            id, // Same ID
            title: 'Duplicate',
            messages: [],
            participants: [],
            model: 'gpt-4',
            settings: {
              temperature: 0.7,
              maxTokens: 2048,
              topP: 1.0,
              frequencyPenalty: 0.0,
              presencePenalty: 0.0,
            },
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              totalMessages: 0,
              totalTokens: 0,
              totalCost: 0,
              tags: [],
              starred: false,
              pinned: false,
              archived: false,
            },
          },
        ];

        importConversations(conversations);

        // Title should remain 'Original', not 'Duplicate'
        expect(useChatStore.getState().conversations[id].title).toBe(
          'Original'
        );
      });

      it('should set error for non-array input', () => {
        const { importConversations } = useChatStore.getState();

        // @ts-expect-error - testing invalid data
        importConversations('not an array');

        expect(useChatStore.getState().error).toContain('Invalid import data');
      });
    });

    describe('clearHistory', () => {
      it('should clear all conversations', () => {
        const { createConversation, clearHistory } = useChatStore.getState();

        createConversation('Chat 1');
        createConversation('Chat 2');

        clearHistory();

        const state = useChatStore.getState();
        expect(Object.keys(state.conversations)).toHaveLength(0);
        expect(state.activeConversationId).toBeNull();
      });
    });

    describe('setError', () => {
      it('should set and clear error', () => {
        const { setError } = useChatStore.getState();

        setError('Something went wrong');
        expect(useChatStore.getState().error).toBe('Something went wrong');

        useChatStore.getState().setError(null);
        expect(useChatStore.getState().error).toBeNull();
      });
    });
  });

  describe('Conversation Metadata Actions', () => {
    describe('toggleStarConversation', () => {
      it('should toggle starred status', () => {
        const { createConversation, toggleStarConversation } =
          useChatStore.getState();

        const id = createConversation();
        expect(useChatStore.getState().conversations[id].metadata.starred).toBe(
          false
        );

        toggleStarConversation(id);
        expect(useChatStore.getState().conversations[id].metadata.starred).toBe(
          true
        );

        useChatStore.getState().toggleStarConversation(id);
        expect(useChatStore.getState().conversations[id].metadata.starred).toBe(
          false
        );
      });
    });

    describe('togglePinConversation', () => {
      it('should toggle pinned status', () => {
        const { createConversation, togglePinConversation } =
          useChatStore.getState();

        const id = createConversation();
        togglePinConversation(id);

        expect(useChatStore.getState().conversations[id].metadata.pinned).toBe(
          true
        );
      });
    });

    describe('toggleArchiveConversation', () => {
      it('should toggle archived status', () => {
        const { createConversation, toggleArchiveConversation } =
          useChatStore.getState();

        const id = createConversation();
        toggleArchiveConversation(id);

        expect(
          useChatStore.getState().conversations[id].metadata.archived
        ).toBe(true);
      });
    });

    describe('addConversationTag/removeConversationTag', () => {
      it('should add and remove tags', () => {
        const {
          createConversation,
          addConversationTag,
          removeConversationTag,
        } = useChatStore.getState();

        const id = createConversation();

        addConversationTag(id, 'work');
        expect(
          useChatStore.getState().conversations[id].metadata.tags
        ).toContain('work');

        useChatStore.getState().removeConversationTag(id, 'work');
        expect(
          useChatStore.getState().conversations[id].metadata.tags
        ).not.toContain('work');
      });

      it('should not add duplicate tags', () => {
        const { createConversation, addConversationTag } =
          useChatStore.getState();

        const id = createConversation();
        addConversationTag(id, 'work');
        useChatStore.getState().addConversationTag(id, 'work');

        expect(
          useChatStore
            .getState()
            .conversations[id].metadata.tags.filter((t) => t === 'work')
        ).toHaveLength(1);
      });
    });
  });

  describe('MGX-Style Interface Actions', () => {
    describe('toggleSidebar', () => {
      it('should toggle sidebar state', () => {
        const { toggleSidebar } = useChatStore.getState();

        expect(useChatStore.getState().sidebarOpen).toBe(true);

        toggleSidebar();
        expect(useChatStore.getState().sidebarOpen).toBe(false);

        useChatStore.getState().toggleSidebar();
        expect(useChatStore.getState().sidebarOpen).toBe(true);
      });
    });

    describe('selectEmployee/deselectEmployee', () => {
      it('should manage active employees', () => {
        const { selectEmployee, deselectEmployee } = useChatStore.getState();

        selectEmployee('employee-1');
        expect(useChatStore.getState().activeEmployees).toContain('employee-1');

        useChatStore.getState().selectEmployee('employee-2');
        expect(useChatStore.getState().activeEmployees).toContain('employee-2');

        useChatStore.getState().deselectEmployee('employee-1');
        expect(useChatStore.getState().activeEmployees).not.toContain(
          'employee-1'
        );
        expect(useChatStore.getState().activeEmployees).toContain('employee-2');
      });

      it('should not add duplicate employees', () => {
        const { selectEmployee } = useChatStore.getState();

        selectEmployee('employee-1');
        useChatStore.getState().selectEmployee('employee-1');

        expect(
          useChatStore
            .getState()
            .activeEmployees.filter((e) => e === 'employee-1')
        ).toHaveLength(1);
      });
    });

    describe('updateWorkingProcess', () => {
      it('should update working process for employee', () => {
        const { updateWorkingProcess } = useChatStore.getState();

        updateWorkingProcess('employee-1', {
          employeeId: 'employee-1',
          steps: [],
          currentStep: 0,
          status: 'working',
          totalSteps: 3,
        });

        expect(
          useChatStore.getState().workingProcesses['employee-1']
        ).toBeDefined();
        expect(
          useChatStore.getState().workingProcesses['employee-1'].status
        ).toBe('working');
      });
    });

    describe('saveCheckpoint/restoreCheckpoint', () => {
      it('should save and track checkpoints', () => {
        const { saveCheckpoint } = useChatStore.getState();
        const now = new Date();
        vi.setSystemTime(now);

        saveCheckpoint({
          id: 'checkpoint-1',
          sessionId: 'session-1',
          messageCount: 5,
          timestamp: now,
          label: 'Before changes',
        });

        const state = useChatStore.getState();
        expect(state.checkpointHistory).toHaveLength(1);
        expect(state.currentCheckpoint).toBe('checkpoint-1');
      });

      it('should restore checkpoint', () => {
        const { saveCheckpoint, restoreCheckpoint } = useChatStore.getState();
        const now = new Date();

        saveCheckpoint({
          id: 'checkpoint-1',
          sessionId: 'session-1',
          messageCount: 5,
          timestamp: now,
          label: 'First',
        });

        useChatStore.getState().saveCheckpoint({
          id: 'checkpoint-2',
          sessionId: 'session-1',
          messageCount: 10,
          timestamp: now,
          label: 'Second',
        });

        useChatStore.getState().restoreCheckpoint('checkpoint-1');

        expect(useChatStore.getState().currentCheckpoint).toBe('checkpoint-1');
      });
    });
  });

  describe('AI Interactions', () => {
    describe('stopGeneration', () => {
      it('should stop streaming response', () => {
        useChatStore.setState({ isStreamingResponse: true });

        useChatStore.getState().stopGeneration();

        expect(useChatStore.getState().isStreamingResponse).toBe(false);
      });
    });
  });
});
