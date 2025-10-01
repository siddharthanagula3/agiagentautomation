import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Task {
  id: string;
  description: string;
  context?: string;
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

export class GeminiCLIAgent {
  private genAI: GoogleGenerativeAI;
  private onProgress?: (update: ProgressUpdate) => void;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      import.meta.env.VITE_GOOGLE_AI_API_KEY
    );
  }

  setProgressCallback(callback: (update: ProgressUpdate) => void) {
    this.onProgress = callback;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    try {
      this.emitProgress({
        taskId: task.id,
        progress: 10,
        message: 'Initializing Gemini...'
      });

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp'
      });

      const prompt = this.buildPrompt(task);

      this.emitProgress({
        taskId: task.id,
        progress: 30,
        message: 'Sending request to Gemini...'
      });

      const result = await model.generateContentStream(prompt);
      
      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      this.emitProgress({
        taskId: task.id,
        progress: 50,
        message: 'Processing response...'
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        this.emitProgress({
          taskId: task.id,
          progress: 50 + (fullResponse.length / 1000) * 30,
          message: 'Generating response...'
        });
      }

      // Get usage information from the response
      if (result.response?.usageMetadata) {
        inputTokens = result.response.usageMetadata.promptTokenCount || 0;
        outputTokens = result.response.usageMetadata.candidatesTokenCount || 0;
      }

      this.emitProgress({
        taskId: task.id,
        progress: 90,
        message: 'Finalizing response...'
      });

      const cost = this.calculateCost(inputTokens, outputTokens);

      this.emitProgress({
        taskId: task.id,
        progress: 100,
        message: 'Task completed successfully'
      });

      return {
        success: true,
        result: fullResponse,
        cost,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens
        }
      };
    } catch (error) {
      this.emitProgress({
        taskId: task.id,
        progress: 0,
        message: `Error: ${error.message}`
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private buildPrompt(task: Task): string {
    let prompt = `You are Gemini, an advanced AI assistant specialized in:

1. Command-line interface operations
2. System administration tasks
3. File and directory management
4. Process monitoring and control
5. Network operations
6. Development environment setup

Task: ${task.description}

Please provide:
- Step-by-step CLI commands
- Explanations for each command
- Alternative approaches if applicable
- Safety considerations
- Verification steps

Format your response with clear sections and code blocks for commands.`;

    if (task.context) {
      prompt += `\n\nContext:\n${task.context}`;
    }

    if (task.requirements && task.requirements.length > 0) {
      prompt += `\n\nRequirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}`;
    }

    return prompt;
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 2.0 Flash pricing: $0.075/M input, $0.30/M output tokens
    const inputCost = (inputTokens / 1000000) * 0.075;
    const outputCost = (outputTokens / 1000000) * 0.30;
    return inputCost + outputCost;
  }

  private emitProgress(update: ProgressUpdate) {
    if (this.onProgress) {
      this.onProgress(update);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash'
      });
      
      await model.generateContent('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}
