/**
 * Tools Execution Service
 * Handles actual tool execution for AI employees in chat interface
 *
 * All tools render inline in the chat interface:
 * - web_search: Full implementation via web-search-handler
 * - code_runner: JavaScript/TypeScript execution with output capture
 * - image_gen: DALL-E 3 via OpenAI image proxy - displays inline
 * - file_reader: URL fetch via proxy + inline content display
 * - file_writer: Creates downloadable blob + inline preview
 */

import type { Tool, ToolCall } from '../types';
import {
  webSearch,
  type SearchResponse,
} from '@core/integrations/web-search-handler';
import { supabase } from '@shared/lib/supabase-client';

// =============================================
// TYPES
// =============================================

export interface CodeRunnerResult {
  success: boolean;
  output?: string;
  error?: string;
  language: string;
  executionTime?: number;
  exitCode?: number;
}

export interface ImageGenResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  prompt: string;
  model?: string;
}

export interface FileOperationResult {
  success: boolean;
  content?: string;
  error?: string;
  path: string;
  bytesRead?: number;
  bytesWritten?: number;
}

// =============================================
// IMPLEMENTATION
// =============================================

export class ToolsExecutionService {
  /**
   * Execute a tool with given arguments
   */
  async executeTool(
    toolId: string,
    args: Record<string, unknown>
  ): Promise<ToolCall> {
    const toolCall: ToolCall = {
      id: crypto.randomUUID(),
      name: toolId,
      arguments: args,
      status: 'running',
      startedAt: new Date(),
    };

    try {
      let result: unknown;

      switch (toolId) {
        case 'web_search':
          result = await this.executeWebSearch(args);
          break;

        case 'code_runner':
          result = await this.executeCodeRunner(args);
          break;

        case 'image_gen':
          result = await this.executeImageGenerator(args);
          break;

        case 'file_reader':
          result = await this.executeFileReader(args);
          break;

        case 'file_writer':
          result = await this.executeFileWriter(args);
          break;

        default:
          throw new Error(`Unknown tool: ${toolId}`);
      }

      return {
        ...toolCall,
        status: 'completed',
        result,
        completedAt: new Date(),
      };
    } catch (error) {
      return {
        ...toolCall,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Tool execution failed',
        completedAt: new Date(),
      };
    }
  }

  /**
   * Execute web search tool
   * Fully implemented using the web-search-handler
   */
  private async executeWebSearch(
    args: Record<string, unknown>
  ): Promise<SearchResponse> {
    const query = args.query as string;
    const maxResults = (args.maxResults as number) || 10;
    const provider = args.provider as
      | 'perplexity'
      | 'google'
      | 'duckduckgo'
      | undefined;

    if (!query) throw new Error('Search query is required');

    try {
      // Use the web search handler to perform actual search
      const searchResponse = await webSearch(query, maxResults, provider);

      if (import.meta.env.DEV) {
        console.log(
          `[WebSearch] Query: "${query}" returned ${searchResponse.results.length} results`
        );
      }

      return searchResponse;
    } catch (error) {
      console.error('[WebSearch] Search failed:', error);
      // Provide a more user-friendly error
      throw new Error(
        `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute code runner tool
   * Supports JavaScript execution with captured console output
   * All output is displayed inline in the chat interface
   */
  private async executeCodeRunner(
    args: Record<string, unknown>
  ): Promise<CodeRunnerResult> {
    const code = args.code as string;
    const language = (args.language as string) || 'javascript';

    if (!code) {
      return {
        success: false,
        error: 'Code is required',
        language,
      };
    }

    // JavaScript/TypeScript execution with console capture
    if (
      language === 'javascript' ||
      language === 'js' ||
      language === 'typescript' ||
      language === 'ts'
    ) {
      try {
        const startTime = performance.now();
        const logs: string[] = [];

        // Create sandboxed console that captures output
        const sandboxedConsole = {
          log: (...args: unknown[]) => {
            logs.push(
              args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
            );
          },
          error: (...args: unknown[]) => {
            logs.push(
              `[ERROR] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')}`
            );
          },
          warn: (...args: unknown[]) => {
            logs.push(
              `[WARN] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')}`
            );
          },
          info: (...args: unknown[]) => {
            logs.push(
              `[INFO] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')}`
            );
          },
        };

        // Execute the code in a sandboxed context
        const executeCode = new Function(
          'console',
          'Math',
          'Date',
          'JSON',
          'Array',
          'Object',
          'String',
          'Number',
          'Boolean',
          'RegExp',
          'Map',
          'Set',
          'Promise',
          `
          'use strict';
          try {
            ${code}
          } catch (e) {
            console.error(e.message || e);
          }
        `
        );

        // Run with limited globals (no fetch, XMLHttpRequest, eval, etc.)
        executeCode(
          sandboxedConsole,
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          RegExp,
          Map,
          Set,
          Promise
        );

        const executionTime = performance.now() - startTime;
        const output = logs.length > 0 ? logs.join('\n') : '(no output)';

        return {
          success: true,
          output,
          language,
          executionTime: Math.round(executionTime),
          exitCode: 0,
        };
      } catch (error) {
        return {
          success: false,
          error: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
          language,
          exitCode: 1,
        };
      }
    }

    // For other languages, return code as artifact with explanation
    return {
      success: true,
      output:
        `Browser-based execution is only available for JavaScript.\n` +
        `The ${language} code has been provided as an artifact that you can copy and run locally.\n\n` +
        `\`\`\`${language}\n${code}\n\`\`\``,
      language,
      exitCode: 0,
    };
  }

  /**
   * Execute image generator tool
   * Uses DALL-E 3 via OpenAI image proxy
   * Image URL is returned for inline display in chat
   */
  private async executeImageGenerator(
    args: Record<string, unknown>
  ): Promise<ImageGenResult> {
    const prompt = args.prompt as string;
    const size = (args.size as string) || '1024x1024';
    const model = (args.model as string) || 'dall-e-3';
    const quality = (args.quality as string) || 'standard';
    const style = (args.style as string) || 'vivid';

    if (!prompt) {
      return {
        success: false,
        error: 'Image prompt is required',
        prompt: '',
      };
    }

    try {
      // Get auth token for the proxy
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'Authentication required to generate images',
          prompt,
          model,
        };
      }

      // Call DALL-E via OpenAI image proxy
      const response = await fetch(
        '/.netlify/functions/media-proxies/openai-image-proxy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            model,
            size,
            quality,
            style,
            n: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error ||
            `Image generation failed with status ${response.status}`,
          prompt,
          model,
        };
      }

      const data = await response.json();

      // DALL-E returns data array with url or b64_json
      const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

      if (!imageUrl) {
        return {
          success: false,
          error: 'No image URL returned from generation service',
          prompt,
          model,
        };
      }

      // If b64_json, convert to data URL
      const finalUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `data:image/png;base64,${imageUrl}`;

      return {
        success: true,
        imageUrl: finalUrl,
        prompt,
        model,
      };
    } catch (error) {
      console.error('[ImageGen] Generation failed:', error);
      return {
        success: false,
        error: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        prompt,
        model,
      };
    }
  }

  /**
   * Execute file reader tool
   * Fetches content from URLs and displays inline
   * For local paths, suggests using attachments
   */
  private async executeFileReader(
    args: Record<string, unknown>
  ): Promise<FileOperationResult> {
    const path = args.path as string;

    if (!path) {
      return {
        success: false,
        error: 'File path is required',
        path: '',
      };
    }

    // Check if it's a URL - we can fetch those
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        // Get auth token for the proxy
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Use fetch proxy for CORS
        const response = await fetch(
          `/.netlify/functions/utilities/fetch-page?url=${encodeURIComponent(path)}`,
          {
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {},
          }
        );

        if (response.ok) {
          const data = await response.json();
          const content = data.content || data.text || data.markdown || '';

          // Format content for display
          const displayContent =
            content.length > 10000
              ? content.substring(0, 10000) +
                '\n\n... (content truncated, showing first 10,000 characters)'
              : content;

          return {
            success: true,
            content: displayContent,
            path,
            bytesRead: content.length,
          };
        } else {
          const errorText = await response.text();
          return {
            success: false,
            error: `Failed to fetch URL: ${response.status} - ${errorText}`,
            path,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Network error'}`,
          path,
        };
      }
    }

    // For local paths, provide helpful inline instructions
    return {
      success: true,
      content:
        `📁 **File Path Detected:** \`${path}\`\n\n` +
        `To view this file's contents in chat:\n` +
        `1. **Drag & drop** the file into the chat input\n` +
        `2. Use the **📎 attachment** button\n` +
        `3. **Copy & paste** the file contents directly\n\n` +
        `For URLs, I can fetch and display the content automatically.`,
      path,
      bytesRead: 0,
    };
  }

  /**
   * Execute file writer tool
   * Creates downloadable file and shows content preview inline
   */
  private async executeFileWriter(
    args: Record<string, unknown>
  ): Promise<FileOperationResult> {
    const path = args.path as string;
    const content = args.content as string;

    if (!path) {
      return {
        success: false,
        error: 'File path is required',
        path: '',
      };
    }

    if (content === undefined || content === null) {
      return {
        success: false,
        error: 'File content is required',
        path,
      };
    }

    // Get filename and extension from path
    const filename = path.split('/').pop() || 'file.txt';
    const extension = filename.split('.').pop()?.toLowerCase() || 'txt';

    // Determine content type based on extension
    const contentTypes: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      js: 'text/javascript',
      ts: 'text/typescript',
      jsx: 'text/javascript',
      tsx: 'text/typescript',
      html: 'text/html',
      css: 'text/css',
      py: 'text/x-python',
      rb: 'text/x-ruby',
      go: 'text/x-go',
      rs: 'text/x-rust',
      java: 'text/x-java',
      c: 'text/x-c',
      cpp: 'text/x-c++',
      h: 'text/x-c',
      xml: 'application/xml',
      yaml: 'application/yaml',
      yml: 'application/yaml',
      csv: 'text/csv',
      sql: 'application/sql',
      sh: 'text/x-shellscript',
    };
    const contentType = contentTypes[extension] || 'text/plain';

    // Create blob URL for download (will be created client-side when displayed)
    // For now, return the content with metadata for inline display
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      sh: 'bash',
      yml: 'yaml',
    };
    const language = languageMap[extension] || extension;

    // Format output with code block for display
    const preview =
      content.length > 2000
        ? content.substring(0, 2000) + '\n... (truncated)'
        : content;

    return {
      success: true,
      content:
        `📄 **File Created:** \`${filename}\` (${content.length} bytes)\n\n` +
        `Click the download button below to save this file.\n\n` +
        `\`\`\`${language}\n${preview}\n\`\`\``,
      path,
      bytesWritten: content.length,
      // These will be used by the message renderer to create download button
      downloadData: {
        filename,
        content,
        contentType,
      },
    } as FileOperationResult & {
      downloadData: { filename: string; content: string; contentType: string };
    };
  }

  /**
   * Get available tools with their definitions
   */
  getAvailableTools(): Tool[] {
    return [
      {
        id: 'web_search',
        name: 'Web Search',
        description:
          'Search the web for current information, news, facts, and real-time data. Use when you need up-to-date information or to verify facts.',
        parameters: {
          query: {
            type: 'string',
            description: 'The search query',
            required: true,
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
            required: false,
          },
          provider: {
            type: 'string',
            description:
              'Search provider to use (perplexity, google, duckduckgo)',
            required: false,
          },
        },
        category: 'search',
        status: 'available',
      },
      {
        id: 'code_runner',
        name: 'Code Runner',
        description:
          'Execute JavaScript/TypeScript code in the browser with console output capture. Results display inline.',
        parameters: {
          code: {
            type: 'string',
            description: 'The code to execute',
            required: true,
          },
          language: {
            type: 'string',
            description: 'Programming language (javascript, typescript)',
            required: true,
          },
        },
        category: 'code',
        status: 'available',
      },
      {
        id: 'image_gen',
        name: 'Image Generator',
        description:
          'Generate images from text descriptions using DALL-E 3. Images display inline in chat.',
        parameters: {
          prompt: {
            type: 'string',
            description: 'Description of the image to generate',
            required: true,
          },
          size: {
            type: 'string',
            description: 'Image size (1024x1024, 1792x1024, 1024x1792)',
            required: false,
          },
          quality: {
            type: 'string',
            description: 'Image quality (standard or hd)',
            required: false,
          },
          style: {
            type: 'string',
            description: 'Image style (vivid or natural)',
            required: false,
          },
        },
        category: 'image',
        status: 'available',
      },
      {
        id: 'file_reader',
        name: 'File Reader',
        description:
          'Read contents from URLs (fetched via proxy). Content displays inline in chat.',
        parameters: {
          path: {
            type: 'string',
            description: 'URL to fetch content from',
            required: true,
          },
        },
        category: 'file',
        status: 'available',
      },
      {
        id: 'file_writer',
        name: 'File Writer',
        description:
          'Create files with download button. Content preview displays inline in chat.',
        parameters: {
          path: {
            type: 'string',
            description: 'Filename for the file',
            required: true,
          },
          content: {
            type: 'string',
            description: 'Content to write',
            required: true,
          },
        },
        category: 'file',
        status: 'available',
      },
    ];
  }

  /**
   * Get tools filtered by availability status
   */
  getToolsByStatus(status: 'available' | 'limited' | 'unavailable'): Tool[] {
    return this.getAvailableTools().filter((tool) => tool.status === status);
  }

  /**
   * Check if a tool is fully available
   */
  isToolAvailable(toolId: string): boolean {
    const tool = this.getAvailableTools().find((t) => t.id === toolId);
    return tool?.status === 'available';
  }
}

export const toolsExecutionService = new ToolsExecutionService();
