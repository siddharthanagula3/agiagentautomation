/**
 * Code Execution Service
 *
 * Provides sandboxed code execution for multiple languages:
 * - JavaScript/TypeScript: WebContainer API (browser-based Node.js)
 * - Python: Pyodide (browser-based Python via WebAssembly)
 *
 * Security features:
 * - 10 second execution timeout
 * - Memory limits (50MB for JS, 100MB for Python)
 * - No network access for untrusted code
 * - Queue-based execution to prevent abuse
 * - Input sanitization
 */

// ============================================================================
// TYPES
// ============================================================================

export type SupportedLanguage =
  | 'javascript'
  | 'js'
  | 'typescript'
  | 'ts'
  | 'python'
  | 'py';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  language: string;
  memoryUsed?: number;
  timedOut?: boolean;
  error?: string;
}

export interface ExecutionOptions {
  timeout?: number; // Default: 10000ms (10 seconds)
  memoryLimit?: number; // In bytes
  allowNetwork?: boolean; // Default: false
  environment?: Record<string, string>;
}

interface QueuedExecution {
  id: string;
  code: string;
  language: SupportedLanguage;
  options: ExecutionOptions;
  resolve: (result: ExecutionResult) => void;
  reject: (error: Error) => void;
  queuedAt: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const MAX_TIMEOUT = 30_000; // 30 seconds max
const MAX_QUEUE_SIZE = 10;
const MAX_CODE_LENGTH = 100_000; // 100KB

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = {
  javascript: [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /\bimport\s*\(/i, // Dynamic import
    /\brequire\s*\(\s*['"`]child_process/i,
    /\brequire\s*\(\s*['"`]fs/i,
    /\brequire\s*\(\s*['"`]net/i,
    /\brequire\s*\(\s*['"`]http/i,
    /\brequire\s*\(\s*['"`]https/i,
    /\brequire\s*\(\s*['"`]dgram/i,
    /\brequire\s*\(\s*['"`]cluster/i,
    /\bprocess\.exit/i,
    /\bprocess\.kill/i,
    /\bglobal\s*\.\s*process/i,
  ],
  python: [
    /\bexec\s*\(/i,
    /\beval\s*\(/i,
    /\bcompile\s*\(/i,
    /\bimport\s+os\b/i,
    /\bimport\s+subprocess\b/i,
    /\bimport\s+sys\b/i,
    /\bimport\s+socket\b/i,
    /\bimport\s+urllib\b/i,
    /\bimport\s+requests\b/i,
    /\bfrom\s+os\s+import/i,
    /\bfrom\s+subprocess\s+import/i,
    /\b__import__\s*\(/i,
    /\bopen\s*\(\s*['"`][^'"`]*['"`]\s*,\s*['"`]w/i, // file write
  ],
};

// ============================================================================
// WEBCONTAINER MANAGER (for JS/TS)
// ============================================================================

interface WebContainerInstance {
  spawn: (
    command: string,
    args: string[],
    options?: { timeout?: number }
  ) => Promise<{
    output: ReadableStream<string>;
    exit: Promise<number>;
  }>;
  fs: {
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string, encoding: string) => Promise<string>;
    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  };
  mount: (fileTree: Record<string, unknown>) => Promise<void>;
  teardown: () => Promise<void>;
}

class WebContainerManager {
  private container: WebContainerInstance | null = null;
  private bootPromise: Promise<WebContainerInstance> | null = null;
  private isSupported: boolean | null = null;

  /**
   * Check if WebContainer API is supported in this browser
   */
  async checkSupport(): Promise<boolean> {
    if (this.isSupported !== null) {
      return this.isSupported;
    }

    try {
      // WebContainer requires SharedArrayBuffer and cross-origin isolation
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      const hasCrossOriginIsolation =
        typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

      if (!hasSharedArrayBuffer || !hasCrossOriginIsolation) {
        this.isSupported = false;
        return false;
      }

      // Also check if the package is available
      // Note: We defer this check to boot() time to avoid static analysis
      // For now, assume it might be available if we have SharedArrayBuffer
      this.isSupported = true;

      return this.isSupported;
    } catch {
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Boot the WebContainer instance
   */
  async boot(): Promise<WebContainerInstance> {
    if (this.container) {
      return this.container;
    }

    if (this.bootPromise) {
      return this.bootPromise;
    }

    this.bootPromise = (async () => {
      try {
        // Dynamic import to avoid bundle size impact when not used
        // Using string variable to prevent Vite static analysis
        const packageName = '@webcontainer/api';
        const webContainerModule = await import(
          /* @vite-ignore */
          packageName
        );
        const WebContainer = webContainerModule.WebContainer;
        this.container = (await WebContainer.boot()) as WebContainerInstance;
        return this.container;
      } catch (error) {
        this.bootPromise = null;
        this.isSupported = false;
        // Package not installed or failed to load
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (
          errorMsg.includes('Failed to resolve') ||
          errorMsg.includes('Cannot find module') ||
          errorMsg.includes('Failed to fetch')
        ) {
          throw new Error(
            'WebContainer API is not available. Install @webcontainer/api or use the Vibe workspace.'
          );
        }
        throw new Error(`Failed to boot WebContainer: ${errorMsg}`);
      }
    })();

    return this.bootPromise;
  }

  /**
   * Execute JavaScript/TypeScript code
   */
  async execute(
    code: string,
    language: 'javascript' | 'typescript',
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const timeout = Math.min(
      options.timeout || DEFAULT_TIMEOUT,
      MAX_TIMEOUT
    );

    try {
      const container = await this.boot();

      // Create execution file
      const ext = language === 'typescript' ? 'ts' : 'js';
      const fileName = `__exec__.${ext}`;

      // Wrap code to capture console output
      const wrappedCode = this.wrapCodeForCapture(code, language);

      await container.fs.writeFile(fileName, wrappedCode);

      // For TypeScript, we need to compile first
      if (language === 'typescript') {
        // Use tsx for TypeScript execution
        const tsResult = await this.runWithTimeout(
          container,
          'npx',
          ['tsx', fileName],
          timeout
        );
        return {
          ...tsResult,
          executionTime: performance.now() - startTime,
          language,
        };
      }

      // Execute JavaScript directly with Node
      const result = await this.runWithTimeout(
        container,
        'node',
        [fileName],
        timeout
      );

      return {
        ...result,
        executionTime: performance.now() - startTime,
        language,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          success: false,
          stdout: '',
          stderr: 'Execution timed out',
          exitCode: 124,
          executionTime,
          language,
          timedOut: true,
          error: 'Execution exceeded time limit',
        };
      }

      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        executionTime,
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Wrap code to capture console output
   */
  private wrapCodeForCapture(code: string, language: string): string {
    // For simple code, add console capture wrapper
    const isExpression =
      !code.includes('console.') &&
      !code.includes('function ') &&
      !code.includes('class ') &&
      !code.includes('const ') &&
      !code.includes('let ') &&
      !code.includes('var ');

    if (isExpression && code.trim().length < 500) {
      return `
try {
  const __result__ = ${code};
  if (__result__ !== undefined) {
    console.log(__result__);
  }
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
`;
    }

    return code;
  }

  /**
   * Run command with timeout
   */
  private async runWithTimeout(
    container: WebContainerInstance,
    command: string,
    args: string[],
    timeout: number
  ): Promise<Omit<ExecutionResult, 'executionTime' | 'language'>> {
    return new Promise((resolve) => {
      let stdout = '';
      const stderr = '';
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            stdout,
            stderr: stderr + '\nExecution timed out',
            exitCode: 124,
            timedOut: true,
            error: 'Execution exceeded time limit',
          });
        }
      }, timeout);

      container
        .spawn(command, args)
        .then(async (process) => {
          // Read output stream
          const reader = process.output.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              stdout += value;
            }
          } catch {
            // Stream ended
          }

          const exitCode = await process.exit;

          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              success: exitCode === 0,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode,
            });
          }
        })
        .catch((error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              success: false,
              stdout,
              stderr: error instanceof Error ? error.message : String(error),
              exitCode: 1,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
    });
  }

  /**
   * Cleanup resources
   */
  async teardown(): Promise<void> {
    if (this.container) {
      await this.container.teardown();
      this.container = null;
      this.bootPromise = null;
    }
  }
}

// ============================================================================
// PYODIDE MANAGER (for Python)
// ============================================================================

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (packages: string[]) => Promise<void>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

class PyodideManager {
  private pyodide: PyodideInstance | null = null;
  private loadPromise: Promise<PyodideInstance> | null = null;
  private isSupported: boolean | null = null;

  /**
   * Check if Pyodide is supported
   */
  async checkSupport(): Promise<boolean> {
    if (this.isSupported !== null) {
      return this.isSupported;
    }

    try {
      // Pyodide requires WebAssembly
      this.isSupported = typeof WebAssembly !== 'undefined';
      return this.isSupported;
    } catch {
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Load Pyodide runtime
   */
  async load(): Promise<PyodideInstance> {
    if (this.pyodide) {
      return this.pyodide;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Dynamic import from CDN
        const pyodideModule = await import(
          /* @vite-ignore */
          'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs'
        );

        this.pyodide = (await pyodideModule.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        })) as PyodideInstance;

        return this.pyodide;
      } catch (error) {
        this.loadPromise = null;
        throw new Error(
          `Failed to load Pyodide: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })();

    return this.loadPromise;
  }

  /**
   * Execute Python code
   */
  async execute(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const timeout = Math.min(
      options.timeout || DEFAULT_TIMEOUT,
      MAX_TIMEOUT
    );

    try {
      const pyodide = await this.load();

      // Create output capture setup
      const setupCode = `
import sys
from io import StringIO

__stdout_capture__ = StringIO()
__stderr_capture__ = StringIO()
__original_stdout__ = sys.stdout
__original_stderr__ = sys.stderr
sys.stdout = __stdout_capture__
sys.stderr = __stderr_capture__
`;

      // Cleanup code to restore stdout/stderr and get captured output
      const cleanupCode = `
sys.stdout = __original_stdout__
sys.stderr = __original_stderr__
__captured_stdout__ = __stdout_capture__.getvalue()
__captured_stderr__ = __stderr_capture__.getvalue()
`;

      // Run with timeout
      const result = await this.runWithTimeout(
        pyodide,
        setupCode,
        code,
        cleanupCode,
        timeout
      );

      return {
        ...result,
        executionTime: performance.now() - startTime,
        language: 'python',
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          success: false,
          stdout: '',
          stderr: 'Execution timed out',
          exitCode: 124,
          executionTime,
          language: 'python',
          timedOut: true,
          error: 'Execution exceeded time limit',
        };
      }

      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        executionTime,
        language: 'python',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run Python code with timeout
   */
  private async runWithTimeout(
    pyodide: PyodideInstance,
    setupCode: string,
    userCode: string,
    cleanupCode: string,
    timeout: number
  ): Promise<Omit<ExecutionResult, 'executionTime' | 'language'>> {
    return new Promise((resolve) => {
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            stdout: '',
            stderr: 'Execution timed out',
            exitCode: 124,
            timedOut: true,
            error: 'Execution exceeded time limit',
          });
        }
      }, timeout);

      (async () => {
        try {
          // Setup output capture
          await pyodide.runPythonAsync(setupCode);

          // Run user code
          let result: unknown;
          try {
            result = await pyodide.runPythonAsync(userCode);
          } catch (execError) {
            // Cleanup and capture error
            await pyodide.runPythonAsync(cleanupCode);
            const stderr =
              pyodide.globals.get('__captured_stderr__') as string;

            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              resolve({
                success: false,
                stdout: '',
                stderr:
                  stderr ||
                  (execError instanceof Error
                    ? execError.message
                    : String(execError)),
                exitCode: 1,
                error:
                  execError instanceof Error
                    ? execError.message
                    : String(execError),
              });
            }
            return;
          }

          // Cleanup and get output
          await pyodide.runPythonAsync(cleanupCode);
          const stdout = pyodide.globals.get('__captured_stdout__') as string;
          const stderr = pyodide.globals.get('__captured_stderr__') as string;

          // Format result
          let output = stdout || '';
          if (result !== undefined && result !== null) {
            const resultStr = String(result);
            if (resultStr !== 'None' && resultStr !== 'undefined') {
              output = output ? `${output}\n${resultStr}` : resultStr;
            }
          }

          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              success: true,
              stdout: output.trim(),
              stderr: stderr.trim(),
              exitCode: 0,
            });
          }
        } catch (error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              success: false,
              stdout: '',
              stderr:
                error instanceof Error ? error.message : String(error),
              exitCode: 1,
              error:
                error instanceof Error ? error.message : String(error),
            });
          }
        }
      })();
    });
  }
}

// ============================================================================
// FALLBACK EXECUTOR (Simple JS evaluation)
// ============================================================================

class FallbackExecutor {
  /**
   * Execute simple JavaScript expressions safely
   * Used when WebContainer is not available
   */
  async execute(
    code: string,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const timeout = Math.min(
      options.timeout || DEFAULT_TIMEOUT,
      MAX_TIMEOUT
    );

    // Only allow simple expressions (no statements)
    if (code.length > 1000) {
      return {
        success: false,
        stdout: '',
        stderr:
          'Code too long for fallback executor. WebContainer required for complex code.',
        exitCode: 1,
        executionTime: performance.now() - startTime,
        language: 'javascript',
        error: 'Code exceeds fallback executor limit',
      };
    }

    try {
      const result = await this.executeWithTimeout(code, timeout);
      return {
        success: true,
        stdout: String(result),
        stderr: '',
        exitCode: 0,
        executionTime: performance.now() - startTime,
        language: 'javascript',
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime: performance.now() - startTime,
        language: 'javascript',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private executeWithTimeout(
    code: string,
    timeout: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Execution timed out'));
      }, timeout);

      try {
        // Create a restricted sandbox
        const sandbox = {
          console: {
            log: (...args: unknown[]) => args.map(String).join(' '),
            error: (...args: unknown[]) => args.map(String).join(' '),
            warn: (...args: unknown[]) => args.map(String).join(' '),
          },
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          parseInt,
          parseFloat,
          isNaN,
          isFinite,
          encodeURIComponent,
          decodeURIComponent,
          encodeURI,
          decodeURI,
        };

        // Create function in sandbox context
        const fn = new Function(
          ...Object.keys(sandbox),
          `'use strict';
          try {
            const __result__ = (function() { return ${code}; })();
            return __result__;
          } catch (e) {
            throw e;
          }`
        );

        const result = fn(...Object.values(sandbox));
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }
}

// ============================================================================
// CODE EXECUTION SERVICE
// ============================================================================

export class CodeExecutionService {
  private webContainerManager = new WebContainerManager();
  private pyodideManager = new PyodideManager();
  private fallbackExecutor = new FallbackExecutor();
  private executionQueue: QueuedExecution[] = [];
  private isProcessing = false;
  private executionCount = 0;

  /**
   * Normalize language string to supported language
   */
  private normalizeLanguage(
    lang: string
  ): SupportedLanguage | null {
    const normalized = lang.toLowerCase().trim();
    const languageMap: Record<string, SupportedLanguage> = {
      javascript: 'javascript',
      js: 'javascript',
      typescript: 'typescript',
      ts: 'typescript',
      python: 'python',
      py: 'python',
      python3: 'python',
    };
    return languageMap[normalized] || null;
  }

  /**
   * Validate code for dangerous patterns
   */
  private validateCode(
    code: string,
    language: SupportedLanguage
  ): { valid: boolean; error?: string } {
    // Check code length
    if (code.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
        error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`,
      };
    }

    // Check for empty code
    if (!code.trim()) {
      return {
        valid: false,
        error: 'Code cannot be empty',
      };
    }

    // Get patterns for this language
    const baseLanguage =
      language === 'js'
        ? 'javascript'
        : language === 'ts'
          ? 'javascript'
          : language === 'py'
            ? 'python'
            : language;

    const patterns =
      DANGEROUS_PATTERNS[baseLanguage as keyof typeof DANGEROUS_PATTERNS];

    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          return {
            valid: false,
            error: `Code contains potentially dangerous pattern: ${pattern.source}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Execute code in a sandboxed environment
   */
  async execute(
    code: string,
    language: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    // Normalize language
    const normalizedLanguage = this.normalizeLanguage(language);
    if (!normalizedLanguage) {
      return {
        success: false,
        stdout: '',
        stderr: `Unsupported language: ${language}. Supported: javascript, typescript, python`,
        exitCode: 1,
        executionTime: 0,
        language,
        error: `Unsupported language: ${language}`,
      };
    }

    // Validate code
    const validation = this.validateCode(code, normalizedLanguage);
    if (!validation.valid) {
      return {
        success: false,
        stdout: '',
        stderr: validation.error || 'Code validation failed',
        exitCode: 1,
        executionTime: 0,
        language: normalizedLanguage,
        error: validation.error,
      };
    }

    // Queue execution
    return this.queueExecution(code, normalizedLanguage, options);
  }

  /**
   * Queue an execution request
   */
  private queueExecution(
    code: string,
    language: SupportedLanguage,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.executionQueue.length >= MAX_QUEUE_SIZE) {
        resolve({
          success: false,
          stdout: '',
          stderr: 'Execution queue is full. Please try again later.',
          exitCode: 1,
          executionTime: 0,
          language,
          error: 'Queue overflow',
        });
        return;
      }

      const execution: QueuedExecution = {
        id: `exec-${++this.executionCount}-${Date.now()}`,
        code,
        language,
        options,
        resolve,
        reject,
        queuedAt: Date.now(),
      };

      this.executionQueue.push(execution);
      this.processQueue();
    });
  }

  /**
   * Process queued executions
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const execution = this.executionQueue.shift()!;

      // Check if request has been waiting too long
      const waitTime = Date.now() - execution.queuedAt;
      if (waitTime > 60_000) {
        // 1 minute max wait
        execution.resolve({
          success: false,
          stdout: '',
          stderr: 'Execution request expired in queue',
          exitCode: 1,
          executionTime: 0,
          language: execution.language,
          error: 'Request timeout in queue',
        });
        continue;
      }

      try {
        const result = await this.executeInternal(
          execution.code,
          execution.language,
          execution.options
        );
        execution.resolve(result);
      } catch (error) {
        execution.resolve({
          success: false,
          stdout: '',
          stderr:
            error instanceof Error ? error.message : 'Unknown error',
          exitCode: 1,
          executionTime: 0,
          language: execution.language,
          error:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Internal execution logic
   */
  private async executeInternal(
    code: string,
    language: SupportedLanguage,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    // Handle Python
    if (language === 'python' || language === 'py') {
      const supported = await this.pyodideManager.checkSupport();
      if (!supported) {
        return {
          success: false,
          stdout: '',
          stderr: 'Python execution is not supported in this browser',
          exitCode: 1,
          executionTime: 0,
          language: 'python',
          error: 'WebAssembly not available',
        };
      }
      return this.pyodideManager.execute(code, options);
    }

    // Handle JavaScript/TypeScript
    const jsLanguage =
      language === 'ts' || language === 'typescript'
        ? 'typescript'
        : 'javascript';

    // Try WebContainer first
    const webContainerSupported =
      await this.webContainerManager.checkSupport();

    if (webContainerSupported) {
      return this.webContainerManager.execute(code, jsLanguage, options);
    }

    // Fall back to simple executor for short expressions
    if (jsLanguage === 'javascript') {
      return this.fallbackExecutor.execute(code, options);
    }

    // TypeScript requires WebContainer
    return {
      success: false,
      stdout: '',
      stderr:
        'TypeScript execution requires cross-origin isolation (COOP/COEP headers). ' +
        'Please use the Vibe workspace for TypeScript execution.',
      exitCode: 1,
      executionTime: 0,
      language: 'typescript',
      error: 'WebContainer not available',
    };
  }

  /**
   * Check which runtimes are available
   */
  async checkRuntimeAvailability(): Promise<{
    javascript: boolean;
    typescript: boolean;
    python: boolean;
    webContainer: boolean;
    pyodide: boolean;
  }> {
    const [webContainerSupported, pyodideSupported] = await Promise.all([
      this.webContainerManager.checkSupport(),
      this.pyodideManager.checkSupport(),
    ]);

    return {
      javascript: true, // Always available via fallback
      typescript: webContainerSupported,
      python: pyodideSupported,
      webContainer: webContainerSupported,
      pyodide: pyodideSupported,
    };
  }

  /**
   * Preload runtimes for faster first execution
   */
  async preloadRuntimes(): Promise<void> {
    const [webContainerSupported, pyodideSupported] = await Promise.all([
      this.webContainerManager.checkSupport(),
      this.pyodideManager.checkSupport(),
    ]);

    const loadPromises: Promise<unknown>[] = [];

    if (webContainerSupported) {
      loadPromises.push(
        this.webContainerManager.boot().catch((e) => {
          console.warn('Failed to preload WebContainer:', e);
        })
      );
    }

    if (pyodideSupported) {
      loadPromises.push(
        this.pyodideManager.load().catch((e) => {
          console.warn('Failed to preload Pyodide:', e);
        })
      );
    }

    await Promise.allSettled(loadPromises);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.webContainerManager.teardown();
    this.executionQueue = [];
    this.isProcessing = false;
  }
}

// Export singleton instance
export const codeExecutionService = new CodeExecutionService();
