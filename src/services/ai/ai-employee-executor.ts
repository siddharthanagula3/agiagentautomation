// AI Employee Executor
// Handles AI Employee task execution and tool invocation

import {
  AIEmployee,
  ToolInvocation,
  ToolResult,
  ExecutionContext,
  Job,
} from '../../types';
import { toolInvocationService } from '../tools/tool-invocation-service';
import { aiEmployeeService } from './ai-employee-service';

export interface TaskExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  toolsUsed: string[];
  executionTime: number;
  cost: number;
}

export class AIEmployeeExecutor {
  private employee: AIEmployee;
  private context: ExecutionContext;

  constructor(employee: AIEmployee, context: ExecutionContext) {
    this.employee = employee;
    this.context = context;
  }

  /**
   * Execute a task for the AI Employee
   */
  async executeTask(task: string, job?: Job): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];
    let totalCost = 0;

    try {
      console.log(`AI Employee ${this.employee.name} starting task: ${task}`);

      // Parse the task to identify required tools
      const requiredTools = await this.identifyRequiredTools(task);
      console.log(`Identified required tools: ${requiredTools.join(', ')}`);

      // Execute tools in sequence
      const results: any[] = [];
      for (const toolId of requiredTools) {
        try {
          const toolResult = await this.executeTool(toolId, task, job);
          results.push(toolResult);
          toolsUsed.push(toolId);
          totalCost += toolResult.cost;

          console.log(`Tool ${toolId} executed successfully`);
        } catch (error) {
          console.error(`Tool ${toolId} execution failed:`, error);
          // Continue with other tools even if one fails
        }
      }

      // Combine results
      const combinedResult = this.combineResults(results);

      // Update employee performance
      await this.updatePerformance(true, Date.now() - startTime);

      return {
        success: true,
        result: combinedResult,
        toolsUsed,
        executionTime: Date.now() - startTime,
        cost: totalCost,
      };
    } catch (error) {
      console.error(`Task execution failed for ${this.employee.name}:`, error);

      // Update employee performance with failure
      await this.updatePerformance(false, Date.now() - startTime);

      return {
        success: false,
        error: (error as Error).message,
        toolsUsed,
        executionTime: Date.now() - startTime,
        cost: totalCost,
      };
    }
  }

  /**
   * Identify required tools based on task description
   */
  private async identifyRequiredTools(task: string): Promise<string[]> {
    const availableTools = this.employee.tools || [];
    const requiredTools: string[] = [];

    // Simple keyword-based tool identification
    const taskLower = task.toLowerCase();

    // Code generation tasks
    if (
      taskLower.includes('code') ||
      taskLower.includes('program') ||
      taskLower.includes('function')
    ) {
      const codeTool = availableTools.find(tool => tool.id === 'generate_code');
      if (codeTool) requiredTools.push('generate_code');
    }

    // Data analysis tasks
    if (
      taskLower.includes('analyze') ||
      taskLower.includes('data') ||
      taskLower.includes('report')
    ) {
      const dataTool = availableTools.find(tool => tool.id === 'analyze_data');
      if (dataTool) requiredTools.push('analyze_data');
    }

    // Email tasks
    if (
      taskLower.includes('email') ||
      taskLower.includes('send') ||
      taskLower.includes('message')
    ) {
      const emailTool = availableTools.find(tool => tool.id === 'send_email');
      if (emailTool) requiredTools.push('send_email');
    }

    // Web search tasks
    if (
      taskLower.includes('search') ||
      taskLower.includes('find') ||
      taskLower.includes('research')
    ) {
      const searchTool = availableTools.find(tool => tool.id === 'web_search');
      if (searchTool) requiredTools.push('web_search');
    }

    // File upload tasks
    if (
      taskLower.includes('upload') ||
      taskLower.includes('file') ||
      taskLower.includes('document')
    ) {
      const uploadTool = availableTools.find(tool => tool.id === 'file_upload');
      if (uploadTool) requiredTools.push('file_upload');
    }

    // If no specific tools identified, use the first available tool
    if (requiredTools.length === 0 && availableTools.length > 0) {
      requiredTools.push(availableTools[0].id);
    }

    return requiredTools;
  }

  /**
   * Execute a specific tool
   */
  private async executeTool(
    toolId: string,
    task: string,
    job?: Job
  ): Promise<ToolResult> {
    // Prepare parameters based on task and tool
    const parameters = this.prepareToolParameters(toolId, task, job);

    // Execute the tool
    const result = await toolInvocationService.invokeTool(
      toolId,
      parameters,
      this.context
    );

    return result;
  }

  /**
   * Prepare tool parameters based on task description
   */
  private prepareToolParameters(
    toolId: string,
    task: string,
    job?: Job
  ): Record<string, any> {
    const baseParameters = {
      task,
      employee: this.employee.name,
      role: this.employee.role,
      timestamp: new Date().toISOString(),
    };

    // Add job context if available
    if (job) {
      baseParameters.jobId = job.id;
      baseParameters.jobTitle = job.title;
      baseParameters.jobDescription = job.description;
    }

    // Tool-specific parameter preparation
    switch (toolId) {
      case 'generate_code':
        return {
          ...baseParameters,
          language: this.extractLanguage(task) || 'javascript',
          requirements: task,
          framework: this.extractFramework(task) || 'react',
        };

      case 'analyze_data':
        return {
          ...baseParameters,
          data: this.extractDataReference(task),
          analysisType: this.extractAnalysisType(task) || 'descriptive',
          format: 'json',
        };

      case 'send_email':
        return {
          ...baseParameters,
          to: this.extractEmail(task) || 'user@example.com',
          subject: this.extractSubject(task) || 'Task Update',
          body: task,
        };

      case 'web_search':
        return {
          ...baseParameters,
          query: task,
          maxResults: 10,
        };

      case 'file_upload':
        return {
          ...baseParameters,
          filename: this.extractFilename(task) || 'document.txt',
          content: task,
          type: 'text/plain',
        };

      default:
        return baseParameters;
    }
  }

  /**
   * Extract programming language from task
   */
  private extractLanguage(task: string): string | null {
    const languages = [
      'javascript',
      'python',
      'java',
      'typescript',
      'csharp',
      'php',
      'ruby',
      'go',
    ];
    const taskLower = task.toLowerCase();

    for (const lang of languages) {
      if (taskLower.includes(lang)) {
        return lang;
      }
    }
    return null;
  }

  /**
   * Extract framework from task
   */
  private extractFramework(task: string): string | null {
    const frameworks = [
      'react',
      'vue',
      'angular',
      'node',
      'express',
      'django',
      'flask',
      'spring',
    ];
    const taskLower = task.toLowerCase();

    for (const framework of frameworks) {
      if (taskLower.includes(framework)) {
        return framework;
      }
    }
    return null;
  }

  /**
   * Extract data reference from task
   */
  private extractDataReference(task: string): any {
    // This would typically extract actual data references
    // For now, return a mock dataset
    return {
      type: 'mock_dataset',
      size: 1000,
      fields: ['id', 'name', 'value', 'timestamp'],
    };
  }

  /**
   * Extract analysis type from task
   */
  private extractAnalysisType(task: string): string | null {
    const types = ['descriptive', 'predictive', 'diagnostic', 'prescriptive'];
    const taskLower = task.toLowerCase();

    for (const type of types) {
      if (taskLower.includes(type)) {
        return type;
      }
    }
    return null;
  }

  /**
   * Extract email from task
   */
  private extractEmail(task: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = task.match(emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Extract subject from task
   */
  private extractSubject(task: string): string | null {
    // Simple extraction - look for "subject:" or similar patterns
    const subjectMatch = task.match(/subject:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1].trim() : null;
  }

  /**
   * Extract filename from task
   */
  private extractFilename(task: string): string | null {
    const filenameMatch = task.match(/filename:\s*(.+)/i);
    return filenameMatch ? filenameMatch[1].trim() : null;
  }

  /**
   * Combine results from multiple tool executions
   */
  private combineResults(results: any[]): any {
    if (results.length === 0) {
      return { message: 'No tools were executed' };
    }

    if (results.length === 1) {
      return results[0];
    }

    // Combine multiple results
    return {
      combined: true,
      results,
      summary: `Executed ${results.length} tools successfully`,
      totalResults: results.length,
    };
  }

  /**
   * Update employee performance metrics
   */
  private async updatePerformance(
    success: boolean,
    executionTime: number
  ): Promise<void> {
    try {
      const currentMetrics = await aiEmployeeService.getPerformanceMetrics(
        this.employee.id
      );

      const updatedMetrics = {
        ...currentMetrics,
        tasksCompleted: currentMetrics.tasksCompleted + (success ? 1 : 0),
        successRate: this.calculateSuccessRate(currentMetrics, success),
        averageExecutionTime: this.calculateAverageExecutionTime(
          currentMetrics,
          executionTime
        ),
        errorRate: this.calculateErrorRate(currentMetrics, success),
        lastUpdated: new Date().toISOString(),
      };

      await aiEmployeeService.updatePerformance(
        this.employee.id,
        updatedMetrics
      );
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(currentMetrics: any, success: boolean): number {
    const totalTasks = currentMetrics.tasksCompleted + (success ? 1 : 0);
    const successfulTasks =
      currentMetrics.tasksCompleted * (currentMetrics.successRate / 100) +
      (success ? 1 : 0);
    return totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;
  }

  /**
   * Calculate average execution time
   */
  private calculateAverageExecutionTime(
    currentMetrics: any,
    executionTime: number
  ): number {
    const totalTasks = currentMetrics.tasksCompleted + 1;
    const currentTotal =
      currentMetrics.averageExecutionTime * currentMetrics.tasksCompleted;
    return (currentTotal + executionTime) / totalTasks;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(currentMetrics: any, success: boolean): number {
    const totalTasks = currentMetrics.tasksCompleted + 1;
    const currentErrors =
      (currentMetrics.errorRate * currentMetrics.tasksCompleted) / 100;
    const newErrors = success ? 0 : 1;
    return totalTasks > 0
      ? ((currentErrors + newErrors) / totalTasks) * 100
      : 0;
  }
}

export const createAIEmployeeExecutor = (
  employee: AIEmployee,
  context: ExecutionContext
) => {
  return new AIEmployeeExecutor(employee, context);
};
