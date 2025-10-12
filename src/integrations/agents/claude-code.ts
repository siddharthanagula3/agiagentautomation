import Anthropic from '@anthropic-ai/sdk';

export interface Task {
  id: string;
  description: string;
  code?: string;
  language?: string;
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

export class ClaudeCodeAgent {
  private client: Anthropic;
  private onProgress?: (update: ProgressUpdate) => void;

  constructor() {
    this.client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    });
  }

  setProgressCallback(callback: (update: ProgressUpdate) => void) {
    this.onProgress = callback;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    try {
      this.emitProgress({
        taskId: task.id,
        progress: 10,
        message: 'Initializing Claude...',
      });

      const systemPrompt = this.buildSystemPrompt(task);
      const userPrompt = this.buildUserPrompt(task);

      this.emitProgress({
        taskId: task.id,
        progress: 30,
        message: 'Sending request to Claude...',
      });

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        stream: true,
      });

      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      this.emitProgress({
        taskId: task.id,
        progress: 50,
        message: 'Generating code...',
      });

      for await (const chunk of response) {
        if (chunk.type === 'content_block_delta') {
          fullResponse += chunk.delta.text;

          this.emitProgress({
            taskId: task.id,
            progress: 50 + (fullResponse.length / 1000) * 30,
            message: 'Generating code...',
          });
        }
      }

      // Get usage information
      if (response.usage) {
        inputTokens = response.usage.input_tokens;
        outputTokens = response.usage.output_tokens;
      }

      this.emitProgress({
        taskId: task.id,
        progress: 90,
        message: 'Finalizing response...',
      });

      const cost = this.calculateCost(inputTokens, outputTokens);

      this.emitProgress({
        taskId: task.id,
        progress: 100,
        message: 'Task completed successfully',
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

  private buildSystemPrompt(task: Task): string {
    return `You are Claude, an expert AI coding assistant. Your role is to:

1. Analyze coding tasks and requirements
2. Generate high-quality, production-ready code
3. Follow best practices and coding standards
4. Provide clear explanations and comments
5. Handle multiple programming languages
6. Ensure code is secure and efficient

Current task: ${task.description}
Language: ${task.language || 'auto-detect'}
Requirements: ${task.requirements?.join(', ') || 'none specified'}

Please provide:
- Clean, well-commented code
- Explanation of the solution
- Any necessary setup instructions
- Testing recommendations if applicable`;
  }

  private buildUserPrompt(task: Task): string {
    let prompt = `Task: ${task.description}\n\n`;

    if (task.code) {
      prompt += `Existing code:\n\`\`\`${task.language || 'text'}\n${task.code}\n\`\`\`\n\n`;
    }

    if (task.requirements && task.requirements.length > 0) {
      prompt += `Requirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}\n\n`;
    }

    prompt += `Please provide the complete solution with code and explanation.`;

    return prompt;
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude 3.5 Sonnet pricing: $3/M input, $15/M output tokens
    const inputCost = (inputTokens / 1000000) * 3;
    const outputCost = (outputTokens / 1000000) * 15;
    return inputCost + outputCost;
  }

  private emitProgress(update: ProgressUpdate) {
    if (this.onProgress) {
      this.onProgress(update);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
