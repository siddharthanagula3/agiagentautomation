/**
 * Vibe Complexity Analyzer
 * Analyzes task complexity to determine single vs multi-agent execution
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import type { VibeMessage } from '../types/vibe-message';
import type { AIEmployee } from '@core/types/ai-employee';
import type { ComplexityAnalysis, TaskComplexity } from '../types/vibe-agent';

/**
 * VibeComplexityAnalyzer
 * Determines if a task requires single agent or multi-agent supervisor orchestration
 */
export class VibeComplexityAnalyzer {
  /**
   * Analyze task complexity
   *
   * @param userMessage - The user's request
   * @param conversationHistory - Recent conversation context
   * @param availableEmployees - List of available AI employees
   * @returns ComplexityAnalysis with reasoning and required resources
   */
  async analyzeComplexity(
    userMessage: string,
    conversationHistory: VibeMessage[],
    availableEmployees: AIEmployee[]
  ): Promise<ComplexityAnalysis> {
    // Quick heuristic check first (fast path)
    const heuristicResult = this.heuristicComplexityCheck(userMessage);

    // If very clearly simple, skip LLM call
    if (
      heuristicResult.confidence > 0.9 &&
      heuristicResult.complexity === 'SIMPLE'
    ) {
      return heuristicResult;
    }

    // Use LLM for nuanced analysis
    return await this.llmComplexityAnalysis(
      userMessage,
      conversationHistory,
      availableEmployees
    );
  }

  /**
   * Fast heuristic-based complexity check
   * Uses pattern matching and keyword analysis
   *
   * @private
   */
  private heuristicComplexityCheck(
    userMessage: string
  ): ComplexityAnalysis & { confidence: number } {
    const normalized = userMessage.toLowerCase();

    // Simple task indicators
    const simpleIndicators = [
      'what is',
      'explain',
      'how to',
      'help me',
      'write a',
      'fix this',
      'debug',
      'review',
      'summarize',
      'translate',
      'format',
      'check',
      'find',
    ];

    // Complex task indicators
    const complexIndicators = [
      'build a',
      'create a',
      'develop a',
      'implement a',
      'design and implement',
      'full stack',
      'end to end',
      'complete system',
      'entire',
      'comprehensive',
      'multi-step',
      'integrate',
      'deploy',
      'production ready',
    ];

    const hasSimpleIndicator = simpleIndicators.some((indicator) =>
      normalized.includes(indicator)
    );

    const hasComplexIndicator = complexIndicators.some((indicator) =>
      normalized.includes(indicator)
    );

    // Count steps mentioned
    const stepIndicators =
      normalized.match(
        /\b(first|second|third|then|next|finally|step \d+)\b/g
      ) || [];
    const impliedSteps = stepIndicators.length;

    // Check for multiple domains
    const domains = this.extractDomains(normalized);

    if (hasComplexIndicator || impliedSteps > 3 || domains.length > 2) {
      return {
        complexity: 'COMPLEX',
        reasoning: `Task appears complex due to: ${
          hasComplexIndicator ? 'complex task keywords, ' : ''
        }${impliedSteps > 3 ? `${impliedSteps} steps mentioned, ` : ''}${
          domains.length > 2 ? `multiple domains (${domains.join(', ')})` : ''
        }`,
        confidence: 0.8,
        factors: {
          scope: 'broad',
          steps: Math.max(impliedSteps, 4),
          tools_required: this.inferRequiredTools(normalized),
          knowledge_domains: domains,
        },
      };
    }

    if (hasSimpleIndicator) {
      return {
        complexity: 'SIMPLE',
        reasoning: 'Single focused question or task',
        confidence: 0.95,
        factors: {
          scope: 'narrow',
          steps: 1,
          tools_required: this.inferRequiredTools(normalized),
          knowledge_domains: domains.slice(0, 1),
        },
      };
    }

    // Default to medium confidence
    return {
      complexity: 'SIMPLE',
      reasoning: 'Cannot determine with high confidence - defaulting to simple',
      confidence: 0.6,
      factors: {
        scope: 'narrow',
        steps: 1,
        tools_required: [],
        knowledge_domains: domains,
      },
    };
  }

  /**
   * LLM-based complexity analysis for nuanced cases
   *
   * @private
   */
  private async llmComplexityAnalysis(
    userMessage: string,
    conversationHistory: VibeMessage[],
    availableEmployees: AIEmployee[]
  ): Promise<ComplexityAnalysis> {
    const recentContext = conversationHistory
      .slice(-5)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Analyze this user request and determine its complexity for AI agent task execution.

User request: "${userMessage}"

${recentContext ? `Recent conversation context:\n${recentContext}\n` : ''}

Classify as:
- SIMPLE: Can be handled by a single specialist (e.g., "What are the symptoms of flu?", "Write a professional email", "Fix this bug", "Explain how X works")
- COMPLEX: Requires multiple specialists working together (e.g., "Build a website", "Create a marketing campaign", "Develop a full app", "Design and implement X")

Consider:
1. Number of distinct steps required
2. Number of different skill domains needed
3. Dependencies between subtasks
4. Scope of deliverables

Respond in JSON format:
{
  "complexity": "SIMPLE" | "COMPLEX",
  "reasoning": "<detailed explanation>",
  "factors": {
    "scope": "narrow" | "broad",
    "steps": <number of steps>,
    "tools_required": ["<tool1>", "<tool2>"],
    "knowledge_domains": ["<domain1>", "<domain2>"]
  }
}`;

    try {
      const response = await unifiedLLMService.sendMessage([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        complexity: result.complexity as TaskComplexity,
        reasoning: result.reasoning,
        factors: result.factors,
      };
    } catch (error) {
      console.error('LLM complexity analysis failed:', error);

      // Fallback to heuristic
      return this.heuristicComplexityCheck(userMessage);
    }
  }

  /**
   * Extract knowledge domains from message
   *
   * @private
   */
  private extractDomains(normalizedMessage: string): string[] {
    const domainKeywords = {
      code: [
        'code',
        'programming',
        'bug',
        'debug',
        'function',
        'class',
        'api',
        'software',
        'development',
      ],
      design: [
        'design',
        'ui',
        'ux',
        'interface',
        'mockup',
        'wireframe',
        'visual',
        'layout',
      ],
      data: [
        'data',
        'analytics',
        'chart',
        'graph',
        'sql',
        'database',
        'analysis',
        'statistics',
      ],
      marketing: [
        'marketing',
        'campaign',
        'seo',
        'social media',
        'content',
        'advertising',
        'promotion',
      ],
      writing: [
        'write',
        'document',
        'article',
        'blog',
        'content',
        'copy',
        'draft',
        'email',
      ],
      business: [
        'business',
        'strategy',
        'plan',
        'proposal',
        'revenue',
        'sales',
        'customer',
      ],
      health: [
        'health',
        'medical',
        'healthcare',
        'doctor',
        'patient',
        'diagnosis',
        'treatment',
      ],
      legal: [
        'legal',
        'contract',
        'attorney',
        'law',
        'compliance',
        'regulation',
        'policy',
      ],
      finance: [
        'finance',
        'budget',
        'investment',
        'tax',
        'accounting',
        'financial',
        'money',
      ],
      web: [
        'website',
        'web',
        'frontend',
        'backend',
        'server',
        'deploy',
        'hosting',
      ],
    };

    const foundDomains: string[] = [];

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const hasKeyword = keywords.some((keyword) =>
        normalizedMessage.includes(keyword)
      );

      if (hasKeyword) {
        foundDomains.push(domain);
      }
    }

    return foundDomains.length > 0 ? foundDomains : ['general'];
  }

  /**
   * Infer required tools from message content
   *
   * @private
   */
  private inferRequiredTools(normalizedMessage: string): string[] {
    const tools: string[] = [];

    const toolPatterns = {
      Read: ['read', 'review', 'analyze', 'check', 'examine'],
      Write: ['write', 'create', 'generate', 'draft', 'compose'],
      Bash: ['run', 'execute', 'command', 'script', 'terminal'],
      Edit: ['edit', 'modify', 'change', 'update', 'fix'],
      Grep: ['search', 'find', 'locate', 'grep'],
      Glob: ['list', 'files', 'directory', 'folder'],
      WebSearch: ['search web', 'google', 'online', 'internet', 'web search'],
    };

    for (const [tool, keywords] of Object.entries(toolPatterns)) {
      const hasKeyword = keywords.some((keyword) =>
        normalizedMessage.includes(keyword)
      );

      if (hasKeyword) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Estimate task duration based on complexity
   *
   * @param complexity - The complexity analysis result
   * @returns Estimated duration in seconds
   */
  estimateDuration(complexity: ComplexityAnalysis): number {
    if (complexity.complexity === 'SIMPLE') {
      return 30; // 30 seconds for simple tasks
    }

    // Complex tasks: 5 minutes per step
    const steps = complexity.factors.steps;
    return Math.max(60, steps * 300);
  }

  /**
   * Determine if task needs supervisor orchestration
   *
   * @param complexity - The complexity analysis result
   * @returns True if supervisor is needed
   */
  needsSupervisor(complexity: ComplexityAnalysis): boolean {
    return (
      complexity.complexity === 'COMPLEX' ||
      complexity.factors.knowledge_domains.length > 2 ||
      complexity.factors.steps > 5
    );
  }
}

// Export singleton instance
export const vibeComplexityAnalyzer = new VibeComplexityAnalyzer();
