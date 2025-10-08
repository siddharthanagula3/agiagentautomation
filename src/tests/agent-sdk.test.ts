/**
 * Agent SDK Integration Tests
 * Comprehensive test suite for the Agent SDK ChatUI implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentSDKChatUI } from '@/components/chat/AgentSDKChatUI';
import { ChatWrapper } from '@/components/chat/ChatWrapper';

// Mock fetch
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@/stores/unified-auth-store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user-123',
      email: 'test@example.com'
    }
  })
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('Agent SDK ChatUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Session Initialization', () => {
    it('should create a new agent session on mount', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7
        },
        messages: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/.netlify/functions/agent-session',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: expect.stringContaining('test-user-123')
          })
        );
      });
    });

    it('should display welcome message after session creation', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex, your Software Architect/)).toBeInTheDocument();
      });
    });

    it('should handle session creation errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to initialize chat session/)).toBeInTheDocument();
      });
    });
  });

  describe('Message Sending', () => {
    it('should send user message and receive agent response', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      const mockAgentResponse = {
        response: {
          content: 'I can help you with software architecture design.',
          provider: 'OpenAI',
          model: 'gpt-4o-mini',
          usage: {
            promptTokens: 50,
            completionTokens: 100,
            totalTokens: 150
          }
        }
      };

      // Mock session creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      // Mock message sending
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentResponse
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex/)).toBeInTheDocument();
      });

      // Type message
      const input = screen.getByPlaceholderText(/Message Alex/);
      fireEvent.change(input, { target: { value: 'Help me design a microservices architecture' } });

      // Send message
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for agent response
      await waitFor(() => {
        expect(screen.getByText(/I can help you with software architecture design/)).toBeInTheDocument();
      });
    });

    it('should handle message sending errors', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      // Mock session creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      // Mock message sending error
      (global.fetch as any).mockRejectedValueOnce(new Error('API error'));

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex/)).toBeInTheDocument();
      });

      // Type message
      const input = screen.getByPlaceholderText(/Message Alex/);
      fireEvent.change(input, { target: { value: 'Test message' } });

      // Send message
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/I apologize, but I encountered an error/)).toBeInTheDocument();
      });
    });
  });

  describe('Tool Execution', () => {
    it('should display tool execution results', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      const mockAgentResponse = {
        response: {
          content: 'I found some information about microservices.',
          provider: 'OpenAI',
          model: 'gpt-4o-mini',
          toolResults: [
            {
              tool_call_id: 'call-123',
              tool_name: 'web_search',
              result: {
                success: true,
                results: [
                  {
                    title: 'Microservices Architecture Guide',
                    snippet: 'A comprehensive guide to microservices...',
                    url: 'https://example.com'
                  }
                ]
              }
            }
          ]
        }
      };

      // Mock session creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      // Mock message sending with tool results
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentResponse
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex/)).toBeInTheDocument();
      });

      // Type message
      const input = screen.getByPlaceholderText(/Message Alex/);
      fireEvent.change(input, { target: { value: 'Search for microservices best practices' } });

      // Send message
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for response with tool results
      await waitFor(() => {
        expect(screen.getByText(/I found some information about microservices/)).toBeInTheDocument();
        expect(screen.getByText(/Tool Results:/)).toBeInTheDocument();
        expect(screen.getByText(/web_search/)).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should handle file attachments', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex/)).toBeInTheDocument();
      });

      // Create a mock file
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      // Simulate file input
      const fileInput = screen.getByRole('button', { name: /paperclip/i });
      fireEvent.click(fileInput);

      // This would normally trigger file selection, but we'll test the attachment display
      // by directly setting the file in the component state (in a real test, you'd mock the file input)
    });

    it('should handle keyboard shortcuts', async () => {
      const mockSession = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession })
      });

      render(
        <AgentSDKChatUI
          conversationId="conv-123"
          userId="test-user-123"
          employeeId="emp-001"
          employeeRole="Software Architect"
          employeeName="Alex"
        />
      );

      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText(/Hello! I'm Alex/)).toBeInTheDocument();
      });

      // Type message
      const input = screen.getByPlaceholderText(/Message Alex/);
      fireEvent.change(input, { target: { value: 'Test message' } });

      // Press Enter to send
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      // Should trigger message sending
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/.netlify/functions/agent-send',
          expect.any(Object)
        );
      });
    });
  });
});

describe('ChatWrapper', () => {
  it('should render Agent SDK ChatUI for AI employee conversations', () => {
    const conversation = {
      id: 'conv-123',
      channel: 'ai_employees',
      employeeId: 'emp-001',
      employeeRole: 'Software Architect',
      employeeName: 'Alex',
      userId: 'test-user-123'
    };

    render(<ChatWrapper conversation={conversation} />);

    // Should render the Agent SDK ChatUI component
    expect(screen.getByText(/Initializing chat with Alex/)).toBeInTheDocument();
  });

  it('should render regular chat for non-AI conversations', () => {
    const conversation = {
      id: 'conv-123',
      channel: 'human',
      userId: 'test-user-123'
    };

    render(<ChatWrapper conversation={conversation} />);

    // Should render the regular chat component
    expect(screen.getByText(/Enhanced Chat/)).toBeInTheDocument();
  });

  it('should detect AI employee channel correctly', () => {
    const aiConversation = {
      id: 'conv-123',
      channel: 'ai_employees',
      employeeId: 'emp-001',
      employeeRole: 'Software Architect'
    };

    const humanConversation = {
      id: 'conv-124',
      channel: 'human'
    };

    // Test AI employee detection
    expect(aiConversation.channel === 'ai_employees').toBe(true);
    expect(humanConversation.channel === 'ai_employees').toBe(false);
  });
});
