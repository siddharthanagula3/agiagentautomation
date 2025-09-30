/**
 * Agent Selector - Intelligently selects the best AI agent for each task
 * Considers agent capabilities, cost, performance, and availability
 */

import { Task, AgentType } from './task-decomposer';
import { IntentType, DomainType, ComplexityLevel } from './nlp-processor';

export interface AgentCapability {
  agentType: AgentType;
  name: string;
  description: string;
  strengths: string[];
  limitations: string[];
  supportedDomains: DomainType[];
  supportedIntents: IntentType[];
  costPerOperation: number; // in cents
  averageResponseTime: number; // in seconds
  reliability: number; // 0-1 score
  maxComplexity: ComplexityLevel;
  tools: string[];
  apiProvider: string;
  model: string;
}

export interface AgentEvaluation {
  agent: AgentType;
  score: number;
  reasons: string[];
  estimatedCost: number;
  estimatedTime: number;
  confidence: number;
}

export interface AgentSelectionResult {
  primaryAgent: AgentType;
  fallbackAgents: AgentType[];
  evaluation: AgentEvaluation[];
  selectionReason: string;
}

/**
 * AgentSelector - Main class for selecting optimal agents
 */
export class AgentSelector {
  private capabilities: Map<AgentType, AgentCapability>;
  private agentPerformance: Map<AgentType, PerformanceMetrics>;

  constructor() {
    this.capabilities = this.initializeCapabilities();
    this.agentPerformance = new Map();
    this.initializePerformanceMetrics();
  }

  /**
   * Select the optimal agent for a given task
   */
  async selectOptimalAgent(task: Task): Promise<AgentSelectionResult> {
    console.log('🤖 Selecting optimal agent for task:', task.title);

    // Get all compatible agents
    const compatibleAgents = this.getCompatibleAgents(task);
    
    // Evaluate each agent
    const evaluations = compatibleAgents.map(agent => 
      this.evaluateAgentFit(task, agent)
    );

    // Sort by score
    const sortedEvaluations = evaluations.sort((a, b) => b.score - a.score);

    // Select primary and fallback agents
    const primaryAgent = sortedEvaluations[0].agent;
    const fallbackAgents = sortedEvaluations.slice(1, 4).map(e => e.agent);

    // Generate selection reason
    const bestEval = sortedEvaluations[0];
    const selectionReason = this.generateSelectionReason(bestEval, task);

    return {
      primaryAgent,
      fallbackAgents,
      evaluation: sortedEvaluations,
      selectionReason
    };
  }

  /**
   * Initialize agent capabilities
   */
  private initializeCapabilities(): Map<AgentType, AgentCapability> {
    const capabilities = new Map<AgentType, AgentCapability>();

    // Claude Code - Best for coding, analysis, and documentation
    capabilities.set('claude-code', {
      agentType: 'claude-code',
      name: 'Claude Code',
      description: 'Advanced AI coding assistant with excellent code understanding',
      strengths: [
        'Code generation and understanding',
        'Debugging and problem solving',
        'Technical documentation',
        'Code review and analysis',
        'Multi-language support',
        'Complex reasoning'
      ],
      limitations: [
        'No direct IDE integration',
        'Cannot execute code directly',
        'Limited to text-based interaction'
      ],
      supportedDomains: ['code', 'data', 'testing', 'automation'],
      supportedIntents: ['create', 'modify', 'analyze', 'debug', 'test'],
      costPerOperation: 2.5,
      averageResponseTime: 3,
      reliability: 0.95,
      maxComplexity: 'expert',
      tools: ['code-analyzer', 'document-generator', 'test-generator'],
      apiProvider: 'anthropic',
      model: 'claude-sonnet-4-20250514'
    });

    // Cursor Agent - Best for IDE operations and real-time coding
    capabilities.set('cursor-agent', {
      agentType: 'cursor-agent',
      name: 'Cursor Agent',
      description: 'IDE-integrated coding agent with real-time file editing',
      strengths: [
        'Direct file manipulation',
        'Real-time code editing',
        'IDE integration',
        'Multi-file changes',
        'Refactoring tools',
        'Fast iterations'
      ],
      limitations: [
        'Requires IDE setup',
        'Limited to coding tasks',
        'Less capable at complex reasoning'
      ],
      supportedDomains: ['code'],
      supportedIntents: ['create', 'modify', 'debug'],
      costPerOperation: 1.5,
      averageResponseTime: 2,
      reliability: 0.90,
      maxComplexity: 'complex',
      tools: ['file-editor', 'code-generator', 'refactoring-tool'],
      apiProvider: 'cursor',
      model: 'cursor-agent-v2'
    });

    // Replit Agent 3 - Best for full-stack development and deployment
    capabilities.set('replit-agent', {
      agentType: 'replit-agent',
      name: 'Replit Agent 3',
      description: 'Full-stack development agent with deployment capabilities',
      strengths: [
        'Complete project creation',
        'Frontend and backend',
        'Deployment automation',
        'Testing integration',
        'Package management',
        'Environment setup'
      ],
      limitations: [
        'Slower for simple tasks',
        'Higher cost per operation',
        'Limited to web technologies'
      ],
      supportedDomains: ['code', 'automation', 'devops'],
      supportedIntents: ['create', 'deploy', 'test'],
      costPerOperation: 3.0,
      averageResponseTime: 5,
      reliability: 0.85,
      maxComplexity: 'expert',
      tools: ['project-generator', 'deployment-manager', 'test-runner'],
      apiProvider: 'replit',
      model: 'replit-agent-3'
    });

    // Gemini CLI - Best for research, analysis, and content
    capabilities.set('gemini-cli', {
      agentType: 'gemini-cli',
      name: 'Gemini CLI',
      description: 'Research and analysis agent with web search capabilities',
      strengths: [
        'Web research',
        'Data analysis',
        'Content generation',
        'Multi-modal understanding',
        'Fast processing',
        'Cost-effective'
      ],
      limitations: [
        'Less capable at coding',
        'Limited tool integrations',
        'Shorter context window'
      ],
      supportedDomains: ['data', 'design', 'content'],
      supportedIntents: ['research', 'analyze', 'create'],
      costPerOperation: 1.0,
      averageResponseTime: 2,
      reliability: 0.88,
      maxComplexity: 'complex',
      tools: ['web-search', 'web-fetch', 'analyzer', 'content-generator'],
      apiProvider: 'google',
      model: 'gemini-2.0-flash'
    });

    // Web Search - Best for gathering information
    capabilities.set('web-search', {
      agentType: 'web-search',
      name: 'Web Search Agent',
      description: 'Specialized agent for web research and information gathering',
      strengths: [
        'Real-time web data',
        'Multiple source aggregation',
        'Fact verification',
        'Current information'
      ],
      limitations: [
        'Cannot process complex logic',
        'Limited to information retrieval',
        'No code execution'
      ],
      supportedDomains: ['data', 'content'],
      supportedIntents: ['research'],
      costPerOperation: 0.5,
      averageResponseTime: 1,
      reliability: 0.92,
      maxComplexity: 'medium',
      tools: ['web-search', 'web-fetch'],
      apiProvider: 'brave',
      model: 'web-search-v1'
    });

    // Bash Executor - Best for system operations
    capabilities.set('bash-executor', {
      agentType: 'bash-executor',
      name: 'Bash Executor',
      description: 'System-level operations and script execution',
      strengths: [
        'Direct system access',
        'Script execution',
        'File operations',
        'Process management'
      ],
      limitations: [
        'Security risks',
        'OS-dependent',
        'No AI reasoning'
      ],
      supportedDomains: ['automation', 'devops'],
      supportedIntents: ['create', 'deploy'],
      costPerOperation: 0.1,
      averageResponseTime: 0.5,
      reliability: 0.98,
      maxComplexity: 'medium',
      tools: ['bash', 'shell'],
      apiProvider: 'system',
      model: 'bash-v1'
    });

    // Puppeteer Agent - Best for browser automation
    capabilities.set('puppeteer-agent', {
      agentType: 'puppeteer-agent',
      name: 'Puppeteer Agent',
      description: 'Browser automation and web scraping specialist',
      strengths: [
        'Browser automation',
        'Web scraping',
        'UI testing',
        'Screenshot capture',
        'Form filling'
      ],
      limitations: [
        'Limited to web tasks',
        'Slower execution',
        'Resource intensive'
      ],
      supportedDomains: ['automation', 'testing'],
      supportedIntents: ['test', 'research'],
      costPerOperation: 1.2,
      averageResponseTime: 4,
      reliability: 0.87,
      maxComplexity: 'complex',
      tools: ['puppeteer', 'web-scraper'],
      apiProvider: 'puppeteer',
      model: 'puppeteer-v1'
    });

    // MCP Tool - Generic tool execution
    capabilities.set('mcp-tool', {
      agentType: 'mcp-tool',
      name: 'MCP Tool Executor',
      description: 'Generic tool execution via Model Context Protocol',
      strengths: [
        'Flexible tool integration',
        'Protocol standardization',
        'Extensible'
      ],
      limitations: [
        'Depends on tool availability',
        'No built-in intelligence'
      ],
      supportedDomains: ['code', 'data', 'automation'],
      supportedIntents: ['create', 'modify', 'analyze'],
      costPerOperation: 0.8,
      averageResponseTime: 2,
      reliability: 0.90,
      maxComplexity: 'complex',
      tools: ['mcp-tools'],
      apiProvider: 'mcp',
      model: 'mcp-v1'
    });

    return capabilities;
  }

  /**
   * Initialize performance metrics for agents
   */
  private initializePerformanceMetrics(): void {
    this.capabilities.forEach((capability, agent) => {
      this.agentPerformance.set(agent, {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageExecutionTime: capability.averageResponseTime,
        totalCost: 0,
        lastUsed: new Date()
      });
    });
  }

  /**
   * Get agents compatible with a task
   */
  private getCompatibleAgents(task: Task): AgentType[] {
    const compatible: AgentType[] = [];

    this.capabilities.forEach((capability, agent) => {
      // Check domain support
      if (!capability.supportedDomains.includes(task.domain)) {
        return;
      }

      // Check intent support
      if (!capability.supportedIntents.includes(task.type)) {
        return;
      }

      // Check complexity level
      const complexityOrder: ComplexityLevel[] = ['simple', 'medium', 'complex', 'expert'];
      const taskComplexityIndex = complexityOrder.indexOf(task.complexity);
      const agentMaxComplexityIndex = complexityOrder.indexOf(capability.maxComplexity);
      
      if (taskComplexityIndex > agentMaxComplexityIndex) {
        return;
      }

      compatible.push(agent);
    });

    return compatible;
  }

  /**
   * Evaluate how well an agent fits a task
   */
  evaluateAgentFit(task: Task, agent: AgentType): AgentEvaluation {
    const capability = this.capabilities.get(agent)!;
    const performance = this.agentPerformance.get(agent)!;

    const reasons: string[] = [];
    let score = 0;

    // Domain match (0-30 points)
    if (capability.supportedDomains.includes(task.domain)) {
      score += 30;
      reasons.push(`Supports ${task.domain} domain`);
    }

    // Intent match (0-25 points)
    if (capability.supportedIntents.includes(task.type)) {
      score += 25;
      reasons.push(`Handles ${task.type} tasks`);
    }

    // Complexity capability (0-20 points)
    const complexityOrder: ComplexityLevel[] = ['simple', 'medium', 'complex', 'expert'];
    const taskComplexityIndex = complexityOrder.indexOf(task.complexity);
    const agentMaxComplexityIndex = complexityOrder.indexOf(capability.maxComplexity);
    const complexityDiff = agentMaxComplexityIndex - taskComplexityIndex;
    
    if (complexityDiff >= 0) {
      score += 20 - (complexityDiff * 3); // Slight penalty for over-qualified agents
      reasons.push(`Can handle ${task.complexity} complexity`);
    }

    // Tool availability (0-10 points)
    const requiredToolsAvailable = task.requiredTools.filter(tool =>
      capability.tools.some(t => t.includes(tool) || tool.includes(t))
    ).length;
    const toolScore = (requiredToolsAvailable / Math.max(task.requiredTools.length, 1)) * 10;
    score += toolScore;
    if (toolScore > 0) {
      reasons.push(`Has ${requiredToolsAvailable}/${task.requiredTools.length} required tools`);
    }

    // Performance history (0-10 points)
    if (performance.totalTasks > 0) {
      const successRate = performance.successfulTasks / performance.totalTasks;
      score += successRate * 10;
      if (successRate > 0.8) {
        reasons.push(`High success rate (${(successRate * 100).toFixed(0)}%)`);
      }
    } else {
      score += 5; // Default score for new agents
    }

    // Reliability (0-5 points)
    score += capability.reliability * 5;
    if (capability.reliability > 0.9) {
      reasons.push('Highly reliable');
    }

    // Cost efficiency (0-5 points - inverse scoring, lower cost = higher score)
    const maxCost = 5.0; // Max expected cost
    const costScore = (1 - (capability.costPerOperation / maxCost)) * 5;
    score += Math.max(0, costScore);
    if (capability.costPerOperation < 2.0) {
      reasons.push('Cost-effective');
    }

    // Speed (0-5 points - inverse scoring, faster = higher score)
    const maxTime = 10; // Max expected time in seconds
    const speedScore = (1 - (capability.averageResponseTime / maxTime)) * 5;
    score += Math.max(0, speedScore);
    if (capability.averageResponseTime < 3) {
      reasons.push('Fast response time');
    }

    // Calculate estimated cost and time
    const estimatedCost = capability.costPerOperation;
    const estimatedTime = capability.averageResponseTime * (task.estimatedTime / 5); // Scale by task complexity

    // Calculate confidence (0-1)
    const confidence = Math.min(score / 100, 1.0);

    return {
      agent,
      score,
      reasons,
      estimatedCost,
      estimatedTime,
      confidence
    };
  }

  /**
   * Get fallback agent when primary agent fails
   */
  fallbackStrategy(task: Task, failedAgent: AgentType, reason: string): AgentType {
    console.log(`⚠️ Agent ${failedAgent} failed for task ${task.id}: ${reason}`);

    // Get all compatible agents except the failed one
    const compatibleAgents = this.getCompatibleAgents(task)
      .filter(agent => agent !== failedAgent);

    if (compatibleAgents.length === 0) {
      // Fall back to Claude Code as universal fallback
      return 'claude-code';
    }

    // Evaluate remaining agents
    const evaluations = compatibleAgents.map(agent =>
      this.evaluateAgentFit(task, agent)
    );

    // Return the best alternative
    const best = evaluations.sort((a, b) => b.score - a.score)[0];
    return best.agent;
  }

  /**
   * Generate human-readable selection reason
   */
  private generateSelectionReason(evaluation: AgentEvaluation, task: Task): string {
    const capability = this.capabilities.get(evaluation.agent)!;
    
    const topReasons = evaluation.reasons.slice(0, 3).join(', ');
    
    return `Selected ${capability.name} because it ${topReasons.toLowerCase()}. ` +
           `Estimated cost: $${(evaluation.estimatedCost / 100).toFixed(2)}, ` +
           `Time: ~${Math.round(evaluation.estimatedTime)}s (confidence: ${(evaluation.confidence * 100).toFixed(0)}%)`;
  }

  /**
   * Update performance metrics after task completion
   */
  updatePerformance(
    agent: AgentType,
    success: boolean,
    executionTime: number,
    cost: number
  ): void {
    const performance = this.agentPerformance.get(agent);
    if (!performance) return;

    performance.totalTasks++;
    if (success) {
      performance.successfulTasks++;
    } else {
      performance.failedTasks++;
    }

    // Update moving average for execution time
    performance.averageExecutionTime = 
      (performance.averageExecutionTime * (performance.totalTasks - 1) + executionTime) / 
      performance.totalTasks;

    performance.totalCost += cost;
    performance.lastUsed = new Date();

    this.agentPerformance.set(agent, performance);
  }

  /**
   * Get performance report for an agent
   */
  getPerformanceReport(agent: AgentType): PerformanceMetrics | undefined {
    return this.agentPerformance.get(agent);
  }

  /**
   * Get all agent capabilities
   */
  getAllCapabilities(): Map<AgentType, AgentCapability> {
    return new Map(this.capabilities);
  }

  /**
   * Check if agent is available/online
   */
  async checkAgentAvailability(agent: AgentType): Promise<boolean> {
    // In a real implementation, this would ping the agent's API
    // For now, return true for all agents
    return true;
  }

  /**
   * Estimate total cost for a task with multiple agents
   */
  estimateTotalCost(tasks: Task[]): number {
    return tasks.reduce((total, task) => {
      const capability = this.capabilities.get(task.requiredAgent);
      if (capability) {
        return total + capability.costPerOperation;
      }
      return total;
    }, 0);
  }
}

interface PerformanceMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  totalCost: number;
  lastUsed: Date;
}

// Export singleton instance
export const agentSelector = new AgentSelector();

// Export utility functions
export function selectAgent(task: Task): Promise<AgentSelectionResult> {
  return agentSelector.selectOptimalAgent(task);
}

export function getFallbackAgent(task: Task, failedAgent: AgentType, reason: string): AgentType {
  return agentSelector.fallbackStrategy(task, failedAgent, reason);
}

export function updateAgentPerformance(
  agent: AgentType,
  success: boolean,
  time: number,
  cost: number
): void {
  agentSelector.updatePerformance(agent, success, time, cost);
}
