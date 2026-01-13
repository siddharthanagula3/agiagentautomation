/**
 * Multi-Agent Collaboration Service
 * Implements supervisor pattern for complex tasks requiring multiple AI employees
 *
 * Flow:
 * 1. Analyze task complexity
 * 2. For complex tasks: Select multiple employees
 * 3. Employees collaborate (discuss, share ideas)
 * 4. Supervisor synthesizes final comprehensive answer
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import type { AIEmployee } from '@core/types/ai-employee';

export interface CollaborationMessage {
  from: string;
  fromAvatar: string;
  to?: string;
  content: string;
  type: 'discussion' | 'contribution' | 'question' | 'synthesis';
  timestamp: Date;
}

export interface CollaborationResult {
  isComplex: boolean;
  employeesInvolved: AIEmployee[];
  collaborationMessages: CollaborationMessage[];
  finalAnswer: string;
  reasoning: string;
  metadata: {
    totalTokens: number;
    duration: number;
    employeeContributions: Record<string, number>;
  };
}

export interface TaskComplexityAnalysis {
  isComplex: boolean;
  reason: string;
  requiredExpertise: string[];
  estimatedEmployeeCount: number;
}

class MultiAgentCollaborationService {
  private employees: AIEmployee[] = [];
  private employeesLoaded = false;

  /**
   * Initialize and load employees
   */
  async initialize(): Promise<void> {
    if (this.employeesLoaded) return;

    this.employees = await systemPromptsService.getAvailableEmployees();
    this.employeesLoaded = true;
    console.log(
      `[MultiAgentCollaborationService] Loaded ${this.employees.length} employees`
    );
  }

  /**
   * Analyze task complexity to determine if multi-agent collaboration is needed
   */
  async analyzeComplexity(
    userMessage: string
  ): Promise<TaskComplexityAnalysis> {
    const messageLower = userMessage.toLowerCase();

    // Complexity indicators
    const complexityKeywords = [
      'build',
      'create',
      'develop',
      'design',
      'implement',
      'architect',
      'system',
      'platform',
      'application',
      'full',
      'complete',
      'entire',
      'comprehensive',
      'end-to-end',
      'full-stack',
      'production-ready',
    ];

    const multiDomainKeywords = [
      'frontend and backend',
      'ui and api',
      'design and code',
      'security and performance',
      'database and api',
      'test and deploy',
    ];

    const technicalDepthKeywords = [
      'scalable',
      'production',
      'enterprise',
      'distributed',
      'microservices',
      'infrastructure',
      'architecture',
      'deployment',
    ];

    // Check for complexity indicators
    let complexityScore = 0;
    const detectedKeywords: string[] = [];
    const requiredExpertise: string[] = [];

    // Check for build/create keywords
    const hasBuildKeywords = complexityKeywords.some((keyword) => {
      if (messageLower.includes(keyword)) {
        detectedKeywords.push(keyword);
        complexityScore += 2;
        return true;
      }
      return false;
    });

    // Check for multi-domain requirements
    const hasMultiDomain = multiDomainKeywords.some((keyword) => {
      if (messageLower.includes(keyword)) {
        detectedKeywords.push(keyword);
        complexityScore += 3;
        return true;
      }
      return false;
    });

    // Check for technical depth
    const hasTechnicalDepth = technicalDepthKeywords.some((keyword) => {
      if (messageLower.includes(keyword)) {
        detectedKeywords.push(keyword);
        complexityScore += 2;
        return true;
      }
      return false;
    });

    // Analyze required expertise areas
    if (messageLower.match(/frontend|ui|interface|react|component|page/)) {
      requiredExpertise.push('Frontend Development');
    }
    if (messageLower.match(/backend|api|server|endpoint|database/)) {
      requiredExpertise.push('Backend Development');
    }
    if (messageLower.match(/design|ux|ui\/ux|mockup|layout/)) {
      requiredExpertise.push('UI/UX Design');
    }
    if (messageLower.match(/database|sql|schema|data model/)) {
      requiredExpertise.push('Database Design');
    }
    if (messageLower.match(/security|auth|authentication|authorization/)) {
      requiredExpertise.push('Security');
    }
    if (messageLower.match(/test|qa|quality/)) {
      requiredExpertise.push('Testing & QA');
    }
    if (messageLower.match(/deploy|devops|docker|kubernetes|ci\/cd/)) {
      requiredExpertise.push('DevOps');
    }

    // Multiple requirements = complex task
    if (requiredExpertise.length > 1) {
      complexityScore += requiredExpertise.length * 2;
    }

    // Check message length (very detailed requirements = complex)
    const wordCount = userMessage.split(/\s+/).length;
    if (wordCount > 50) {
      complexityScore += 2;
    }

    // Determine if complex
    const isComplex = complexityScore >= 5 || requiredExpertise.length >= 2;
    // Cap at 3 employees for better quality and cost control
    const estimatedEmployeeCount = Math.min(
      Math.max(requiredExpertise.length, 2),
      3
    );

    let reason = '';
    if (isComplex) {
      reason = `Complex task detected: ${detectedKeywords.join(', ')}. `;
      reason += `Requires ${requiredExpertise.length} areas of expertise: ${requiredExpertise.join(', ')}.`;
    } else {
      reason = 'Simple task - can be handled by a single employee.';
    }

    return {
      isComplex,
      reason,
      requiredExpertise,
      estimatedEmployeeCount,
    };
  }

  /**
   * Orchestrate multi-agent collaboration for complex tasks
   */
  async collaborate(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<CollaborationResult> {
    await this.initialize();

    const startTime = Date.now();
    let totalTokens = 0;
    const employeeContributions: Record<string, number> = {};

    // Step 1: Analyze complexity
    const complexity = await this.analyzeComplexity(userMessage);

    // Step 2: Select employees based on required expertise
    const selectedEmployees = await this.selectEmployeesForCollaboration(
      userMessage,
      complexity
    );

    console.log(
      `[Collaboration] Selected ${selectedEmployees.length} employees:`,
      selectedEmployees.map((e) => e.name)
    );

    const collaborationMessages: CollaborationMessage[] = [];
    const employeeResponses: Map<string, string> = new Map();

    // Step 3: Get initial contributions from each employee
    for (const employee of selectedEmployees) {
      const contribution = await this.getEmployeeContribution(
        employee,
        userMessage,
        conversationHistory
      );

      employeeResponses.set(employee.name, contribution.content);
      employeeContributions[employee.name] =
        (employeeContributions[employee.name] || 0) + 1;

      collaborationMessages.push({
        from: employee.name,
        fromAvatar: this.getEmployeeAvatar(employee.name),
        content: contribution.content,
        type: 'contribution',
        timestamp: new Date(),
      });

      totalTokens += contribution.tokensUsed || 0;
    }

    // Step 4: Cross-employee discussion (optional for very complex tasks)
    if (selectedEmployees.length >= 3) {
      // Have employees respond to each other's contributions
      // Use Promise.allSettled to handle failures gracefully without stopping other discussions
      const discussionPromises: Promise<{
        employee: AIEmployee;
        otherEmployee: AIEmployee;
        result: { content: string; tokensUsed?: number };
      }>[] = [];

      for (let i = 0; i < Math.min(selectedEmployees.length - 1, 2); i++) {
        const employee = selectedEmployees[i];
        const otherEmployee = selectedEmployees[i + 1];
        const otherContribution = employeeResponses.get(otherEmployee.name);

        if (otherContribution) {
          discussionPromises.push(
            this.getEmployeeDiscussion(
              employee,
              userMessage,
              otherEmployee.name,
              otherContribution
            ).then((result) => ({ employee, otherEmployee, result }))
          );
        }
      }

      // Wait for all discussions to settle (success or failure)
      const discussionResults = await Promise.allSettled(discussionPromises);

      for (const result of discussionResults) {
        if (result.status === 'fulfilled') {
          const { employee, otherEmployee, result: discussion } = result.value;

          collaborationMessages.push({
            from: employee.name,
            fromAvatar: this.getEmployeeAvatar(employee.name),
            to: otherEmployee.name,
            content: discussion.content,
            type: 'discussion',
            timestamp: new Date(),
          });

          totalTokens += discussion.tokensUsed || 0;
          employeeContributions[employee.name] =
            (employeeContributions[employee.name] || 0) + 1;
        } else {
          // Log failed discussion but continue with other results
          console.warn(
            '[Collaboration] Discussion failed:',
            result.reason
          );
        }
      }
    }

    // Step 5: Supervisor synthesizes final answer
    const synthesis = await this.synthesizeFinalAnswer(
      userMessage,
      selectedEmployees,
      employeeResponses,
      conversationHistory
    );

    collaborationMessages.push({
      from: 'Supervisor',
      fromAvatar: this.getEmployeeAvatar('supervisor'),
      content: synthesis.content,
      type: 'synthesis',
      timestamp: new Date(),
    });

    totalTokens += synthesis.tokensUsed || 0;

    const duration = Date.now() - startTime;

    return {
      isComplex: complexity.isComplex,
      employeesInvolved: selectedEmployees,
      collaborationMessages,
      finalAnswer: synthesis.content,
      reasoning: complexity.reason,
      metadata: {
        totalTokens,
        duration,
        employeeContributions,
      },
    };
  }

  /**
   * Select employees for collaboration based on required expertise
   */
  private async selectEmployeesForCollaboration(
    userMessage: string,
    complexity: TaskComplexityAnalysis
  ): Promise<AIEmployee[]> {
    const messageLower = userMessage.toLowerCase();
    const selected: AIEmployee[] = [];
    const maxEmployees = complexity.estimatedEmployeeCount;

    // Score employees based on relevance
    const scoredEmployees = this.employees.map((employee) => {
      let score = 0;
      const descLower = employee.description.toLowerCase();
      const nameLower = employee.name.toLowerCase();

      // Match expertise areas
      for (const expertise of complexity.requiredExpertise) {
        const expertiseLower = expertise.toLowerCase();
        if (
          descLower.includes(expertiseLower) ||
          nameLower.includes(expertiseLower)
        ) {
          score += 10;
        }
      }

      // Keyword matching
      if (messageLower.includes('frontend') && descLower.includes('frontend'))
        score += 8;
      if (messageLower.includes('backend') && descLower.includes('backend'))
        score += 8;
      if (messageLower.includes('design') && descLower.includes('design'))
        score += 8;
      if (messageLower.includes('database') && descLower.includes('database'))
        score += 8;
      if (messageLower.includes('security') && descLower.includes('security'))
        score += 8;
      if (messageLower.includes('test') && descLower.includes('test'))
        score += 6;

      // Tool availability
      score += employee.tools.length * 0.5;

      return { employee, score };
    });

    // Sort by score and select top N (hard cap at 3 for quality and cost control)
    scoredEmployees.sort((a, b) => b.score - a.score);

    const MAX_EMPLOYEES = 3; // Hard cap at 3 employees
    for (let i = 0; i < Math.min(maxEmployees, scoredEmployees.length, MAX_EMPLOYEES); i++) {
      if (scoredEmployees[i].score > 0) {
        selected.push(scoredEmployees[i].employee);
      }
    }

    // Ensure at least 2 employees for collaboration
    if (selected.length === 0 && this.employees.length >= 2) {
      selected.push(this.employees[0], this.employees[1]);
    } else if (selected.length === 1 && this.employees.length >= 2) {
      const second = this.employees.find((e) => e.name !== selected[0].name);
      if (second) selected.push(second);
    }

    return selected;
  }

  /**
   * Get employee's contribution to the task
   */
  private async getEmployeeContribution(
    employee: AIEmployee,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{ content: string; tokensUsed?: number }> {
    const prompt = `You are collaborating with other AI employees to solve this user request.

User Request: ${userMessage}

Provide your expert contribution based on your specialty: ${employee.description}

Focus on your area of expertise and provide actionable insights. Keep it concise (2-3 paragraphs max).`;

    try {
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [
          { role: 'system', content: employee.systemPrompt },
          ...conversationHistory,
          { role: 'user', content: prompt },
        ],
        model:
          employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : employee.model,
        temperature: 0.7,
        maxTokens: 1000,
      });

      return {
        content: response.content,
        tokensUsed: response.usage?.totalTokens,
      };
    } catch (error) {
      console.error(`Error getting contribution from ${employee.name}:`, error);
      return {
        content: `I'm ${employee.name}, and I'm ready to contribute my expertise in ${employee.description}.`,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get employee's discussion response to another employee's contribution
   */
  private async getEmployeeDiscussion(
    employee: AIEmployee,
    userMessage: string,
    otherEmployeeName: string,
    otherContribution: string
  ): Promise<{ content: string; tokensUsed?: number }> {
    const prompt = `${otherEmployeeName} shared their thoughts on the user's request:

"${otherContribution}"

Based on your expertise in ${employee.description}, provide a brief response or addition to their points. Keep it short (1-2 sentences).`;

    try {
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [
          { role: 'system', content: employee.systemPrompt },
          { role: 'user', content: prompt },
        ],
        model:
          employee.model === 'inherit'
            ? 'claude-3-5-sonnet-20241022'
            : employee.model,
        temperature: 0.7,
        maxTokens: 500,
      });

      return {
        content: response.content,
        tokensUsed: response.usage?.totalTokens,
      };
    } catch (error) {
      console.error(`Error getting discussion from ${employee.name}:`, error);
      return {
        content: `Good points from ${otherEmployeeName}.`,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Supervisor synthesizes all employee contributions into final comprehensive answer
   */
  private async synthesizeFinalAnswer(
    userMessage: string,
    employees: AIEmployee[],
    employeeResponses: Map<string, string>,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{ content: string; tokensUsed?: number }> {
    const contributionsSummary = Array.from(employeeResponses.entries())
      .map(([name, response]) => `**${name}:**\n${response}`)
      .join('\n\n---\n\n');

    const supervisorPrompt = `You are the Supervisor coordinating a team of AI employees to answer this user request.

User Request: ${userMessage}

The following employees have contributed their expertise:

${contributionsSummary}

Your role as Supervisor:
1. Synthesize all contributions into one comprehensive, well-structured answer
2. Organize the information logically
3. Remove redundancies and ensure coherence
4. Provide a complete solution that addresses the user's needs
5. Acknowledge the collaborative effort

Provide the final synthesized answer:`;

    try {
      const response = await unifiedLLMService.sendMessage({
        provider: 'anthropic',
        messages: [
          {
            role: 'system',
            content: `You are an expert supervisor coordinating AI employees. Your role is to synthesize multiple expert contributions into a clear, comprehensive answer.`,
          },
          ...conversationHistory,
          { role: 'user', content: supervisorPrompt },
        ],
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.6,
        maxTokens: 2000,
      });

      return {
        content: response.content,
        tokensUsed: response.usage?.totalTokens,
      };
    } catch (error) {
      console.error('Error synthesizing final answer:', error);

      // Fallback: concatenate all contributions
      const fallback = `# Collaborative Response\n\nOur team has analyzed your request. Here are the combined insights:\n\n${contributionsSummary}\n\nWe hope this collaborative effort helps address your needs!`;

      return {
        content: fallback,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get employee avatar color
   */
  private getEmployeeAvatar(employeeName: string): string {
    if (employeeName === 'supervisor') {
      return '#4f46e5'; // Indigo for supervisor
    }

    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#06b6d4', // cyan
      '#f43f5e', // rose
    ];

    const hash = employeeName.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  }

  /**
   * Get available employees
   */
  async getAvailableEmployees(): Promise<AIEmployee[]> {
    await this.initialize();
    return this.employees;
  }
}

// Export singleton instance
export const multiAgentCollaborationService =
  new MultiAgentCollaborationService();
