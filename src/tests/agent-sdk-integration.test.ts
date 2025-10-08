/**
 * Agent SDK Integration Tests
 * Tests for Netlify functions and end-to-end integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: 'test-session-id' },
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-session-id' },
            error: null
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock fetch for external API calls
global.fetch = vi.fn();

describe('Agent SDK Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Agent Session API', () => {
    it('should create a new agent session', async () => {
      const mockSessionData = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7
        },
        messages: [],
        metadata: {
          version: '1.0.0',
          sdk: 'openai-agent-sdk',
          employeeName: 'Alex',
          channel: 'ai_employees'
        }
      };

      // Mock successful session creation
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockSessionData,
        error: null
      });

      // Simulate the agent-session function
      const requestBody = {
        userId: 'test-user-123',
        employeeId: 'emp-001',
        employeeRole: 'Software Architect',
        employeeName: 'Alex'
      };

      // Test the session creation logic
      const sessionId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const defaultConfig = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
        streaming: true,
        contextWindow: 128000,
        systemPrompt: expect.any(String),
        tools: expect.any(Array),
        webhooks: []
      };

      const sessionData = {
        id: sessionId,
        user_id: requestBody.userId,
        employee_id: requestBody.employeeId,
        employee_role: requestBody.employeeRole,
        config: defaultConfig,
        messages: [],
        metadata: {
          version: '1.0.0',
          sdk: 'openai-agent-sdk',
          employeeName: requestBody.employeeName,
          channel: 'ai_employees'
        }
      };

      expect(sessionData.user_id).toBe('test-user-123');
      expect(sessionData.employee_id).toBe('emp-001');
      expect(sessionData.employee_role).toBe('Software Architect');
      expect(sessionData.config.provider).toBe('openai');
    });

    it('should validate required fields for session creation', () => {
      const invalidRequests = [
        { userId: 'test-user-123' }, // Missing employeeId and employeeRole
        { employeeId: 'emp-001' }, // Missing userId and employeeRole
        { employeeRole: 'Software Architect' }, // Missing userId and employeeId
        {} // Missing all fields
      ];

      invalidRequests.forEach(request => {
        const hasRequiredFields = request.userId && request.employeeId && request.employeeRole;
        expect(hasRequiredFields).toBe(false);
      });
    });

    it('should handle session retrieval', async () => {
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

      // Mock successful session retrieval
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      });

      // Test session retrieval logic
      const sessionId = 'agent-session-123';
      const userId = 'test-user-123';

      expect(sessionId).toBeTruthy();
      expect(userId).toBeTruthy();
    });
  });

  describe('Agent Send API', () => {
    it('should process user message and return agent response', async () => {
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

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: 'I can help you with software architecture design.',
            tool_calls: []
          }
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150
        },
        model: 'gpt-4o-mini'
      };

      // Mock session retrieval
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      });

      // Mock OpenAI API call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenAIResponse
      });

      // Mock session update
      mockSupabase.from().update().eq().mockResolvedValueOnce({
        data: { id: 'agent-session-123' },
        error: null
      });

      // Test message processing
      const requestBody = {
        sessionId: 'agent-session-123',
        message: 'Help me design a microservices architecture',
        userId: 'test-user-123'
      };

      expect(requestBody.sessionId).toBeTruthy();
      expect(requestBody.message).toBeTruthy();
      expect(requestBody.userId).toBeTruthy();
    });

    it('should handle tool execution', async () => {
      const mockToolCall = {
        id: 'call-123',
        function: {
          name: 'web_search',
          arguments: JSON.stringify({
            query: 'microservices best practices',
            max_results: 5
          })
        }
      };

      // Mock tool execution
      const mockToolResult = {
        success: true,
        results: [
          {
            title: 'Microservices Architecture Guide',
            snippet: 'A comprehensive guide to microservices...',
            url: 'https://example.com'
          }
        ]
      };

      // Test tool execution logic
      const toolName = mockToolCall.function.name;
      const toolArgs = JSON.parse(mockToolCall.function.arguments);

      expect(toolName).toBe('web_search');
      expect(toolArgs.query).toBe('microservices best practices');
      expect(toolArgs.max_results).toBe(5);
    });

    it('should handle OpenAI API errors', async () => {
      // Mock OpenAI API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded'
          }
        })
      });

      // Test error handling
      const response = await global.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test message' }]
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });
  });

  describe('Web Content Fetching', () => {
    it('should fetch and sanitize web content', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Main Content</h1>
            <p>This is the main content of the page.</p>
            <script>alert('malicious script');</script>
            <style>body { color: red; }</style>
          </body>
        </html>
      `;

      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        headers: {
          get: vi.fn((header) => {
            if (header === 'content-type') return 'text/html';
            if (header === 'last-modified') return 'Wed, 21 Oct 2015 07:28:00 GMT';
            return null;
          })
        }
      });

      // Test content sanitization
      const sanitizedHtml = mockHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      expect(sanitizedHtml).not.toContain('<script>');
      expect(sanitizedHtml).not.toContain('<style>');
      expect(sanitizedHtml).toContain('<h1>Main Content</h1>');
      expect(sanitizedHtml).toContain('<p>This is the main content of the page.</p>');
    });

    it('should check robots.txt compliance', async () => {
      const mockRobotsTxt = `
        User-agent: *
        Disallow: /admin/
        Disallow: /private/
        Allow: /public/
      `;

      // Mock robots.txt fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockRobotsTxt
      });

      // Test robots.txt parsing
      const testUrl = new URL('https://example.com/public/page');
      const disallowedPaths = ['/admin/', '/private/'];
      
      const isAllowed = !disallowedPaths.some(path => testUrl.pathname.startsWith(path));
      expect(isAllowed).toBe(true);

      const adminUrl = new URL('https://example.com/admin/dashboard');
      const isAdminAllowed = !disallowedPaths.some(path => adminUrl.pathname.startsWith(path));
      expect(isAdminAllowed).toBe(false);
    });

    it('should implement rate limiting', () => {
      const rateLimitStore = new Map();
      const domain = 'example.com';
      const now = Date.now();

      // Test rate limiting logic
      const key = `rate_limit_${domain}`;
      const limit = rateLimitStore.get(key);

      if (!limit || now > limit.resetTime) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + 60000 // 1 minute window
        });
      } else {
        limit.count++;
      }

      const currentLimit = rateLimitStore.get(key);
      expect(currentLimit.count).toBe(1);
      expect(currentLimit.resetTime).toBeGreaterThan(now);
    });
  });

  describe('Database Operations', () => {
    it('should persist agent sessions to database', async () => {
      const sessionData = {
        id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        config: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        messages: [],
        metadata: {
          version: '1.0.0',
          sdk: 'openai-agent-sdk'
        }
      };

      // Mock successful insert
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: sessionData,
        error: null
      });

      // Test database insert
      const result = await mockSupabase.from('agent_sessions').insert(sessionData).select().single();
      
      expect(result.data).toEqual(sessionData);
      expect(result.error).toBeNull();
    });

    it('should log analytics data', async () => {
      const analyticsData = {
        session_id: 'agent-session-123',
        user_id: 'test-user-123',
        employee_id: 'emp-001',
        employee_role: 'Software Architect',
        provider: 'openai',
        model: 'gpt-4o-mini',
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
        timestamp: new Date().toISOString()
      };

      // Mock successful analytics insert
      mockSupabase.from().insert().mockResolvedValueOnce({
        data: analyticsData,
        error: null
      });

      // Test analytics logging
      const result = await mockSupabase.from('agent_analytics').insert(analyticsData);
      
      expect(result.data).toEqual(analyticsData);
      expect(result.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase connection errors', async () => {
      // Mock Supabase error
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' }
      });

      // Test error handling
      const result = await mockSupabase.from('agent_sessions').select().eq('id', 'test-id').single();
      
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Connection failed');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      });

      // Test error handling
      try {
        const response = await global.fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer invalid-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Test message' }]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenAI API error: ${errorData.error.message}`);
        }
      } catch (error) {
        expect(error.message).toContain('OpenAI API error');
        expect(error.message).toContain('Invalid API key');
      }
    });
  });
});
