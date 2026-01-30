/**
 * Tool Execution Handler Unit Tests
 * Tests for the tools execution service that handles web search, code runner, and image generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolsExecutionService } from './tool-execution-handler';
import type { Tool, ToolCall } from '../types';

// Mock dependencies
vi.mock('@core/integrations/web-search-handler', () => ({
  webSearch: vi.fn(),
}));

vi.mock('@core/integrations/dalle-image-service', () => ({
  dallEImageService: {
    generateImage: vi.fn(),
  },
}));

vi.mock('./code-execution-service', () => ({
  codeExecutionService: {
    execute: vi.fn(),
  },
}));

vi.mock('@shared/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () =>
    `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

// Mock fetch for file reader
vi.stubGlobal('fetch', vi.fn());

describe('ToolsExecutionService', () => {
  let service: ToolsExecutionService;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new ToolsExecutionService();

    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeTool', () => {
    it('should return a ToolCall with correct structure', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: true,
        stdout: '4',
        stderr: '',
        exitCode: 0,
        language: 'javascript',
        executionTime: 10,
        timedOut: false,
      });

      const result = await service.executeTool('code_runner', {
        code: '2 + 2',
        language: 'javascript',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('code_runner');
      expect(result.arguments).toEqual({ code: '2 + 2', language: 'javascript' });
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('should handle unknown tool gracefully', async () => {
      const result = await service.executeTool('unknown_tool', {});

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Unknown tool: unknown_tool');
    });
  });

  describe('Web Search', () => {
    it('should execute web search successfully', async () => {
      const { webSearch } = await import('@core/integrations/web-search-handler');

      const mockSearchResponse = {
        query: 'test query',
        results: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            snippet: 'Test snippet',
          },
        ],
        totalResults: 1,
      };

      vi.mocked(webSearch).mockResolvedValue(mockSearchResponse);

      const result = await service.executeTool('web_search', {
        query: 'test query',
        maxResults: 5,
      });

      expect(result.status).toBe('completed');
      expect(result.result).toEqual(mockSearchResponse);
      expect(webSearch).toHaveBeenCalledWith('test query', 5, undefined);
    });

    it('should use default maxResults when not specified', async () => {
      const { webSearch } = await import('@core/integrations/web-search-handler');

      vi.mocked(webSearch).mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
      });

      await service.executeTool('web_search', { query: 'test' });

      expect(webSearch).toHaveBeenCalledWith('test', 10, undefined);
    });

    it('should handle missing query error', async () => {
      const result = await service.executeTool('web_search', {});

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Search query is required');
    });

    it('should handle web search API errors', async () => {
      const { webSearch } = await import('@core/integrations/web-search-handler');

      vi.mocked(webSearch).mockRejectedValue(new Error('API rate limit'));

      const result = await service.executeTool('web_search', {
        query: 'test query',
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Web search failed');
    });

    it('should support different search providers', async () => {
      const { webSearch } = await import('@core/integrations/web-search-handler');

      vi.mocked(webSearch).mockResolvedValue({
        query: 'test',
        results: [],
        totalResults: 0,
      });

      await service.executeTool('web_search', {
        query: 'test',
        provider: 'perplexity',
      });

      expect(webSearch).toHaveBeenCalledWith('test', 10, 'perplexity');
    });
  });

  describe('Code Runner', () => {
    it('should execute JavaScript code successfully', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: true,
        stdout: '4',
        stderr: '',
        exitCode: 0,
        language: 'javascript',
        executionTime: 10,
        timedOut: false,
      });

      const result = await service.executeTool('code_runner', {
        code: '2 + 2',
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toEqual({
        success: true,
        output: '4',
        language: 'javascript',
        executionTime: 10,
        exitCode: 0,
      });
    });

    it('should handle execution failure', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: false,
        stdout: '',
        stderr: 'ReferenceError: x is not defined',
        exitCode: 1,
        language: 'javascript',
        executionTime: 5,
        timedOut: false,
      });

      const result = await service.executeTool('code_runner', {
        code: 'console.log(x)',
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'ReferenceError: x is not defined',
      });
    });

    it('should handle execution timeout', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: 1,
        language: 'javascript',
        executionTime: 10000,
        timedOut: true,
      });

      const result = await service.executeTool('code_runner', {
        code: 'while(true) {}',
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('timed out'),
      });
    });

    it('should handle missing code', async () => {
      const result = await service.executeTool('code_runner', {
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'Code is required',
      });
    });

    it('should handle empty code', async () => {
      const result = await service.executeTool('code_runner', {
        code: '   ',
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'Code cannot be empty',
      });
    });

    it('should use default language javascript', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: true,
        stdout: 'Hello',
        stderr: '',
        exitCode: 0,
        language: 'javascript',
        executionTime: 5,
        timedOut: false,
      });

      await service.executeTool('code_runner', {
        code: 'console.log("Hello")',
      });

      expect(codeExecutionService.execute).toHaveBeenCalledWith(
        'console.log("Hello")',
        'javascript',
        expect.objectContaining({
          timeout: 10000,
          allowNetwork: false,
        })
      );
    });

    it('should support custom timeout', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockResolvedValue({
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        language: 'javascript',
        executionTime: 1,
        timedOut: false,
      });

      await service.executeTool('code_runner', {
        code: '1 + 1',
        language: 'javascript',
        timeout: 5000,
      });

      expect(codeExecutionService.execute).toHaveBeenCalledWith(
        '1 + 1',
        'javascript',
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should handle unexpected execution errors', async () => {
      const { codeExecutionService } = await import('./code-execution-service');

      vi.mocked(codeExecutionService.execute).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await service.executeTool('code_runner', {
        code: 'console.log("test")',
        language: 'javascript',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('Unexpected error'),
      });
    });
  });

  describe('Image Generator', () => {
    it('should generate image successfully', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([
        {
          url: 'https://example.com/image.png',
          revisedPrompt: 'A beautiful sunset over mountains',
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
        },
      ]);

      const result = await service.executeTool('image_gen', {
        prompt: 'A beautiful sunset',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: true,
        imageUrl: 'https://example.com/image.png',
        prompt: 'A beautiful sunset',
        revisedPrompt: 'A beautiful sunset over mountains',
      });
    });

    it('should handle missing prompt', async () => {
      const result = await service.executeTool('image_gen', {});

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'Image prompt is required',
      });
    });

    it('should handle empty prompt', async () => {
      const result = await service.executeTool('image_gen', {
        prompt: '   ',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'Image prompt is required',
      });
    });

    it('should validate size parameter', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([
        {
          url: 'https://example.com/image.png',
          model: 'dall-e-3',
          size: '1024x1024',
        },
      ]);

      await service.executeTool('image_gen', {
        prompt: 'Test prompt',
        size: 'invalid_size',
      });

      // Should use default size when invalid
      expect(dallEImageService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1024x1024', // Default
        })
      );
    });

    it('should support valid sizes', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([
        {
          url: 'https://example.com/image.png',
          size: '1792x1024',
        },
      ]);

      await service.executeTool('image_gen', {
        prompt: 'Landscape image',
        size: '1792x1024',
      });

      expect(dallEImageService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1792x1024',
        })
      );
    });

    it('should support quality parameter', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([
        {
          url: 'https://example.com/image.png',
          quality: 'hd',
        },
      ]);

      await service.executeTool('image_gen', {
        prompt: 'HD image',
        quality: 'hd',
      });

      expect(dallEImageService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 'hd',
        })
      );
    });

    it('should support style parameter', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([
        {
          url: 'https://example.com/image.png',
          style: 'natural',
        },
      ]);

      await service.executeTool('image_gen', {
        prompt: 'Natural style image',
        style: 'natural',
      });

      expect(dallEImageService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'natural',
        })
      );
    });

    it('should handle API rate limit error', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockRejectedValue(
        new Error('429 rate limit exceeded')
      );

      const result = await service.executeTool('image_gen', {
        prompt: 'Test prompt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('rate limit'),
      });
    });

    it('should handle content policy error', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockRejectedValue(
        new Error('Content policy violation')
      );

      const result = await service.executeTool('image_gen', {
        prompt: 'Inappropriate content',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringMatching(/content policy/i),
      });
    });

    it('should handle authentication error', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockRejectedValue(
        new Error('User not authenticated')
      );

      const result = await service.executeTool('image_gen', {
        prompt: 'Test prompt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('log in'),
      });
    });

    it('should handle empty image result', async () => {
      const { dallEImageService } = await import(
        '@core/integrations/dalle-image-service'
      );

      vi.mocked(dallEImageService.generateImage).mockResolvedValue([]);

      const result = await service.executeTool('image_gen', {
        prompt: 'Test prompt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('no image URL'),
      });
    });
  });

  describe('File Reader', () => {
    it('should handle local file paths', async () => {
      const result = await service.executeTool('file_reader', {
        path: '/local/file.txt',
      });

      expect(result.status).toBe('completed');
      // File reader now works with Vibe workspace
      expect(result.result).toMatchObject({
        path: '/local/file.txt',
      });
    });

    it('should handle missing path', async () => {
      const result = await service.executeTool('file_reader', {});

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'File path is required',
      });
    });

    it('should fetch URL content via proxy', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'File contents here' }),
      } as Response);

      const result = await service.executeTool('file_reader', {
        path: 'https://example.com/file.txt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: true,
        content: 'File contents here',
        path: 'https://example.com/file.txt',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fetch-page?url='),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should handle URL fetch failure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await service.executeTool('file_reader', {
        path: 'https://example.com/notfound.txt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to fetch URL'),
      });
    });
  });

  describe('File Writer', () => {
    it('should handle file write with valid path and content', async () => {
      const result = await service.executeTool('file_writer', {
        path: '/output/file.txt',
        content: 'Hello, World!',
      });

      expect(result.status).toBe('completed');
      // File writer now works with Vibe workspace - just verify the operation completes
      expect(result.result).toMatchObject({
        path: '/output/file.txt',
      });
    });

    it('should handle missing path', async () => {
      const result = await service.executeTool('file_writer', {
        content: 'Hello',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'File path is required',
      });
    });

    it('should handle missing content', async () => {
      const result = await service.executeTool('file_writer', {
        path: '/output/file.txt',
      });

      expect(result.status).toBe('completed');
      expect(result.result).toMatchObject({
        success: false,
        error: 'File content is required',
        path: '/output/file.txt',
      });
    });

    it('should handle file write with long content', async () => {
      const longContent = 'A'.repeat(300);
      const result = await service.executeTool('file_writer', {
        path: '/output/file.txt',
        content: longContent,
      });

      expect(result.status).toBe('completed');
      // Just verify it completes - success depends on workspace state
      expect(result.result).toBeDefined();
      expect(result.result.path).toBe('/output/file.txt');
    });
  });

  describe('getAvailableTools', () => {
    it('should return all available tools', () => {
      const tools = service.getAvailableTools();

      expect(tools.length).toBeGreaterThanOrEqual(5);
      // Check core tools are present
      const toolIds = tools.map((t) => t.id);
      expect(toolIds).toContain('web_search');
      expect(toolIds).toContain('code_runner');
      expect(toolIds).toContain('image_gen');
      expect(toolIds).toContain('file_reader');
      expect(toolIds).toContain('file_writer');
    });

    it('should have correct tool definitions', () => {
      const tools = service.getAvailableTools();

      const webSearch = tools.find((t) => t.id === 'web_search');
      expect(webSearch).toBeDefined();
      expect(webSearch?.category).toBe('search');
      expect(webSearch?.status).toBe('available');
      expect(webSearch?.parameters.query).toBeDefined();
      expect(webSearch?.parameters.query.required).toBe(true);

      const codeRunner = tools.find((t) => t.id === 'code_runner');
      expect(codeRunner).toBeDefined();
      expect(codeRunner?.category).toBe('code');
      expect(codeRunner?.status).toBe('available');

      const imageGen = tools.find((t) => t.id === 'image_gen');
      expect(imageGen).toBeDefined();
      expect(imageGen?.category).toBe('image');
      expect(imageGen?.status).toBe('available');

      const fileReader = tools.find((t) => t.id === 'file_reader');
      expect(fileReader).toBeDefined();
      expect(fileReader?.category).toBe('file');
      // File reader is now available (with Vibe workspace integration)
      expect(fileReader?.status).toBe('available');

      const fileWriter = tools.find((t) => t.id === 'file_writer');
      expect(fileWriter).toBeDefined();
      expect(fileWriter?.category).toBe('file');
      // File writer is now available (with Vibe workspace integration)
      expect(fileWriter?.status).toBe('available');
    });
  });

  describe('getToolsByStatus', () => {
    it('should filter tools by available status', () => {
      const availableTools = service.getToolsByStatus('available');

      // All tools are now available
      expect(availableTools.length).toBeGreaterThanOrEqual(5);
      expect(availableTools.every((t) => t.status === 'available')).toBe(true);
    });

    it('should return empty for limited status when all tools are available', () => {
      const limitedTools = service.getToolsByStatus('limited');

      // No tools are currently limited
      expect(limitedTools).toHaveLength(0);
    });

    it('should return empty for unavailable status when all tools are available', () => {
      const unavailableTools = service.getToolsByStatus('unavailable');

      // No tools are currently unavailable
      expect(unavailableTools).toHaveLength(0);
    });
  });

  describe('isToolAvailable', () => {
    it('should return true for available tools', () => {
      expect(service.isToolAvailable('web_search')).toBe(true);
      expect(service.isToolAvailable('code_runner')).toBe(true);
      expect(service.isToolAvailable('image_gen')).toBe(true);
    });

    it('should return true for file tools (now integrated with Vibe)', () => {
      // File tools are now available with Vibe workspace integration
      expect(service.isToolAvailable('file_reader')).toBe(true);
      expect(service.isToolAvailable('file_writer')).toBe(true);
    });

    it('should return false for unknown tools', () => {
      expect(service.isToolAvailable('unknown_tool')).toBe(false);
    });
  });
});
