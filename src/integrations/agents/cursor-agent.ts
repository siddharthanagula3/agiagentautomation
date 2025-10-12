import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Task {
  id: string;
  description: string;
  code?: string;
  language?: string;
  filePath?: string;
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

export class CursorAgent {
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
        message: 'Initializing Cursor AI...',
      });

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const prompt = this.buildPrompt(task);

      this.emitProgress({
        taskId: task.id,
        progress: 30,
        message: 'Analyzing code context...',
      });

      const result = await model.generateContentStream(prompt);

      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      this.emitProgress({
        taskId: task.id,
        progress: 50,
        message: 'Generating code suggestions...',
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        this.emitProgress({
          taskId: task.id,
          progress: 50 + (fullResponse.length / 1000) * 30,
          message: 'Processing suggestions...',
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
        message: 'Finalizing code...',
      });

      const cost = this.calculateCost(inputTokens, outputTokens);

      this.emitProgress({
        taskId: task.id,
        progress: 100,
        message: 'Code generation completed',
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
    let prompt = `You are Cursor AI, an advanced code editor assistant. Your role is to:

1. Understand code context and requirements
2. Generate high-quality code solutions
3. Provide refactoring suggestions
4. Debug and fix code issues
5. Suggest best practices and optimizations
6. Maintain code consistency and style

Task: ${task.description}`;

    if (task.filePath) {
      prompt += `\nFile: ${task.filePath}`;
    }

    if (task.language) {
      prompt += `\nLanguage: ${task.language}`;
    }

    if (task.code) {
      prompt += `\n\nCurrent code:\n\`\`\`${task.language || 'text'}\n${task.code}\n\`\`\``;
    }

    if (task.requirements && task.requirements.length > 0) {
      prompt += `\n\nRequirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}`;
    }

    prompt += `\n\nPlease provide:
- Complete, working code solution
- Clear explanations of changes
- Comments for complex logic
- Testing recommendations
- Performance considerations if applicable`;

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
