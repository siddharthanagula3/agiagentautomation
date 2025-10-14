/**
 * Tool Integration Manager
 * Centralized management of external tool integrations and API connections
 */

// Types
export type IntegrationType =
  | 'ai_service'
  | 'automation'
  | 'communication'
  | 'development'
  | 'data_processing'
  | 'monitoring'
  | 'analytics'
  | 'storage'
  | 'security';

export interface AuthenticationConfig {
  type: 'api_key' | 'oauth' | 'basic_auth' | 'bearer_token';
  config: {
    key?: string;
    secret?: string;
    token?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scopes?: string[];
  };
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrent: number;
  burst?: number;
}

export interface CostStructure {
  type:
    | 'flat_rate'
    | 'per_request'
    | 'per_token'
    | 'per_minute'
    | 'per_gb'
    | 'tiered';
  amount: number;
  currency: string;
  unit?: string;
  tiers?: {
    min: number;
    max: number;
    rate: number;
  }[];
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalCost: number;
  lastUpdated?: Date;
}

export interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  provider: string;
  version: string;
  config: Record<string, unknown>;
  isActive: boolean;
  authentication: AuthenticationConfig;
  capabilities: string[];
  rateLimit: RateLimit;
  cost: CostStructure;
  usageStats: UsageStats;
  metadata?: {
    documentation?: string;
    supportUrl?: string;
    webhookUrl?: string;
    tags?: string[];
    category?: string;
    iconUrl?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ToolExecutionContext {
  userId: string;
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  executionTime?: number;
  cost?: number;
}

type ToolParameters = Record<string, unknown>;

// Tool Integration Manager Class
class ToolIntegrationManager {
  private integrations: Map<string, ToolIntegration> = new Map();
  private executionQueue: Array<{
    integrationId: string;
    operation: string;
    parameters: unknown;
    context: ToolExecutionContext;
    resolve: (result: ToolExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations() {
    // Start with empty integrations for new users
    // Integrations will be added when users configure them through the UI
  }

  // Integration Management
  async registerIntegration(integration: ToolIntegration): Promise<void> {
    try {
      // Validate integration
      this.validateIntegration(integration);

      // Test connection if active
      if (integration.isActive) {
        await this.testConnection(integration);
      }

      // Store integration
      this.integrations.set(integration.id, {
        ...integration,
        updatedAt: new Date(),
      });

      console.log(`Integration '${integration.name}' registered successfully`);
    } catch (error) {
      console.error(
        `Failed to register integration '${integration.name}':`,
        error
      );
      throw error;
    }
  }

  async deactivateIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration '${integrationId}' not found`);
    }

    this.integrations.set(integrationId, {
      ...integration,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  getAllIntegrations(): ToolIntegration[] {
    return Array.from(this.integrations.values());
  }

  getIntegration(integrationId: string): ToolIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  getActiveIntegrations(): ToolIntegration[] {
    return this.getAllIntegrations().filter(
      (integration) => integration.isActive
    );
  }

  getIntegrationsByType(type: IntegrationType): ToolIntegration[] {
    return this.getAllIntegrations().filter(
      (integration) => integration.type === type
    );
  }

  // Tool Execution
  async executeTool(
    integrationId: string,
    operation: string,
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        integrationId,
        operation,
        parameters,
        context,
        resolve,
        reject,
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const task = this.executionQueue.shift()!;

      try {
        const result = await this.executeIntegrationTask(
          task.integrationId,
          task.operation,
          task.parameters,
          task.context
        );
        task.resolve(result);
      } catch (error) {
        task.reject(error as Error);
      }
    }

    this.isProcessing = false;
  }

  private async executeIntegrationTask(
    integrationId: string,
    operation: string,
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error(`Integration '${integrationId}' not found`);
    }

    if (!integration.isActive) {
      throw new Error(`Integration '${integration.name}' is not active`);
    }

    const startTime = Date.now();

    try {
      // Check rate limits
      await this.checkRateLimit(integration);

      // Execute the operation
      const result = await this.performOperation(
        integration,
        operation,
        parameters,
        context
      );

      const executionTime = Date.now() - startTime;

      // Update usage statistics
      this.updateUsageStats(integration, true, executionTime, result.cost || 0);

      return {
        success: true,
        data: result.data,
        metadata: result.metadata,
        executionTime,
        cost: result.cost,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Update usage statistics for failed request
      this.updateUsageStats(integration, false, executionTime, 0);

      return {
        success: false,
        error: (error as Error).message,
        executionTime,
      };
    }
  }

  private async performOperation(
    integration: ToolIntegration,
    operation: string,
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<{ data?: unknown; metadata?: unknown; cost?: number }> {
    // Simulate different operations based on integration type
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 2000 + 500)
    );

    switch (integration.type) {
      case 'ai_service':
        return this.performAIOperation(integration, operation, parameters);
      case 'communication':
        return this.performCommunicationOperation(
          integration,
          operation,
          parameters
        );
      case 'automation':
        return this.performAutomationOperation(
          integration,
          operation,
          parameters
        );
      default:
        return this.performGenericOperation(integration, operation, parameters);
    }
  }

  private async performAIOperation(
    integration: ToolIntegration,
    operation: string,
    parameters: ToolParameters
  ): Promise<{ data?: unknown; metadata?: unknown; cost?: number }> {
    switch (operation) {
      case 'text_completion':
        return {
          data: {
            text: `Generated text response for: "${parameters.prompt}"`,
            model: integration.config.defaultModel || 'gpt-4',
            tokens: 150,
          },
          cost: 0.003,
        };
      case 'chat_completion':
        return {
          data: {
            message: `AI response to: "${parameters.messages?.[0]?.content || 'Hello'}"`,
            model: integration.config.defaultModel || 'gpt-4',
            tokens: 200,
          },
          cost: 0.004,
        };
      case 'test_connection':
        return {
          data: { status: 'connected', version: integration.version },
          metadata: { provider: integration.provider },
        };
      default:
        throw new Error(`Unsupported AI operation: ${operation}`);
    }
  }

  private async performCommunicationOperation(
    integration: ToolIntegration,
    operation: string,
    parameters: ToolParameters
  ): Promise<{ data?: unknown; metadata?: unknown; cost?: number }> {
    switch (operation) {
      case 'send_message':
        return {
          data: {
            messageId: `msg_${Date.now()}`,
            channel: parameters.channel || integration.config.defaultChannel,
            timestamp: new Date().toISOString(),
          },
        };
      case 'test_connection':
        return {
          data: { status: 'connected', workspace: 'demo-workspace' },
          metadata: { provider: integration.provider },
        };
      default:
        throw new Error(`Unsupported communication operation: ${operation}`);
    }
  }

  private async performAutomationOperation(
    integration: ToolIntegration,
    operation: string,
    parameters: ToolParameters
  ): Promise<{ data?: unknown; metadata?: unknown; cost?: number }> {
    switch (operation) {
      case 'trigger_workflow':
        return {
          data: {
            workflowId: parameters.workflowId,
            executionId: `exec_${Date.now()}`,
            status: 'started',
          },
          cost: 0.001,
        };
      case 'test_connection':
        return {
          data: { status: 'connected', workflows: 12 },
          metadata: { provider: integration.provider },
        };
      default:
        throw new Error(`Unsupported automation operation: ${operation}`);
    }
  }

  private async performGenericOperation(
    integration: ToolIntegration,
    operation: string,
    parameters: ToolParameters
  ): Promise<{ data?: unknown; metadata?: unknown; cost?: number }> {
    switch (operation) {
      case 'test_connection':
        return {
          data: { status: 'connected' },
          metadata: { provider: integration.provider },
        };
      default:
        return {
          data: { result: 'success', operation, parameters },
          metadata: { integration: integration.name },
        };
    }
  }

  // Utility Methods
  private validateIntegration(integration: ToolIntegration): void {
    if (!integration.id || !integration.name || !integration.type) {
      throw new Error('Integration must have id, name, and type');
    }

    if (!integration.authentication || !integration.authentication.type) {
      throw new Error('Integration must have authentication configuration');
    }

    // Validate authentication config based on type
    const auth = integration.authentication;
    switch (auth.type) {
      case 'api_key':
        if (!auth.config.key) {
          throw new Error('API key authentication requires a key');
        }
        break;
      case 'oauth':
        if (!auth.config.clientId || !auth.config.clientSecret) {
          throw new Error(
            'OAuth authentication requires clientId and clientSecret'
          );
        }
        break;
      case 'bearer_token':
        if (!auth.config.token) {
          throw new Error('Bearer token authentication requires a token');
        }
        break;
    }
  }

  private async testConnection(integration: ToolIntegration): Promise<void> {
    try {
      const result = await this.executeTool(
        integration.id,
        'test_connection',
        {},
        { userId: 'system', priority: 'low', timeout: 5000 }
      );

      if (!result.success) {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${(error as Error).message}`);
    }
  }

  private async checkRateLimit(integration: ToolIntegration): Promise<void> {
    // In a real implementation, this would check against stored rate limit data
    // For demo purposes, we'll simulate rate limit checking
    const now = Date.now();
    const rateLimit = integration.rateLimit;

    // Simulate rate limit check (in reality, this would check Redis or similar)
    if (Math.random() < 0.01) {
      // 1% chance of hitting rate limit
      throw new Error(`Rate limit exceeded for ${integration.name}`);
    }
  }

  private updateUsageStats(
    integration: ToolIntegration,
    success: boolean,
    executionTime: number,
    cost: number
  ): void {
    const stats = integration.usageStats;

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // Update average response time
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.totalRequests - 1) + executionTime) /
      stats.totalRequests;

    stats.totalCost += cost;
    stats.lastUpdated = new Date();

    // Update the stored integration
    this.integrations.set(integration.id, integration);
  }

  // Statistics and Monitoring
  getUsageStatistics(): {
    totalIntegrations: number;
    activeIntegrations: number;
    totalRequests: number;
    successRate: number;
    totalCost: number;
    averageResponseTime: number;
  } {
    const integrations = this.getAllIntegrations();
    const totalRequests = integrations.reduce(
      (sum, int) => sum + int.usageStats.totalRequests,
      0
    );
    const successfulRequests = integrations.reduce(
      (sum, int) => sum + int.usageStats.successfulRequests,
      0
    );
    const totalCost = integrations.reduce(
      (sum, int) => sum + int.usageStats.totalCost,
      0
    );
    const avgResponseTime =
      integrations.reduce(
        (sum, int) => sum + int.usageStats.averageResponseTime,
        0
      ) / integrations.length;

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter((int) => int.isActive).length,
      totalRequests,
      successRate:
        totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      totalCost,
      averageResponseTime: avgResponseTime || 0,
    };
  }

  getCostBreakdown(): Array<{
    integrationId: string;
    name: string;
    cost: number;
    requests: number;
    costPerRequest: number;
  }> {
    return this.getAllIntegrations().map((integration) => ({
      integrationId: integration.id,
      name: integration.name,
      cost: integration.usageStats.totalCost,
      requests: integration.usageStats.totalRequests,
      costPerRequest:
        integration.usageStats.totalRequests > 0
          ? integration.usageStats.totalCost /
            integration.usageStats.totalRequests
          : 0,
    }));
  }
}

// Export singleton instance
export const toolIntegrationManager = new ToolIntegrationManager();

// Export utility functions
export const createIntegration = (
  config: Omit<ToolIntegration, 'id' | 'usageStats' | 'createdAt' | 'updatedAt'>
): ToolIntegration => {
  return {
    ...config,
    id: `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    usageStats: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCost: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const validateIntegrationConfig = (
  integration: Partial<ToolIntegration>
): string[] => {
  const errors: string[] = [];

  if (!integration.name?.trim()) {
    errors.push('Integration name is required');
  }

  if (!integration.type) {
    errors.push('Integration type is required');
  }

  if (!integration.provider?.trim()) {
    errors.push('Provider name is required');
  }

  if (!integration.authentication?.type) {
    errors.push('Authentication type is required');
  }

  return errors;
};
