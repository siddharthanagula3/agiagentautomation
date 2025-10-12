export interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
  memoryUsed?: number;
}

export interface ToolResult {
  success: boolean;
  data?: ExecutionResult;
  error?: string;
  cost?: number;
}

export interface CodeExecutionParams {
  code: string;
  language: string;
  input?: string;
  timeout?: number;
}

export class CodeExecutorTool {
  private sandboxUrl: string = 'https://api.jdoodle.com/v1/execute';
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = import.meta.env.VITE_JDOODLE_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_JDOODLE_CLIENT_SECRET || '';
  }

  async execute(params: CodeExecutionParams): Promise<ToolResult> {
    try {
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'JDoodle API credentials not configured',
        };
      }

      const languageMap: Record<string, string> = {
        javascript: 'nodejs',
        python: 'python3',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        php: 'php',
        ruby: 'ruby',
        go: 'go',
        rust: 'rust',
        typescript: 'nodejs',
      };

      const jdoodleLanguage =
        languageMap[params.language.toLowerCase()] || 'nodejs';

      const requestBody = {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        script: params.code,
        language: jdoodleLanguage,
        versionIndex: '0',
        stdin: params.input || '',
      };

      const startTime = Date.now();

      const response = await fetch(this.sandboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Execution API error: ${response.status}`);
      }

      const result = await response.json();

      const executionResult: ExecutionResult = {
        output: result.output || '',
        error: result.error || undefined,
        exitCode: result.statusCode || 0,
        executionTime: executionTime,
        memoryUsed: result.memory || undefined,
      };

      return {
        success: true,
        data: executionResult,
        cost: 0.01, // Approximate cost per execution
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    return [
      'javascript',
      'python',
      'java',
      'cpp',
      'c',
      'php',
      'ruby',
      'go',
      'rust',
      'typescript',
    ];
  }

  async validateApiCredentials(): Promise<boolean> {
    try {
      if (!this.clientId || !this.clientSecret) {
        return false;
      }

      const testResult = await this.execute({
        code: 'console.log("test");',
        language: 'javascript',
      });

      return testResult.success;
    } catch (error) {
      return false;
    }
  }
}
