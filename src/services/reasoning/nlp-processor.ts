/**
 * NLP Processor - Analyzes user input to understand intent and extract requirements
 * This is the first step in the AI Workforce pipeline
 */

export type IntentType = 'create' | 'modify' | 'analyze' | 'debug' | 'test' | 'deploy' | 'research' | 'optimize';
export type DomainType = 'code' | 'data' | 'design' | 'content' | 'automation' | 'devops' | 'testing';
export type ComplexityLevel = 'simple' | 'medium' | 'complex' | 'expert';

export interface UserIntent {
  type: IntentType;
  domain: DomainType;
  complexity: ComplexityLevel;
  requirements: string[];
  context: Record<string, any>;
  confidence: number;
  estimatedDuration: number; // in minutes
  suggestedAgents: string[];
}

export interface AnalysisResult {
  intent: UserIntent;
  rawInput: string;
  processedInput: string;
  keywords: string[];
  entities: string[];
  timestamp: Date;
}

/**
 * NLPProcessor - Main class for processing natural language input
 */
export class NLPProcessor {
  private intentPatterns: Map<IntentType, RegExp[]>;
  private domainKeywords: Map<DomainType, string[]>;
  private complexityIndicators: Map<ComplexityLevel, string[]>;

  constructor() {
    this.initializePatterns();
  }

  /**
   * Main analysis method - processes user input and returns structured intent
   */
  async analyzeInput(userInput: string): Promise<AnalysisResult> {
    const processedInput = this.preprocessInput(userInput);
    const keywords = this.extractKeywords(processedInput);
    const entities = this.extractEntities(processedInput);
    
    const intentType = this.determineIntent(processedInput, keywords);
    const domain = this.identifyDomain(processedInput, keywords);
    const complexity = this.determineComplexity(processedInput, keywords);
    const requirements = await this.extractRequirements(processedInput, keywords);
    const context = this.buildContext(processedInput, keywords, entities);
    const confidence = this.calculateConfidence(intentType, domain, complexity);
    const estimatedDuration = this.estimateDuration(complexity, requirements.length);
    const suggestedAgents = this.suggestAgents(intentType, domain, complexity);

    const intent: UserIntent = {
      type: intentType,
      domain,
      complexity,
      requirements,
      context,
      confidence,
      estimatedDuration,
      suggestedAgents
    };

    return {
      intent,
      rawInput: userInput,
      processedInput,
      keywords,
      entities,
      timestamp: new Date()
    };
  }

  /**
   * Initialize pattern matching rules for intent detection
   */
  private initializePatterns(): void {
    this.intentPatterns = new Map([
      ['create', [
        /\b(create|build|make|generate|develop|design|implement)\b/i,
        /\b(new|from scratch)\b/i
      ]],
      ['modify', [
        /\b(modify|change|update|edit|refactor|improve|enhance)\b/i,
        /\b(add|remove|replace)\b/i
      ]],
      ['analyze', [
        /\b(analyze|examine|investigate|review|check|inspect)\b/i,
        /\b(what|why|how|explain)\b/i
      ]],
      ['debug', [
        /\b(debug|fix|solve|resolve|troubleshoot)\b/i,
        /\b(error|bug|issue|problem)\b/i
      ]],
      ['test', [
        /\b(test|verify|validate|check)\b/i,
        /\b(unit test|integration test|e2e)\b/i
      ]],
      ['deploy', [
        /\b(deploy|publish|release|launch)\b/i,
        /\b(production|staging|live)\b/i
      ]],
      ['research', [
        /\b(research|find|search|investigate|explore)\b/i,
        /\b(information|data|documentation)\b/i
      ]],
      ['optimize', [
        /\b(optimize|improve|enhance|speed up|make faster)\b/i,
        /\b(performance|efficiency)\b/i
      ]]
    ]);

    this.domainKeywords = new Map([
      ['code', ['code', 'function', 'class', 'component', 'api', 'backend', 'frontend', 'programming', 'script']],
      ['data', ['data', 'database', 'query', 'sql', 'analysis', 'dataset', 'csv', 'json', 'table']],
      ['design', ['design', 'ui', 'ux', 'layout', 'interface', 'mockup', 'wireframe', 'prototype']],
      ['content', ['content', 'text', 'article', 'copy', 'documentation', 'readme', 'blog', 'post']],
      ['automation', ['automation', 'workflow', 'script', 'cron', 'scheduled', 'webhook', 'trigger']],
      ['devops', ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'infrastructure', 'cloud']],
      ['testing', ['test', 'testing', 'qa', 'quality', 'coverage', 'assertion', 'mock', 'stub']]
    ]);

    this.complexityIndicators = new Map([
      ['simple', ['simple', 'basic', 'easy', 'quick', 'small', 'minor']],
      ['medium', ['moderate', 'medium', 'average', 'standard', 'typical']],
      ['complex', ['complex', 'advanced', 'sophisticated', 'large', 'multiple', 'enterprise']],
      ['expert', ['expert', 'professional', 'production-grade', 'scalable', 'distributed', 'microservices']]
    ]);
  }

  /**
   * Preprocess input - clean and normalize the text
   */
  private preprocessInput(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,?!]/g, '');
  }

  /**
   * Extract keywords from the input
   */
  private extractKeywords(input: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return input
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !stopWords.has(word))
      .filter((word, index, self) => self.indexOf(word) === index);
  }

  /**
   * Extract entities (specific things mentioned) from input
   */
  private extractEntities(input: string): string[] {
    const entities: string[] = [];
    
    // Extract file paths
    const filePathRegex = /[a-zA-Z]:[\\/][\w\\/.-]+|\b[\w-]+\.[\w]+\b/g;
    const filePaths = input.match(filePathRegex) || [];
    entities.push(...filePaths);
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = input.match(urlRegex) || [];
    entities.push(...urls);
    
    // Extract tech stack mentions
    const techRegex = /\b(react|vue|angular|node|python|java|typescript|javascript|docker|kubernetes)\b/gi;
    const techMentions = input.match(techRegex) || [];
    entities.push(...techMentions.map(t => t.toLowerCase()));
    
    return [...new Set(entities)];
  }

  /**
   * Determine the user's intent from their input
   */
  private determineIntent(input: string, keywords: string[]): IntentType {
    let maxScore = 0;
    let bestIntent: IntentType = 'create';

    for (const [intent, patterns] of this.intentPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          score += 10;
        }
      }
      
      // Check keywords
      const intentKeywords = keywords.filter(kw => 
        patterns.some(p => p.test(kw))
      );
      score += intentKeywords.length * 5;

      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }

    return bestIntent;
  }

  /**
   * Identify the domain of the task
   */
  private identifyDomain(input: string, keywords: string[]): DomainType {
    let maxScore = 0;
    let bestDomain: DomainType = 'code';

    for (const [domain, domainKeywords] of this.domainKeywords) {
      const matchingKeywords = keywords.filter(kw => 
        domainKeywords.some(dk => kw.includes(dk) || dk.includes(kw))
      );
      
      const score = matchingKeywords.length;
      
      if (score > maxScore) {
        maxScore = score;
        bestDomain = domain;
      }
    }

    return bestDomain;
  }

  /**
   * Determine the complexity level of the task
   */
  private determineComplexity(input: string, keywords: string[]): ComplexityLevel {
    // Check for explicit complexity indicators
    for (const [complexity, indicators] of this.complexityIndicators) {
      for (const indicator of indicators) {
        if (input.includes(indicator)) {
          return complexity;
        }
      }
    }

    // Infer from input length and keyword count
    const wordCount = input.split(/\s+/).length;
    const uniqueKeywords = keywords.length;

    if (wordCount < 10 && uniqueKeywords < 5) return 'simple';
    if (wordCount < 30 && uniqueKeywords < 10) return 'medium';
    if (wordCount < 50 && uniqueKeywords < 15) return 'complex';
    return 'expert';
  }

  /**
   * Extract specific requirements from the input
   */
  private async extractRequirements(input: string, keywords: string[]): Promise<string[]> {
    const requirements: string[] = [];
    
    // Look for explicit requirement patterns
    const requirementPatterns = [
      /need(s)? to (.+?)(?:\.|,|$)/gi,
      /must (.+?)(?:\.|,|$)/gi,
      /should (.+?)(?:\.|,|$)/gi,
      /want(s)? to (.+?)(?:\.|,|$)/gi,
      /require(s)? (.+?)(?:\.|,|$)/gi
    ];

    for (const pattern of requirementPatterns) {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        const requirement = match[1] || match[2];
        if (requirement && requirement.length > 3) {
          requirements.push(requirement.trim());
        }
      }
    }

    // If no explicit requirements found, infer from keywords
    if (requirements.length === 0) {
      requirements.push(`Complete task related to: ${keywords.slice(0, 5).join(', ')}`);
    }

    return [...new Set(requirements)];
  }

  /**
   * Build context object with additional information
   */
  private buildContext(input: string, keywords: string[], entities: string[]): Record<string, any> {
    return {
      hasFileReferences: entities.some(e => e.includes('.') || e.includes('/')),
      hasURLReferences: entities.some(e => e.startsWith('http')),
      technologiesMentioned: entities.filter(e => 
        ['react', 'vue', 'node', 'python', 'docker'].includes(e.toLowerCase())
      ),
      wordCount: input.split(/\s+/).length,
      keywordCount: keywords.length,
      entityCount: entities.length
    };
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(intent: IntentType, domain: DomainType, complexity: ComplexityLevel): number {
    // Base confidence
    let confidence = 0.7;

    // Increase confidence based on pattern matches
    if (intent !== 'create') confidence += 0.1; // Non-default intent found
    if (domain !== 'code') confidence += 0.1; // Non-default domain found
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate task duration based on complexity
   */
  private estimateDuration(complexity: ComplexityLevel, requirementCount: number): number {
    const baseTime: Record<ComplexityLevel, number> = {
      simple: 5,
      medium: 15,
      complex: 30,
      expert: 60
    };

    return baseTime[complexity] + (requirementCount * 2);
  }

  /**
   * Suggest which agents should handle this task
   */
  private suggestAgents(intent: IntentType, domain: DomainType, complexity: ComplexityLevel): string[] {
    const agentMap: Record<string, string[]> = {
      'create-code': ['claude-code', 'cursor-agent', 'replit-agent'],
      'modify-code': ['cursor-agent', 'claude-code'],
      'debug-code': ['claude-code', 'cursor-agent'],
      'test-code': ['claude-code', 'replit-agent'],
      'analyze-data': ['gemini-cli', 'claude-code'],
      'research-any': ['gemini-cli', 'web-search'],
      'deploy-devops': ['replit-agent', 'bash-executor'],
      'design-design': ['gemini-cli', 'claude-code'],
      'automation-automation': ['replit-agent', 'puppeteer-agent']
    };

    const key = `${intent}-${domain}`;
    const agents = agentMap[key] || ['claude-code'];

    // For complex tasks, add research agent
    if (complexity === 'complex' || complexity === 'expert') {
      agents.push('gemini-cli');
    }

    return [...new Set(agents)];
  }

  /**
   * Validate if the input is processable
   */
  validateInput(input: string): { valid: boolean; reason?: string } {
    if (!input || input.trim().length === 0) {
      return { valid: false, reason: 'Input is empty' };
    }

    if (input.length < 3) {
      return { valid: false, reason: 'Input is too short' };
    }

    if (input.length > 5000) {
      return { valid: false, reason: 'Input is too long (max 5000 characters)' };
    }

    return { valid: true };
  }

  /**
   * Get suggestions for improving the input
   */
  getSuggestions(input: string): string[] {
    const suggestions: string[] = [];
    
    if (input.length < 10) {
      suggestions.push('Try providing more details about what you want to accomplish');
    }

    if (!input.includes('?') && !input.includes('.')) {
      suggestions.push('Consider adding specific requirements or questions');
    }

    const hasVerb = this.intentPatterns.get('create')?.some(p => p.test(input)) ||
                    this.intentPatterns.get('modify')?.some(p => p.test(input));
    
    if (!hasVerb) {
      suggestions.push('Start with an action verb (create, build, modify, analyze, etc.)');
    }

    return suggestions;
  }
}

// Export singleton instance
export const nlpProcessor = new NLPProcessor();

// Export utility functions
export function analyzeUserInput(input: string): Promise<AnalysisResult> {
  return nlpProcessor.analyzeInput(input);
}

export function validateUserInput(input: string): { valid: boolean; reason?: string } {
  return nlpProcessor.validateInput(input);
}

export function getUserInputSuggestions(input: string): string[] {
  return nlpProcessor.getSuggestions(input);
}
