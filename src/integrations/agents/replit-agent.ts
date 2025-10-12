import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Task {
  id: string;
  description: string;
  code?: string;
  language?: string;
  environment?: string;
  requirements?: string[];
}

export interface TaskResult {
  success: boolean;
  result?: string;
  error?: string;
  cost?: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface ProgressUpdate {
  taskId: string;
  progress: number;
  message: string;
}

export class ReplitAgent {
  private genAI: GoogleGenerativeAI;
  private onProgress?: (update: ProgressUpdate) => void;

  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
  }

  setProgressCallback(callback: (update: ProgressUpdate) => void) {
    this.onProgress = callback;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    try {
      this.emitProgress({
        taskId: task.id,
        progress: 10,
        message: 'Initializing Replit environment...',
      });

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const prompt = this.buildPrompt(task);

      this.emitProgress({
        taskId: task.id,
        progress: 30,
        message: 'Setting up development environment...',
      });

      const result = await model.generateContentStream(prompt);

      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      this.emitProgress({
        taskId: task.id,
        progress: 50,
        message: 'Generating code and setup instructions...',
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        this.emitProgress({
          taskId: task.id,
          progress: 50 + (fullResponse.length / 1000) * 30,
          message: 'Processing development solution...',
        });
      }

      // Get usage information
      if (result.response?.usageMetadata) {
        inputTokens = result.response.usageMetadata.promptTokenCount || 0;
        outputTokens = result.response.usageMetadata.candidatesTokenCount || 0;
      }

      this.emitProgress({
        taskId: task.id,
        progress: 90,
        message: 'Finalizing development setup...',
      });

      const cost = this.calculateCost(inputTokens, outputTokens);

      this.emitProgress({
        taskId: task.id,
        progress: 100,
        message: 'Development environment ready',
      });

      return {
        success: true,
        result: fullResponse,
        cost,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
      };
    } catch (error) {
      this.emitProgress({
        taskId: task.id,
        progress: 0,
        message: `Error: ${error.message}`,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private buildPrompt(task: Task): string {
    let prompt = `You are Replit AI, a cloud development environment assistant. Your role is to:

1. Set up complete development environments
2. Install and configure dependencies
3. Create runnable code projects
4. Provide deployment instructions
5. Handle multiple programming languages and frameworks
6. Set up databases and external services

Task: ${task.description}`;

    if (task.environment) {
      prompt += `\nEnvironment: ${task.environment}`;
    }

    if (task.language) {
      prompt += `\nLanguage: ${task.language}`;
    }

    if (task.code) {
      prompt += `\n\nExisting code:\n\`\`\`${task.language || 'text'}\n${task.code}\n\`\`\``;
    }

    if (task.requirements && task.requirements.length > 0) {
      prompt += `\n\nRequirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}`;
    }

    prompt += `\n\nPlease provide:
1. Complete project setup instructions
2. All necessary code files
3. Dependency installation commands
4. Environment configuration
5. How to run and test the project
6. Deployment options if applicable

Format with clear sections and code blocks.`;

    return prompt;
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 2.0 Flash pricing: $0.075/M input, $0.30/M output tokens
    const inputCost = (inputTokens / 1000000) * 0.075;
    const outputCost = (outputTokens / 1000000) * 0.3;
    return inputCost + outputCost;
  }

  private emitProgress(update: ProgressUpdate) {
    if (this.onProgress) {
      this.onProgress(update);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      await model.generateContent('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}
