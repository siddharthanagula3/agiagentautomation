/**
 * Vibe Agent Router
 * Implements intelligent agent selection with keyword matching, semantic analysis, and complexity evaluation
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { vibeComplexityAnalyzer } from './vibe-complexity-analyzer';
import type { AIEmployee } from '@core/types/ai-employee';
import type { VibeMessage } from '../types/vibe-message';
import type {
  AgentMatch,
  RoutingMode,
  RoutingResult,
  SupervisorPlan,
  TaskAssignment,
} from '../types/vibe-agent';

/**
 * VibeAgentRouter
 * Three-stage routing algorithm:
 * 1. Keyword matching (fast path)
 * 2. Semantic analysis (for ambiguous cases)
 * 3. Complexity evaluation (single vs multi-agent)
 */
export class VibeAgentRouter {
  /**
   * Route user message to appropriate agent(s)
   *
   * @param userMessage - The user's request
   * @param conversationHistory - Full conversation context
   * @param hiredEmployees - User's available AI employees
   * @returns RoutingResult with selected agent(s) and execution mode
   */
  async routeMessage(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<RoutingResult> {
    if (hiredEmployees.length === 0) {
      throw new Error('No hired employees available');
    }

    // Stage 1: Keyword matching (fast path)
    const keywordMatch = this.keywordMatch(userMessage, hiredEmployees);

    if (keywordMatch.confidence >= 0.9) {
      // High confidence keyword match - use it directly
      return {
        mode: 'single',
        primaryAgent: keywordMatch.employee,
        confidence: keywordMatch.confidence,
        reasoning: keywordMatch.reasoning,
      };
    }

    // Stage 2: Semantic analysis (for ambiguous cases)
    const semanticMatch = await this.semanticMatch(
      userMessage,
      conversationHistory,
      hiredEmployees
    );

    if (semanticMatch.confidence >= 0.8) {
      return {
        mode: 'single',
        primaryAgent: semanticMatch.employee,
        confidence: semanticMatch.confidence,
        reasoning: semanticMatch.reasoning,
      };
    }

    // Stage 3: Complexity evaluation
    const complexityAnalysis = await vibeComplexityAnalyzer.analyzeComplexity(
      userMessage,
      conversationHistory,
      hiredEmployees
    );

    if (complexityAnalysis.complexity === 'SIMPLE') {
      // Use semantic match for simple tasks
      return {
        mode: 'single',
        primaryAgent: semanticMatch.employee,
        confidence: semanticMatch.confidence,
        reasoning: `Simple task routed to ${semanticMatch.employee.name}. ${complexityAnalysis.reasoning}`,
      };
    }

    // Complex task - create supervisor plan
    const supervisorPlan = await this.createSupervisorPlan(
      userMessage,
      complexityAnalysis.factors.knowledge_domains,
      hiredEmployees
    );

    return {
      mode: 'supervisor',
      supervisorPlan,
      confidence: 0.95,
      reasoning: `Complex task requiring multi-agent orchestration. ${complexityAnalysis.reasoning}`,
    };
  }

  /**
   * Stage 1: Keyword Matching
   * Fast pattern matching against employee descriptions and keywords
   *
   * @private
   */
  private keywordMatch(
    userMessage: string,
    hiredEmployees: AIEmployee[]
  ): AgentMatch {
    const normalizedMessage = userMessage.toLowerCase();

    let bestMatch: AgentMatch = {
      employee: hiredEmployees[0],
      confidence: 0,
      reasoning: 'No match found',
      matched_keywords: [],
    };

    for (const employee of hiredEmployees) {
      const employeeKeywords = this.extractKeywords(employee);
      const matchedKeywords: string[] = [];
      let matchScore = 0;

      // Check each keyword for matches
      for (const keyword of employeeKeywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          // Weight longer keywords higher (more specific)
          matchScore += keyword.length > 5 ? 2 : 1;
        }
      }

      // Calculate confidence based on match score and total keywords
      const confidence =
        employeeKeywords.length > 0
          ? Math.min(matchScore / (employeeKeywords.length * 1.5), 1.0)
          : 0;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          employee,
          confidence,
          reasoning: `Matched ${matchedKeywords.length} keywords: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`,
          matched_keywords: matchedKeywords,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Extract keywords from employee description and name
   *
   * @private
   */
  private extractKeywords(employee: AIEmployee): string[] {
    const keywords: string[] = [];

    // Add keywords from description (words > 4 chars)
    const descWords = employee.description
      .toLowerCase()
      .split(/[\s,.:;]+/)
      .filter((w) => w.length > 4);
    keywords.push(...descWords);

    // Add keywords from name
    const nameWords = employee.name.toLowerCase().split(/[-_\s]+/);
    keywords.push(...nameWords);

    // Add tool names as keywords
    if (employee.tools && Array.isArray(employee.tools)) {
      keywords.push(...employee.tools.map((t) => t.toLowerCase()));
    }

    // Remove common stop words
    const stopWords = new Set([
      'will',
      'with',
      'from',
      'that',
      'this',
      'have',
      'been',
      'were',
      'your',
      'their',
      'about',
      'would',
      'there',
    ]);

    const filtered = keywords.filter((k) => !stopWords.has(k));

    // Remove duplicates
    return [...new Set(filtered)];
  }

  /**
   * Stage 2: Semantic Analysis
   * Uses LLM to understand user intent when keywords are ambiguous
   *
   * @private
   */
  private async semanticMatch(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<AgentMatch> {
    const employeeDescriptions = hiredEmployees
      .map(
        (emp, idx) =>
          `${idx + 1}. ${emp.name}: ${emp.description} (tools: ${emp.tools.join(', ')})`
      )
      .join('\n');

    const recentContext = conversationHistory
      .slice(-3)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You are an intelligent routing system for AI employees. Analyze the user's message and determine which AI employee is best suited to handle it.

User message: "${userMessage}"

${recentContext ? `Recent conversation:\n${recentContext}\n` : ''}

Available employees:
${employeeDescriptions}

Consider:
1. The employee's expertise as described
2. Tools they have access to
3. Context from recent conversation

Respond in JSON format:
{
  "employeeIndex": <number (1-based index)>,
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation of why this employee is best suited>"
}`;

    try {
      const response = await unifiedLLMService.sendMessage([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Validate employee index
      const employeeIndex = result.employeeIndex - 1;
      if (employeeIndex < 0 || employeeIndex >= hiredEmployees.length) {
        throw new Error('Invalid employee index');
      }

      return {
        employee: hiredEmployees[employeeIndex],
        confidence: result.confidence,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error('Semantic matching failed:', error);

      // Fallback to first employee with low confidence
      return {
        employee: hiredEmployees[0],
        confidence: 0.5,
        reasoning: 'Fallback to default employee due to routing error',
      };
    }
  }

  /**
   * Create supervisor execution plan for complex tasks
   *
   * @private
   */
  private async createSupervisorPlan(
    userMessage: string,
    requiredDomains: string[],
    hiredEmployees: AIEmployee[]
  ): Promise<SupervisorPlan> {
    // Find best supervisor (coordinator/manager type employee)
    const supervisor = this.findSupervisor(hiredEmployees);

    // Use LLM to break down task into subtasks
    const tasks = await this.decomposeTask(
      userMessage,
      requiredDomains,
      hiredEmployees
    );

    // Determine execution strategy
    const executionStrategy = this.determineExecutionStrategy(tasks);

    return {
      supervisor,
      tasks,
      execution_strategy: executionStrategy,
    };
  }

  /**
   * Find best supervisor from hired employees
   *
   * @private
   */
  private findSupervisor(hiredEmployees: AIEmployee[]): AIEmployee {
    // Look for employees with supervisor/coordinator keywords
    const supervisorKeywords = [
      'supervisor',
      'coordinator',
      'manager',
      'orchestrator',
      'team lead',
    ];

    const supervisor = hiredEmployees.find((emp) => {
      const empName = emp.name.toLowerCase();
      const empDesc = emp.description.toLowerCase();

      return supervisorKeywords.some(
        (keyword) => empName.includes(keyword) || empDesc.includes(keyword)
      );
    });

    // Fallback to first employee if no supervisor found
    return supervisor || hiredEmployees[0];
  }

  /**
   * Decompose task into subtasks with LLM
   *
   * @private
   */
  private async decomposeTask(
    userMessage: string,
    requiredDomains: string[],
    hiredEmployees: AIEmployee[]
  ): Promise<TaskAssignment[]> {
    const employeeDescriptions = hiredEmployees
      .map((emp) => `- ${emp.name}: ${emp.description}`)
      .join('\n');

    const prompt = `Break down this complex task into specific subtasks that can be assigned to specialists.

Task: "${userMessage}"

Required domains: ${requiredDomains.join(', ')}

Available specialists:
${employeeDescriptions}

For each subtask:
1. Provide a clear description
2. Assign to the most suitable specialist
3. Identify dependencies on other subtasks
4. Set priority (high/medium/low)

Respond in JSON format:
{
  "tasks": [
    {
      "description": "<what needs to be done>",
      "assigned_to": "<employee name>",
      "dependencies": ["<task description it depends on>"],
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

    try {
      const response = await unifiedLLMService.sendMessage([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Updated: Jan 15th 2026 - Fixed any type
      // Convert to TaskAssignment format
      const tasks: TaskAssignment[] = [];
      const taskIdMap = new Map<string, string>();

      result.tasks.forEach(
        (
          task: {
            description: string;
            assigned_to?: string;
            priority?: string;
            dependencies?: string[];
          },
          idx: number
        ) => {
          const taskId = `task-${Date.now()}-${idx}`;
          taskIdMap.set(task.description, taskId);

          const assignedEmployee =
            hiredEmployees.find((emp) => emp.name === task.assigned_to) ||
            hiredEmployees[0];

          tasks.push({
            id: taskId,
            description: task.description,
            assigned_to: assignedEmployee,
            dependencies: [], // Will be populated below
            priority: task.priority || 'medium',
          });
        }
      );

      // Populate dependencies
      result.tasks.forEach(
        (
          task: { description: string; dependencies?: string[] },
          idx: number
        ) => {
          if (task.dependencies && task.dependencies.length > 0) {
            const dependencyIds = task.dependencies
              .map((dep: string) => taskIdMap.get(dep))
              .filter((id: string | undefined) => id !== undefined);

            tasks[idx].dependencies = dependencyIds;
          }
        }
      );

      return tasks;
    } catch (error) {
      console.error('Task decomposition failed:', error);

      // Fallback: Create a single task
      return [
        {
          id: `task-${Date.now()}`,
          description: userMessage,
          assigned_to: hiredEmployees[0],
          dependencies: [],
          priority: 'high',
        },
      ];
    }
  }

  /**
   * Determine execution strategy based on task dependencies
   *
   * @private
   */
  private determineExecutionStrategy(
    tasks: TaskAssignment[]
  ): 'sequential' | 'parallel' | 'mixed' {
    if (tasks.length === 1) {
      return 'sequential';
    }

    // Check if any tasks have dependencies
    const hasDependencies = tasks.some((task) => task.dependencies.length > 0);

    if (!hasDependencies) {
      // All tasks are independent - can run in parallel
      return 'parallel';
    }

    // Mixed: some tasks can run in parallel, others must wait
    return 'mixed';
  }

  /**
   * Context-aware switching
   * Detects when user changes topic mid-conversation
   *
   * @param newMessage - New user message
   * @param currentAgent - Currently active agent
   * @param conversationHistory - Recent conversation
   * @returns True if context switch is detected
   */
  detectContextSwitch(
    newMessage: string,
    currentAgent: AIEmployee,
    conversationHistory: VibeMessage[]
  ): boolean {
    // Extract main topic from new message
    const newTopic = this.extractTopic(newMessage);

    // Get current agent's domain keywords
    const currentDomain = this.extractKeywords(currentAgent);

    // Check if new topic matches current agent's domain
    const topicMatch = currentDomain.some((keyword) =>
      newTopic.toLowerCase().includes(keyword.toLowerCase())
    );

    // Context switch if no match
    return !topicMatch;
  }

  /**
   * Extract main topic from message using simple heuristics
   *
   * @private
   */
  private extractTopic(message: string): string {
    // Remove common stop words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'can',
      'you',
      'help',
      'me',
      'please',
      'could',
      'would',
      'should',
      'will',
      'now',
      'just',
      'also',
      'want',
      'need',
    ]);

    const words = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    // Return first 3 meaningful words as topic
    return words.slice(0, 3).join(' ');
  }

  /**
   * Manual agent selection (when user specifies with # syntax)
   *
   * @param agentName - Name of agent to select
   * @param hiredEmployees - Available employees
   * @returns Selected employee or undefined if not found
   */
  selectManualAgent(
    agentName: string,
    hiredEmployees: AIEmployee[]
  ): AIEmployee | undefined {
    const normalized = agentName.toLowerCase().trim();

    return hiredEmployees.find((emp) => {
      const empName = emp.name.toLowerCase();
      return empName === normalized || empName.includes(normalized);
    });
  }
}

// Export singleton instance
export const vibeAgentRouter = new VibeAgentRouter();
