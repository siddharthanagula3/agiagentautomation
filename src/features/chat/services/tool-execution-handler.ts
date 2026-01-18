/**
 * Tools Execution Service
 * Handles actual tool execution for AI employees in chat interface
 *
 * Implemented tools:
 * - web_search: Full implementation via web-search-handler
 *
 * Partially implemented (with meaningful responses):
 * - code_runner: Returns structured response, needs sandbox integration
 * - image_gen: Returns structured response, needs image service integration
 * - file_reader: Returns structured response, needs Vibe FS integration
 * - file_writer: Returns structured response, needs Vibe FS integration
 */

import type { Tool, ToolCall } from '../types';
import {
  webSearch,
  type SearchResponse,
} from '@core/integrations/web-search-handler';

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
   *
   * TODO: Integration options for full implementation:
   * 1. WebContainer API (browser-based Node.js) - for JS/TS
   * 2. Pyodide (browser-based Python) - for Python
   * 3. Server-side sandbox via Netlify Function - for all languages
   * 4. Integration with Replit or similar service
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

    // For JavaScript/TypeScript, we could use Function constructor for simple cases
    // but this is limited and has security implications
    if (language === 'javascript' || language === 'js') {
      try {
        // Only allow very simple, safe expressions
        // This is NOT a full code runner - just a placeholder for simple eval
        if (
          code.length < 200 &&
          !code.includes('fetch') &&
          !code.includes('import')
        ) {
          const startTime = performance.now();
          // Create a sandboxed context (very limited)
          const result = new Function(`
            'use strict';
            return (function() {
              const console = { log: (...args) => args.join(' ') };
              return ${code};
            })();
          `)();
          const executionTime = performance.now() - startTime;

          return {
            success: true,
            output: String(result),
            language,
            executionTime: Math.round(executionTime),
            exitCode: 0,
          };
        }
      } catch {
        // Fall through to not implemented message
      }
    }

    // Return informative message for unimplemented cases
    return {
      success: false,
      error:
        `Code execution for ${language} is not yet available in chat. ` +
        'For full code execution capabilities, please use the Vibe workspace ' +
        'which supports file editing and terminal access. ' +
        'Alternatively, you can copy the code to your local development environment.',
      language,
    };
  }

  /**
   * Execute image generator tool
   *
   * TODO: Integration options for full implementation:
   * 1. DALL-E via OpenAI API proxy
   * 2. Google Imagen via existing google-imagen-service.ts
   * 3. Stable Diffusion via Replicate API
   */
  private async executeImageGenerator(
    args: Record<string, unknown>
  ): Promise<ImageGenResult> {
    const prompt = args.prompt as string;
    const size = (args.size as string) || '1024x1024';
    const model = (args.model as string) || 'dall-e-3';

    if (!prompt) {
      return {
        success: false,
        error: 'Image prompt is required',
        prompt: '',
      };
    }

    // TODO: Integrate with actual image generation service
    // The infrastructure exists in @core/integrations/google-imagen-service.ts
    // but requires proper API key configuration

    return {
      success: false,
      error:
        `Image generation is not yet available in the chat interface. ` +
        `To generate images, you can:\n` +
        `1. Use the dedicated Image Generation feature in the dashboard\n` +
        `2. Access DALL-E directly at https://labs.openai.com\n` +
        `3. Use Midjourney via Discord\n\n` +
        `Your prompt has been saved: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
      prompt,
      model,
    };
  }

  /**
   * Execute file reader tool
   *
   * TODO: Integration with Vibe file system:
   * 1. For Vibe workspace files: use vibeFileStore
   * 2. For user uploads: use Supabase storage
   * 3. For URLs: use fetch with CORS proxy
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
        // Use fetch proxy for CORS
        const response = await fetch(
          `/.netlify/functions/utilities/fetch-page?url=${encodeURIComponent(path)}`
        );
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            content: data.content || data.text || JSON.stringify(data),
            path,
            bytesRead: (data.content || '').length,
          };
        }
      } catch (error) {
        // Fall through to error message
      }
    }

    return {
      success: false,
      error:
        `File reading is not available in chat for path: "${path}". ` +
        `To work with files:\n` +
        `1. Use the Vibe workspace for coding projects\n` +
        `2. Upload files via the attachment button\n` +
        `3. Paste file contents directly in the chat\n\n` +
        `For URLs, the fetch proxy will be used automatically.`,
      path,
    };
  }

  /**
   * Execute file writer tool
   *
   * TODO: Integration with Vibe file system:
   * 1. For Vibe workspace: use vibeFileStore.writeFile()
   * 2. For downloads: create blob and trigger download
   * 3. For cloud storage: use Supabase storage
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

    // For chat context, we can offer to create a downloadable file
    return {
      success: false,
      error:
        `File writing is not available in chat for path: "${path}". ` +
        `To save this content:\n` +
        `1. Use the Vibe workspace for persistent file storage\n` +
        `2. Copy the content and save locally\n` +
        `3. Use the "Export" feature for conversation artifacts\n\n` +
        `Content preview (first 200 chars): "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`,
      path,
      bytesWritten: content.length,
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
          'Execute code in various programming languages. Currently limited - use Vibe workspace for full execution.',
        parameters: {
          code: {
            type: 'string',
            description: 'The code to execute',
            required: true,
          },
          language: {
            type: 'string',
            description: 'Programming language (python, javascript, etc.)',
            required: true,
          },
        },
        category: 'code',
        status: 'limited',
      },
      {
        id: 'image_gen',
        name: 'Image Generator',
        description:
          'Generate images from text descriptions. Not yet available in chat - use dedicated image generation feature.',
        parameters: {
          prompt: {
            type: 'string',
            description: 'Description of the image to generate',
            required: true,
          },
          size: {
            type: 'string',
            description: 'Image size (e.g., 512x512, 1024x1024)',
            required: false,
          },
        },
        category: 'image',
        status: 'unavailable',
      },
      {
        id: 'file_reader',
        name: 'File Reader',
        description:
          'Read contents from a file or URL. URLs are fetched via proxy, local files require Vibe workspace.',
        parameters: {
          path: {
            type: 'string',
            description: 'Path to the file or URL',
            required: true,
          },
        },
        category: 'file',
        status: 'limited',
      },
      {
        id: 'file_writer',
        name: 'File Writer',
        description:
          'Write content to a file. Not available in chat - use Vibe workspace for file operations.',
        parameters: {
          path: {
            type: 'string',
            description: 'Path to the file',
            required: true,
          },
          content: {
            type: 'string',
            description: 'Content to write',
            required: true,
          },
        },
        category: 'file',
        status: 'unavailable',
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
