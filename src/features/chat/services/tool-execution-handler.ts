// Tools execution service - handles actual tool execution
import type { Tool, ToolCall } from '../types';
import {
  webSearch,
  type SearchResponse,
} from '@core/integrations/web-search-handler';

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
   */
  private async executeCodeRunner(
    args: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Integrate with actual code execution service
    return {
      success: false,
      error: 'Code execution is not yet implemented. This feature is coming soon.',
      language: args.language || 'unknown'
    };
  }

  /**
   * Execute image generator tool
   */
  private async executeImageGenerator(
    args: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Integrate with DALL-E or Imagen service
    return {
      success: false,
      error: 'Image generation from chat is not yet implemented. Use the dedicated image generation feature.',
      prompt: args.prompt
    };
  }

  /**
   * Execute file reader tool
   */
  private async executeFileReader(
    args: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Integrate with Vibe file system
    return {
      success: false,
      error: 'File reading is not yet implemented in chat. Use the Vibe workspace for file operations.',
      path: args.path
    };
  }

  /**
   * Execute file writer tool
   */
  private async executeFileWriter(
    args: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Integrate with Vibe file system
    return {
      success: false,
      error: 'File writing is not yet implemented in chat. Use the Vibe workspace for file operations.',
      path: args.path
    };
  }

  /**
   * Get available tools
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
      },
      {
        id: 'code_runner',
        name: 'Code Runner',
        description: 'Execute code in various programming languages',
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
      },
      {
        id: 'image_gen',
        name: 'Image Generator',
        description: 'Generate images from text descriptions',
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
      },
      {
        id: 'file_reader',
        name: 'File Reader',
        description: 'Read contents from a file',
        parameters: {
          path: {
            type: 'string',
            description: 'Path to the file',
            required: true,
          },
        },
        category: 'file',
      },
      {
        id: 'file_writer',
        name: 'File Writer',
        description: 'Write content to a file',
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
      },
    ];
  }
}

export const toolsExecutionService = new ToolsExecutionService();
