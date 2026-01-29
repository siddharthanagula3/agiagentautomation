/**
 * Multi-Agent Chat Store Unit Tests
 * Tests for multi-participant conversation management, real-time features, and sync
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMultiAgentChatStore } from './multi-agent-chat-store';
import type {
  ChatMessage,
  ConversationParticipant,
  MessageReaction,
  AgentPresence,
} from './multi-agent-chat-store';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () =>
    `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

describe('Multi-Agent Chat Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useMultiAgentChatStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      useMultiAgentChatStore.getState().reset();
      const state = useMultiAgentChatStore.getState();

      expect(Object.keys(state.conversations)).toHaveLength(0);
      expect(state.activeConversationId).toBeNull();
      expect(Object.keys(state.typingIndicators)).toHaveLength(0);
      expect(Object.keys(state.agentPresence)).toHaveLength(0);
      expect(state.messageQueue).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Conversation Management', () => {
    const testParticipants = [
      { id: 'user-1', name: 'Test User', type: 'user' as const, status: 'online' as const },
      { id: 'agent-1', name: 'AI Assistant', type: 'agent' as const, status: 'online' as const },
    ];

    describe('createConversation', () => {
      it('should create a new conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test Conversation', testParticipants);

        const state = useMultiAgentChatStore.getState();
        expect(id).toBeDefined();
        expect(state.conversations[id]).toBeDefined();
        expect(state.conversations[id].title).toBe('Test Conversation');
        expect(state.activeConversationId).toBe(id);
      });

      it('should initialize participants with typing and lastSeen', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        const state = useMultiAgentChatStore.getState();
        const participants = state.conversations[id].participants;

        expect(participants).toHaveLength(2);
        participants.forEach((p) => {
          expect(p.isTyping).toBe(false);
          expect(p.lastSeen).toBeInstanceOf(Date);
        });
      });

      it('should initialize with default settings', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        const state = useMultiAgentChatStore.getState();
        const settings = state.conversations[id].settings;

        expect(settings.model).toBe('gpt-4');
        expect(settings.provider).toBe('openai');
        expect(settings.temperature).toBe(0.7);
        expect(settings.allowMultipleAgents).toBe(true);
      });

      it('should initialize with empty metadata', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        const state = useMultiAgentChatStore.getState();
        const metadata = state.conversations[id].metadata;

        expect(metadata.totalMessages).toBe(0);
        expect(metadata.totalTokens).toBe(0);
        expect(metadata.totalCost).toBe(0);
        expect(metadata.starred).toBe(false);
        expect(metadata.archived).toBe(false);
      });
    });

    describe('updateConversation', () => {
      it('should update conversation properties', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Original Title', testParticipants);

        useMultiAgentChatStore.getState().updateConversation(id, {
          title: 'Updated Title',
          description: 'A test conversation',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].title).toBe('Updated Title');
        expect(state.conversations[id].description).toBe('A test conversation');
      });

      it('should update the updatedAt timestamp', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        const originalUpdatedAt = useMultiAgentChatStore.getState().conversations[id].updatedAt;

        // Wait a bit to ensure different timestamp
        vi.useFakeTimers();
        vi.advanceTimersByTime(1000);

        useMultiAgentChatStore.getState().updateConversation(id, {
          title: 'Updated',
        });

        const newUpdatedAt = useMultiAgentChatStore.getState().conversations[id].updatedAt;
        expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

        vi.useRealTimers();
      });

      it('should handle non-existent conversation', () => {
        expect(() => {
          useMultiAgentChatStore.getState().updateConversation('non-existent', {
            title: 'Test',
          });
        }).not.toThrow();
      });
    });

    describe('deleteConversation', () => {
      it('should delete conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().deleteConversation(id);

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id]).toBeUndefined();
      });

      it('should clear active conversation if deleted', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        expect(useMultiAgentChatStore.getState().activeConversationId).toBe(id);

        useMultiAgentChatStore.getState().deleteConversation(id);

        expect(useMultiAgentChatStore.getState().activeConversationId).toBeNull();
      });
    });

    describe('archiveConversation', () => {
      it('should archive conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().archiveConversation(id);

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].metadata.archived).toBe(true);
      });

      it('should unarchive conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().archiveConversation(id);
        useMultiAgentChatStore.getState().unarchiveConversation(id);

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].metadata.archived).toBe(false);
      });
    });

    describe('setActiveConversation', () => {
      it('should set active conversation', () => {
        const id1 = useMultiAgentChatStore
          .getState()
          .createConversation('Chat 1', testParticipants);
        const id2 = useMultiAgentChatStore
          .getState()
          .createConversation('Chat 2', testParticipants);

        useMultiAgentChatStore.getState().setActiveConversation(id1);
        expect(useMultiAgentChatStore.getState().activeConversationId).toBe(id1);

        useMultiAgentChatStore.getState().setActiveConversation(id2);
        expect(useMultiAgentChatStore.getState().activeConversationId).toBe(id2);
      });

      it('should allow setting to null', () => {
        useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().setActiveConversation(null);

        expect(useMultiAgentChatStore.getState().activeConversationId).toBeNull();
      });
    });
  });

  describe('Participant Management', () => {
    const testParticipants = [
      { id: 'user-1', name: 'Test User', type: 'user' as const, status: 'online' as const },
    ];

    describe('addParticipant', () => {
      it('should add participant to conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().addParticipant(id, {
          id: 'agent-1',
          name: 'AI Agent',
          type: 'agent',
          status: 'online',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].participants).toHaveLength(2);
        expect(
          state.conversations[id].participants.find((p) => p.id === 'agent-1')
        ).toBeDefined();
      });

      it('should not add duplicate participant', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().addParticipant(id, {
          id: 'user-1', // Same ID as existing participant
          name: 'Duplicate User',
          type: 'user',
          status: 'online',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].participants).toHaveLength(1);
      });

      it('should initialize typing and lastSeen for new participant', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore.getState().addParticipant(id, {
          id: 'agent-1',
          name: 'AI Agent',
          type: 'agent',
          status: 'online',
        });

        const state = useMultiAgentChatStore.getState();
        const newParticipant = state.conversations[id].participants.find(
          (p) => p.id === 'agent-1'
        );
        expect(newParticipant?.isTyping).toBe(false);
        expect(newParticipant?.lastSeen).toBeInstanceOf(Date);
      });
    });

    describe('removeParticipant', () => {
      it('should remove participant from conversation', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', [
            ...testParticipants,
            { id: 'agent-1', name: 'AI Agent', type: 'agent' as const, status: 'online' as const },
          ]);

        useMultiAgentChatStore.getState().removeParticipant(id, 'agent-1');

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[id].participants).toHaveLength(1);
        expect(
          state.conversations[id].participants.find((p) => p.id === 'agent-1')
        ).toBeUndefined();
      });
    });

    describe('updateParticipantStatus', () => {
      it('should update participant status', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        useMultiAgentChatStore
          .getState()
          .updateParticipantStatus(id, 'user-1', 'busy');

        const state = useMultiAgentChatStore.getState();
        const participant = state.conversations[id].participants.find(
          (p) => p.id === 'user-1'
        );
        expect(participant?.status).toBe('busy');
      });

      it('should update lastSeen when status changes', () => {
        const id = useMultiAgentChatStore
          .getState()
          .createConversation('Test', testParticipants);

        vi.useFakeTimers();
        vi.advanceTimersByTime(1000);

        useMultiAgentChatStore
          .getState()
          .updateParticipantStatus(id, 'user-1', 'idle');

        const state = useMultiAgentChatStore.getState();
        const participant = state.conversations[id].participants.find(
          (p) => p.id === 'user-1'
        );
        expect(participant?.lastSeen).toBeInstanceOf(Date);

        vi.useRealTimers();
      });
    });
  });

  describe('Message Management', () => {
    const testParticipants = [
      { id: 'user-1', name: 'Test User', type: 'user' as const, status: 'online' as const },
      { id: 'agent-1', name: 'AI Agent', type: 'agent' as const, status: 'online' as const },
    ];

    let conversationId: string;

    beforeEach(() => {
      conversationId = useMultiAgentChatStore
        .getState()
        .createConversation('Test Chat', testParticipants);
    });

    describe('addMessage', () => {
      it('should add message to conversation', () => {
        const messageId = useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Hello!',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages).toHaveLength(1);
        expect(state.conversations[conversationId].messages[0].content).toBe('Hello!');
        expect(messageId).toBeDefined();
      });

      it('should auto-generate id and timestamp', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const state = useMultiAgentChatStore.getState();
        const message = state.conversations[conversationId].messages[0];
        expect(message.id).toBeDefined();
        expect(message.timestamp).toBeInstanceOf(Date);
      });

      it('should set initial delivery status to sent', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].deliveryStatus).toBe('sent');
      });

      it('should include sender in readBy', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].readBy).toContain('user-1');
      });

      it('should update conversation metadata', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
          metadata: {
            tokensUsed: 100,
            cost: 0.01,
          },
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].metadata.totalMessages).toBe(1);
        expect(state.conversations[conversationId].metadata.totalTokens).toBe(100);
        expect(state.conversations[conversationId].metadata.totalCost).toBe(0.01);
      });
    });

    describe('updateMessage', () => {
      it('should update message content', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'agent-1',
          senderName: 'AI Agent',
          senderType: 'agent',
          content: 'Original',
          isStreaming: true,
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().updateMessage(messageId, {
          content: 'Updated content',
          isStreaming: false,
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].content).toBe('Updated content');
        expect(state.conversations[conversationId].messages[0].isStreaming).toBe(false);
      });
    });

    describe('deleteMessage', () => {
      it('should delete message from conversation', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().deleteMessage(conversationId, messageId);

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages).toHaveLength(0);
      });

      it('should decrement total messages count', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        expect(useMultiAgentChatStore.getState().conversations[conversationId].metadata.totalMessages).toBe(1);

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;
        useMultiAgentChatStore.getState().deleteMessage(conversationId, messageId);

        expect(useMultiAgentChatStore.getState().conversations[conversationId].metadata.totalMessages).toBe(0);
      });
    });

    describe('markMessageAsRead', () => {
      it('should add user to readBy array', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().markMessageAsRead(conversationId, messageId, 'agent-1');

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].readBy).toContain('agent-1');
      });

      it('should update delivery status to read', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().markMessageAsRead(conversationId, messageId, 'agent-1');

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].deliveryStatus).toBe('read');
      });

      it('should not add duplicate user to readBy', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().markMessageAsRead(conversationId, messageId, 'user-1');
        useMultiAgentChatStore.getState().markMessageAsRead(conversationId, messageId, 'user-1');

        const state = useMultiAgentChatStore.getState();
        const readByCount = state.conversations[conversationId].messages[0].readBy.filter(
          (id) => id === 'user-1'
        ).length;
        expect(readByCount).toBe(1);
      });
    });

    describe('addMessageReaction', () => {
      it('should add reaction to message', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'agent-1',
          senderName: 'AI Agent',
          senderType: 'agent',
          content: 'Response',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        const reaction: MessageReaction = {
          type: 'helpful',
          userId: 'user-1',
          timestamp: new Date(),
        };

        useMultiAgentChatStore.getState().addMessageReaction(conversationId, messageId, reaction);

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].reactions).toHaveLength(1);
        expect(state.conversations[conversationId].messages[0].reactions?.[0].type).toBe('helpful');
      });

      it('should replace existing reaction of same type by same user', () => {
        useMultiAgentChatStore.getState().addMessage({
          conversationId,
          senderId: 'agent-1',
          senderName: 'AI Agent',
          senderType: 'agent',
          content: 'Response',
        });

        const messageId = useMultiAgentChatStore.getState().conversations[conversationId].messages[0].id;

        useMultiAgentChatStore.getState().addMessageReaction(conversationId, messageId, {
          type: 'helpful',
          userId: 'user-1',
          timestamp: new Date(),
        });

        useMultiAgentChatStore.getState().addMessageReaction(conversationId, messageId, {
          type: 'helpful',
          userId: 'user-1',
          timestamp: new Date(),
        });

        const state = useMultiAgentChatStore.getState();
        expect(state.conversations[conversationId].messages[0].reactions).toHaveLength(1);
      });
    });
  });

  describe('Typing Indicators', () => {
    let conversationId: string;

    beforeEach(() => {
      conversationId = useMultiAgentChatStore.getState().createConversation('Test', [
        { id: 'user-1', name: 'Test User', type: 'user' as const, status: 'online' as const },
      ]);
    });

    describe('setTypingIndicator', () => {
      it('should add typing indicator', () => {
        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-1', 'AI Agent', true);

        const state = useMultiAgentChatStore.getState();
        expect(state.typingIndicators[conversationId]).toHaveLength(1);
        expect(state.typingIndicators[conversationId][0].participantName).toBe('AI Agent');
      });

      it('should remove typing indicator', () => {
        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-1', 'AI Agent', true);

        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-1', 'AI Agent', false);

        const state = useMultiAgentChatStore.getState();
        expect(state.typingIndicators[conversationId]).toHaveLength(0);
      });

      it('should update participant isTyping status', () => {
        useMultiAgentChatStore.getState().addParticipant(conversationId, {
          id: 'agent-1',
          name: 'AI Agent',
          type: 'agent',
          status: 'online',
        });

        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-1', 'AI Agent', true);

        const state = useMultiAgentChatStore.getState();
        const participant = state.conversations[conversationId].participants.find(
          (p) => p.id === 'agent-1'
        );
        expect(participant?.isTyping).toBe(true);
      });
    });

    describe('clearTypingIndicators', () => {
      it('should clear all typing indicators for conversation', () => {
        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-1', 'AI Agent 1', true);
        useMultiAgentChatStore
          .getState()
          .setTypingIndicator(conversationId, 'agent-2', 'AI Agent 2', true);

        useMultiAgentChatStore.getState().clearTypingIndicators(conversationId);

        const state = useMultiAgentChatStore.getState();
        expect(state.typingIndicators[conversationId]).toBeUndefined();
      });
    });
  });

  describe('Agent Presence', () => {
    describe('updateAgentPresence', () => {
      it('should add or update agent presence', () => {
        const presence: AgentPresence = {
          agentId: 'agent-1',
          agentName: 'AI Agent',
          status: 'online',
          lastActivity: new Date(),
          capabilities: ['chat', 'code'],
        };

        useMultiAgentChatStore.getState().updateAgentPresence(presence);

        const state = useMultiAgentChatStore.getState();
        expect(state.agentPresence['agent-1']).toEqual(presence);
      });
    });

    describe('removeAgentPresence', () => {
      it('should remove agent presence', () => {
        useMultiAgentChatStore.getState().updateAgentPresence({
          agentId: 'agent-1',
          agentName: 'AI Agent',
          status: 'online',
          lastActivity: new Date(),
          capabilities: [],
        });

        useMultiAgentChatStore.getState().removeAgentPresence('agent-1');

        const state = useMultiAgentChatStore.getState();
        expect(state.agentPresence['agent-1']).toBeUndefined();
      });
    });
  });

  describe('Message Queue', () => {
    describe('queueMessage', () => {
      it('should add message to queue', () => {
        const message: ChatMessage = {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Queued message',
          timestamp: new Date(),
          deliveryStatus: 'sending',
          readBy: [],
        };

        useMultiAgentChatStore.getState().queueMessage(message);

        const state = useMultiAgentChatStore.getState();
        expect(state.messageQueue).toHaveLength(1);
        expect(state.messageQueue[0].content).toBe('Queued message');
      });

      it('should not add duplicate message to queue', () => {
        const message: ChatMessage = {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Queued message',
          timestamp: new Date(),
          deliveryStatus: 'sending',
          readBy: [],
        };

        useMultiAgentChatStore.getState().queueMessage(message);
        useMultiAgentChatStore.getState().queueMessage(message);

        const state = useMultiAgentChatStore.getState();
        expect(state.messageQueue).toHaveLength(1);
      });
    });

    describe('clearMessageQueue', () => {
      it('should clear message queue', () => {
        useMultiAgentChatStore.getState().queueMessage({
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'user',
          content: 'Test',
          timestamp: new Date(),
          deliveryStatus: 'sending',
          readBy: [],
        });

        useMultiAgentChatStore.getState().clearMessageQueue();

        expect(useMultiAgentChatStore.getState().messageQueue).toHaveLength(0);
      });
    });
  });

  describe('Search and Filters', () => {
    describe('setSearchQuery', () => {
      it('should update search query', () => {
        useMultiAgentChatStore.getState().setSearchQuery('test query');

        expect(useMultiAgentChatStore.getState().searchQuery).toBe('test query');
      });
    });

    describe('filter tags', () => {
      it('should add filter tag', () => {
        useMultiAgentChatStore.getState().addFilterTag('work');

        expect(useMultiAgentChatStore.getState().filterTags).toContain('work');
      });

      it('should not add duplicate filter tag', () => {
        useMultiAgentChatStore.getState().addFilterTag('work');
        useMultiAgentChatStore.getState().addFilterTag('work');

        expect(
          useMultiAgentChatStore.getState().filterTags.filter((t) => t === 'work')
        ).toHaveLength(1);
      });

      it('should remove filter tag', () => {
        useMultiAgentChatStore.getState().addFilterTag('work');
        useMultiAgentChatStore.getState().removeFilterTag('work');

        expect(useMultiAgentChatStore.getState().filterTags).not.toContain('work');
      });
    });

    describe('clearFilters', () => {
      it('should clear all filters', () => {
        useMultiAgentChatStore.getState().setSearchQuery('test');
        useMultiAgentChatStore.getState().addFilterTag('work');

        useMultiAgentChatStore.getState().clearFilters();

        const state = useMultiAgentChatStore.getState();
        expect(state.searchQuery).toBe('');
        expect(state.filterTags).toHaveLength(0);
      });
    });
  });

  describe('Synchronization', () => {
    describe('setSyncing', () => {
      it('should update syncing state', () => {
        useMultiAgentChatStore.getState().setSyncing(true);
        expect(useMultiAgentChatStore.getState().isSyncing).toBe(true);

        useMultiAgentChatStore.getState().setSyncing(false);
        expect(useMultiAgentChatStore.getState().isSyncing).toBe(false);
      });
    });

    describe('recordSyncTimestamp', () => {
      it('should record sync timestamp', () => {
        useMultiAgentChatStore.getState().recordSyncTimestamp();

        expect(useMultiAgentChatStore.getState().lastSyncTimestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Utility Actions', () => {
    describe('setError / clearError', () => {
      it('should set and clear error', () => {
        useMultiAgentChatStore.getState().setError('Test error');
        expect(useMultiAgentChatStore.getState().error).toBe('Test error');

        useMultiAgentChatStore.getState().clearError();
        expect(useMultiAgentChatStore.getState().error).toBeNull();
      });
    });

    describe('reset', () => {
      it('should reset to initial state', () => {
        // Set some state
        useMultiAgentChatStore.getState().createConversation('Test', [
          { id: 'user-1', name: 'User', type: 'user' as const, status: 'online' as const },
        ]);
        useMultiAgentChatStore.getState().setError('Error');
        useMultiAgentChatStore.getState().setSyncing(true);

        // Reset
        useMultiAgentChatStore.getState().reset();

        const state = useMultiAgentChatStore.getState();
        expect(Object.keys(state.conversations)).toHaveLength(0);
        expect(state.activeConversationId).toBeNull();
        expect(state.error).toBeNull();
        expect(state.isSyncing).toBe(false);
      });
    });
  });
});
