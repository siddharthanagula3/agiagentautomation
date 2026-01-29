/**
 * Tools Execution Service
 * Handles actual tool execution for AI employees in chat interface
 *
 * Fully implemented tools:
 * - web_search: Full implementation via web-search-handler
 * - image_gen: Full implementation via DALL-E service (supports size, quality, style parameters)
 * - code_runner: Full implementation via CodeExecutionService
 *   - JavaScript: WebContainer API (full Node.js) or fallback simple eval
 *   - TypeScript: WebContainer API (requires cross-origin isolation)
 *   - Python: Pyodide (browser-based Python via WebAssembly)
 * - file_reader: Full implementation via Vibe file system
 * - file_writer: Full implementation via Vibe file system
 */

import type { Tool, ToolCall } from '../types';
import {
  webSearch,
  type SearchResponse,
} from '@core/integrations/web-search-handler';
import {
  dallEImageService,
  type DallEGenerationRequest,
} from '@core/integrations/dalle-image-service';
import { codeExecutionService } from './code-execution-service';
import {
  vibeFileSystem,
  FileSystemException,
} from '@features/vibe/services/vibe-file-system';

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
  revisedPrompt?: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
}

export interface FileOperationResult {
  success: boolean;
  content?: string;
  error?: string;
  path: string;
  bytesRead?: number;
  bytesWritten?: number;
  language?: string;
  isNewFile?: boolean;
}

// =============================================
// FILE SYSTEM SECURITY
// =============================================

/**
 * Sensitive path patterns that should not be accessible
 * These patterns are blocked for security reasons
 */
const BLOCKED_PATH_PATTERNS = [
  /^\/?\.env/i, // .env files at any level
  /\/\.env/i, // .env files in subdirectories
  /^\/?\.git\//i, // .git directory
  /\/\.git\//i, // .git in subdirectories
  /^\/?node_modules\//i, // node_modules at root
  /\/node_modules\//i, // node_modules in subdirectories
  /^\/?\.ssh\//i, // SSH keys
  /^\/?\.aws\//i, // AWS credentials
  /^\/?\.kube\//i, // Kubernetes configs
  /credentials/i, // Any file with "credentials" in path
  /secrets?\./i, // secret.* or secrets.* files
  /\.pem$/i, // PEM key files
  /\.key$/i, // Key files
  /password/i, // Files with "password" in name
];

/**
 * Check if a path is safe to access
 * Returns an error message if blocked, null if safe
 */
function validateFilePath(path: string): string | null {
  // Normalize path for consistent checking
  const normalizedPath = path.replace(/\\/g, '/').toLowerCase();

  // Check against blocked patterns
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return (
        `Access denied: "${path}" matches a restricted path pattern. ` +
        'Sensitive files like .env, credentials, and key files cannot be accessed for security reasons.'
      );
    }
  }

  // Check for path traversal attempts
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return (
      `Access denied: Path traversal detected in "${path}". ` +
      'Paths must not contain ".." sequences.'
    );
  }

  return null; // Path is safe
}

/**
 * Check if the Vibe workspace has been initialized
 * Returns true if there are files in the workspace
 */
function isVibeWorkspaceActive(): boolean {
  try {
    const stats = vibeFileSystem.getStats();
    // Consider workspace active if there's more than just the root folder
    return stats.totalFiles > 0 || stats.totalFolders > 1;
  } catch {
    return false;
  }
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
   * Full implementation using CodeExecutionService:
   * - JavaScript: WebContainer API (full Node.js) or fallback simple eval
   * - TypeScript: WebContainer API (requires cross-origin isolation)
   * - Python: Pyodide (browser-based Python via WebAssembly)
   *
   * Security features:
   * - 10 second execution timeout
   * - Memory limits (50MB for JS, 100MB for Python)
   * - No network access for untrusted code
   * - Queue-based execution to prevent abuse
   * - Input sanitization for dangerous patterns
   */
  private async executeCodeRunner(
    args: Record<string, unknown>
  ): Promise<CodeRunnerResult> {
    const code = args.code as string;
    const language = (args.language as string) || 'javascript';
    const timeout = args.timeout as number | undefined;

    if (!code) {
      return {
        success: false,
        error: 'Code is required',
        language,
      };
    }

    if (!code.trim()) {
      return {
        success: false,
        error: 'Code cannot be empty',
        language,
      };
    }

    try {
      if (import.meta.env.DEV) {
        console.log(
          `[CodeRunner] Executing ${language} code (${code.length} chars)`
        );
      }

      // Execute code using the CodeExecutionService
      const result = await codeExecutionService.execute(code, language, {
        timeout: timeout || 10_000, // Default 10 second timeout
        allowNetwork: false, // Never allow network access for security
      });

      if (import.meta.env.DEV) {
        console.log(
          `[CodeRunner] Execution ${result.success ? 'succeeded' : 'failed'} in ${result.executionTime}ms`
        );
      }

      // Map ExecutionResult to CodeRunnerResult
      if (result.success) {
        return {
          success: true,
          output: result.stdout || '(no output)',
          language: result.language,
          executionTime: Math.round(result.executionTime),
          exitCode: result.exitCode,
        };
      }

      // Handle execution failure
      let errorMessage = result.stderr || result.error || 'Execution failed';

      // Provide more context for specific error types
      if (result.timedOut) {
        errorMessage =
          `Execution timed out after ${Math.round(result.executionTime / 1000)} seconds. ` +
          'Consider breaking your code into smaller chunks or optimizing for performance.';
      }

      return {
        success: false,
        error: errorMessage,
        output: result.stdout || undefined,
        language: result.language,
        executionTime: Math.round(result.executionTime),
        exitCode: result.exitCode,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error('[CodeRunner] Execution error:', errorMessage);

      return {
        success: false,
        error: `Code execution failed: ${errorMessage}`,
        language,
      };
    }
  }

  /**
   * Execute image generator tool using DALL-E API
   * Fully implemented using the DALL-E image service through secure proxy
   */
  private async executeImageGenerator(
    args: Record<string, unknown>
  ): Promise<ImageGenResult> {
    const prompt = args.prompt as string;
    const sizeArg = args.size as string | undefined;
    const qualityArg = args.quality as string | undefined;
    const styleArg = args.style as string | undefined;
    const modelArg = args.model as string | undefined;

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Image prompt is required',
        prompt: '',
      };
    }

    // Validate and normalize size parameter
    const validSizes = ['1024x1024', '1024x1792', '1792x1024'] as const;
    const size: DallEGenerationRequest['size'] = validSizes.includes(
      sizeArg as (typeof validSizes)[number]
    )
      ? (sizeArg as DallEGenerationRequest['size'])
      : '1024x1024';

    // Validate and normalize quality parameter
    const validQualities = ['standard', 'hd'] as const;
    const quality: DallEGenerationRequest['quality'] = validQualities.includes(
      qualityArg as (typeof validQualities)[number]
    )
      ? (qualityArg as DallEGenerationRequest['quality'])
      : 'standard';

    // Validate and normalize style parameter
    const validStyles = ['vivid', 'natural'] as const;
    const style: DallEGenerationRequest['style'] = validStyles.includes(
      styleArg as (typeof validStyles)[number]
    )
      ? (styleArg as DallEGenerationRequest['style'])
      : 'vivid';

    // Validate and normalize model parameter
    const validModels = ['dall-e-3', 'dall-e-2'] as const;
    const model: DallEGenerationRequest['model'] = validModels.includes(
      modelArg as (typeof validModels)[number]
    )
      ? (modelArg as DallEGenerationRequest['model'])
      : 'dall-e-3';

    try {
      if (import.meta.env.DEV) {
        console.log(
          `[ImageGen] Generating image with prompt: "${prompt.substring(0, 50)}..." size=${size} quality=${quality} model=${model}`
        );
      }

      const results = await dallEImageService.generateImage({
        prompt: prompt.trim(),
        size,
        quality,
        style,
        model,
        n: 1, // Generate single image per request
      });

      // Take the first result (DALL-E 3 only supports n=1 anyway)
      const result = results[0];

      if (!result || !result.url) {
        return {
          success: false,
          error: 'Image generation completed but no image URL was returned',
          prompt,
          model,
        };
      }

      if (import.meta.env.DEV) {
        console.log(
          `[ImageGen] Successfully generated image: ${result.url.substring(0, 50)}...`
        );
      }

      return {
        success: true,
        imageUrl: result.url,
        prompt,
        revisedPrompt: result.revisedPrompt,
        model: result.model,
        size: result.size,
        quality: result.quality,
        style: result.style,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error('[ImageGen] Generation failed:', errorMessage);

      // Provide user-friendly error messages for common issues
      let userMessage = errorMessage;
      if (errorMessage.includes('not authenticated')) {
        userMessage =
          'Please log in to generate images. Authentication is required for image generation.';
      } else if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429')
      ) {
        userMessage =
          'Image generation rate limit reached. Please wait a moment and try again.';
      } else if (
        errorMessage.includes('content policy') ||
        errorMessage.includes('safety')
      ) {
        userMessage =
          'The image prompt was rejected due to content policy. Please modify your prompt and try again.';
      } else if (
        errorMessage.includes('billing') ||
        errorMessage.includes('quota')
      ) {
        userMessage =
          'Image generation quota exceeded. Please check your account or upgrade your plan.';
      }

      return {
        success: false,
        error: userMessage,
        prompt,
        model,
      };
    }
  }

  /**
   * Execute file reader tool
   *
   * Reads files from the Vibe workspace file system.
   * Also supports fetching URLs via CORS proxy.
   *
   * Security features:
   * - Blocks access to sensitive paths (.env, credentials, etc.)
   * - Validates path format to prevent traversal attacks
   * - Only reads from in-memory Vibe workspace (no real file system access)
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

    // Check if it's a URL - fetch via CORS proxy
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const response = await fetch(
          `/.netlify/functions/utilities/fetch-page?url=${encodeURIComponent(path)}`
        );
        if (response.ok) {
          const data = await response.json();
          const content = data.content || data.text || JSON.stringify(data);
          return {
            success: true,
            content,
            path,
            bytesRead: content.length,
          };
        }
        return {
          success: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          path,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path,
        };
      }
    }

    // Security check: validate path before accessing
    const pathError = validateFilePath(path);
    if (pathError) {
      return {
        success: false,
        error: pathError,
        path,
      };
    }

    // Check if Vibe workspace is active
    if (!isVibeWorkspaceActive()) {
      return {
        success: false,
        error:
          `No Vibe workspace is currently active. ` +
          `To read files:\n` +
          `1. Navigate to /vibe to open the coding workspace\n` +
          `2. Create or upload files to the workspace\n` +
          `3. Then use file_reader to access them\n\n` +
          `For URLs, prefix with http:// or https://`,
        path,
      };
    }

    // Read from Vibe file system
    try {
      if (import.meta.env.DEV) {
        console.log(`[FileReader] Reading file from Vibe workspace: ${path}`);
      }

      const content = vibeFileSystem.readFile(path);

      if (import.meta.env.DEV) {
        console.log(
          `[FileReader] Successfully read ${content.length} bytes from ${path}`
        );
      }

      return {
        success: true,
        content,
        path,
        bytesRead: content.length,
      };
    } catch (error) {
      if (error instanceof FileSystemException) {
        // Provide helpful error messages based on error code
        switch (error.code) {
          case 'FILE_NOT_FOUND':
            return {
              success: false,
              error:
                `File not found: "${path}"\n` +
                `Available files in workspace:\n` +
                this.getWorkspaceFileList(),
              path,
            };
          case 'INVALID_OPERATION':
            return {
              success: false,
              error: `Cannot read "${path}": This is a folder, not a file.`,
              path,
            };
          case 'INVALID_PATH':
            return {
              success: false,
              error: `Invalid path format: "${path}"`,
              path,
            };
          default:
            return {
              success: false,
              error: error.message,
              path,
            };
        }
      }

      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path,
      };
    }
  }

  /**
   * Get a formatted list of files in the Vibe workspace
   * Used for helpful error messages
   */
  private getWorkspaceFileList(): string {
    try {
      const fileTree = vibeFileSystem.getFileTree();
      const files: string[] = [];

      const collectFiles = (
        nodes: typeof fileTree,
        prefix: string = ''
      ): void => {
        for (const node of nodes) {
          if (node.type === 'file') {
            files.push(`${prefix}${node.path}`);
          } else if (node.children) {
            collectFiles(node.children, prefix);
          }
        }
      };

      collectFiles(fileTree);

      if (files.length === 0) {
        return '(workspace is empty)';
      }

      // Limit to first 20 files for readability
      const displayFiles = files.slice(0, 20);
      const remaining = files.length - displayFiles.length;

      let result = displayFiles.map((f) => `  - ${f}`).join('\n');
      if (remaining > 0) {
        result += `\n  ... and ${remaining} more files`;
      }

      return result;
    } catch {
      return '(unable to list files)';
    }
  }

  /**
   * Execute file writer tool
   *
   * Writes or creates files in the Vibe workspace file system.
   *
   * Security features:
   * - Blocks writing to sensitive paths (.env, credentials, etc.)
   * - Validates path format to prevent traversal attacks
   * - Only writes to in-memory Vibe workspace (persisted to localStorage)
   * - Automatically creates parent directories as needed
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

    // Security check: validate path before writing
    const pathError = validateFilePath(path);
    if (pathError) {
      return {
        success: false,
        error: pathError,
        path,
      };
    }

    // Additional check for potentially dangerous file types
    const dangerousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1'];
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      return {
        success: false,
        error:
          `Cannot write executable files (${ext}) for security reasons. ` +
          `If you need to create scripts, consider using a .txt extension and renaming manually.`,
        path,
      };
    }

    // Check if Vibe workspace is active - if not, initialize it
    // Writing should work even if workspace was empty
    try {
      if (import.meta.env.DEV) {
        console.log(
          `[FileWriter] Writing ${content.length} bytes to Vibe workspace: ${path}`
        );
      }

      // Check if file already exists
      let isNewFile = true;
      try {
        vibeFileSystem.readFile(path);
        isNewFile = false;
      } catch {
        // File doesn't exist, will create new
      }

      let fileNode;
      if (isNewFile) {
        // Create new file (this also creates parent directories)
        fileNode = vibeFileSystem.createFile(path, content);
      } else {
        // Update existing file
        fileNode = vibeFileSystem.updateFile(path, content);
      }

      if (import.meta.env.DEV) {
        console.log(
          `[FileWriter] Successfully ${isNewFile ? 'created' : 'updated'} ${path}`
        );
      }

      return {
        success: true,
        path,
        bytesWritten: content.length,
        language: fileNode.language,
        isNewFile,
        content: isNewFile
          ? `File created successfully at ${path}`
          : `File updated successfully at ${path}`,
      };
    } catch (error) {
      if (error instanceof FileSystemException) {
        // Provide helpful error messages based on error code
        switch (error.code) {
          case 'FILE_ALREADY_EXISTS':
            // This shouldn't happen with our logic above, but handle it
            return {
              success: false,
              error:
                `File already exists at "${path}". ` +
                `The file will be overwritten if you retry.`,
              path,
            };
          case 'INVALID_PATH':
            return {
              success: false,
              error:
                `Invalid path format: "${path}". ` +
                `Paths should start with / and use forward slashes.`,
              path,
            };
          case 'FOLDER_NOT_FOUND':
            return {
              success: false,
              error:
                `Parent folder not found for "${path}". ` +
                `This is unexpected - please try again.`,
              path,
            };
          default:
            return {
              success: false,
              error: error.message,
              path,
            };
        }
      }

      return {
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path,
      };
    }
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
          'Execute code in a sandboxed browser environment. Supports JavaScript, TypeScript (requires cross-origin isolation), and Python (via Pyodide). Has 10-second timeout and no network access for security.',
        parameters: {
          code: {
            type: 'string',
            description: 'The code to execute',
            required: true,
          },
          language: {
            type: 'string',
            description:
              'Programming language: javascript/js, typescript/ts, or python/py',
            required: true,
          },
          timeout: {
            type: 'number',
            description:
              'Execution timeout in milliseconds (default: 10000, max: 30000)',
            required: false,
          },
        },
        category: 'code',
        status: 'available',
      },
      {
        id: 'image_gen',
        name: 'Image Generator',
        description:
          'Generate images from text descriptions using DALL-E. Supports various sizes, quality levels, and artistic styles.',
        parameters: {
          prompt: {
            type: 'string',
            description: 'Detailed description of the image to generate',
            required: true,
          },
          size: {
            type: 'string',
            description:
              'Image size: 1024x1024 (square), 1024x1792 (portrait), or 1792x1024 (landscape). Default: 1024x1024',
            required: false,
          },
          quality: {
            type: 'string',
            description:
              'Image quality: standard or hd. HD provides more detail. Default: standard',
            required: false,
          },
          style: {
            type: 'string',
            description:
              'Image style: vivid (dramatic/hyper-real) or natural (more realistic). Default: vivid',
            required: false,
          },
          model: {
            type: 'string',
            description:
              'Model to use: dall-e-3 or dall-e-2. Default: dall-e-3',
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
          'Read file contents from the Vibe workspace or fetch from URLs. ' +
          'Workspace files use paths like "/src/App.tsx". URLs are fetched via CORS proxy. ' +
          'Blocked: .env, credentials, .git, node_modules, and key files.',
        parameters: {
          path: {
            type: 'string',
            description:
              'Path to the file in Vibe workspace (e.g., "/src/App.tsx") or a URL (http:// or https://)',
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
          'Create or update files in the Vibe workspace. ' +
          'Use paths like "/src/components/Button.tsx". Parent directories are created automatically. ' +
          'Blocked: .env, credentials, executable files, and sensitive paths.',
        parameters: {
          path: {
            type: 'string',
            description:
              'Path where the file should be created or updated (e.g., "/src/utils/helpers.ts")',
            required: true,
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
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
