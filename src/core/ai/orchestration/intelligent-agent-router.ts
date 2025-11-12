/**
 * Intelligent Agent Router
 * Automatically selects the best AI employee(s) to handle user queries
 * Based on expertise matching, keyword analysis, and context understanding
 */

import { AgentCapability } from './agent-collaboration-protocol';

// Expertise taxonomy with keywords
export const ExpertiseTaxonomy: Record<string, string[]> = {
  // Legal & Compliance
  law: ['law', 'legal', 'lawyer', 'attorney', 'contract', 'sue', 'court', 'litigation', 'intellectual property', 'patent', 'trademark', 'copyright', 'compliance', 'regulation', 'rights', 'lawsuit', 'divorce', 'custody', 'criminal', 'civil'],

  // Food & Culinary
  cooking: ['cook', 'recipe', 'food', 'chef', 'kitchen', 'bake', 'baking', 'ingredient', 'meal', 'dish', 'cuisine', 'restaurant', 'eat', 'dinner', 'lunch', 'breakfast', 'dessert', 'vegetarian', 'vegan'],

  // Health & Wellness
  health: ['health', 'medical', 'doctor', 'symptom', 'sick', 'disease', 'medicine', 'treatment', 'pain', 'ache', 'fever', 'cough', 'diagnosis', 'hospital', 'wellness'],

  // Mental Health & Counseling
  mental_health: ['mental health', 'anxiety', 'depression', 'stress', 'therapy', 'counseling', 'therapist', 'psychologist', 'emotional', 'mental wellness', 'panic', 'trauma', 'ptsd', 'self-care', 'mindfulness', 'coping'],

  // Finance & Money
  finance: ['money', 'finance', 'invest', 'stock', 'budget', 'save', 'savings', 'retirement', '401k', 'ira', 'tax', 'loan', 'mortgage', 'credit', 'debt', 'salary', 'portfolio', 'dividend', 'etf', 'mutual fund'],

  // Education & Learning
  education: ['learn', 'study', 'teach', 'tutor', 'homework', 'math', 'science', 'physics', 'chemistry', 'biology', 'history', 'geography', 'test', 'exam', 'sat', 'act', 'gre', 'school', 'university', 'college'],

  // Fitness & Exercise
  fitness: ['fitness', 'exercise', 'workout', 'gym', 'train', 'training', 'muscle', 'strength', 'cardio', 'run', 'running', 'weight', 'lose weight', 'bodybuilding', 'yoga', 'crossfit', 'athlete'],

  // Travel & Tourism
  travel: ['travel', 'trip', 'vacation', 'destination', 'flight', 'hotel', 'tourism', 'visit', 'backpack', 'itinerary', 'tour', 'cruise', 'resort', 'adventure', 'sightseeing'],

  // Career & Jobs
  career: ['job', 'career', 'resume', 'cv', 'interview', 'hire', 'employment', 'work', 'profession', 'linkedin', 'cover letter', 'salary negotiation', 'job search', 'networking'],

  // Software & Technology
  software: ['code', 'coding', 'program', 'programming', 'software', 'developer', 'app', 'application', 'bug', 'debug', 'function', 'class', 'algorithm', 'data structure', 'api', 'frontend', 'backend', 'database', 'javascript', 'python', 'java', 'react', 'node'],

  // Tech Support & Troubleshooting
  tech_support: ['computer', 'laptop', 'pc', 'troubleshoot', 'fix', 'error', 'crash', 'slow', 'virus', 'malware', 'windows', 'mac', 'linux', 'wifi', 'internet', 'printer', 'email', 'password', 'backup', 'update', 'install'],

  // Life Coaching & Personal Development
  life_coaching: ['life coach', 'personal development', 'goals', 'motivation', 'habits', 'productivity', 'confidence', 'self-improvement', 'mindset', 'success', 'purpose', 'transformation', 'change', 'growth'],

  // Home & DIY
  home_improvement: ['home', 'house', 'diy', 'repair', 'fix', 'renovation', 'remodel', 'home improvement', 'maintenance', 'plumbing', 'electrical', 'painting', 'carpentry', 'garden', 'landscaping', 'tools', 'handyman', 'leak', 'faucet', 'wall', 'floor'],

  // DevOps & Infrastructure (specialized tech)
  devops: ['deploy', 'deployment', 'server', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'container', 'ci/cd', 'pipeline', 'infrastructure', 'devops'],

  // QA & Testing (specialized tech)
  testing: ['test', 'testing', 'qa', 'quality assurance', 'bug', 'defect', 'selenium', 'automation', 'unit test', 'integration test', 'e2e'],

  // Design & UX (specialized tech)
  design: ['design', 'ui', 'ux', 'interface', 'user experience', 'wireframe', 'mockup', 'figma', 'prototype', 'typography', 'color', 'layout'],

  // Product Management (specialized tech)
  product: ['product', 'feature', 'requirement', 'user story', 'roadmap', 'prd', 'product manager', 'stakeholder', 'sprint', 'agile'],

  // Architecture (specialized tech)
  architecture: ['architecture', 'system design', 'scalability', 'microservice', 'database design', 'design pattern', 'scalable', 'distributed system'],
};

// Agent role to expertise mapping
export const RoleExpertiseMapping: Record<string, string[]> = {
  // General-purpose AI employees
  'ai-lawyer': ['law'],
  'expert-chef': ['cooking'],
  'health-advisor': ['health'],
  'mental-health-counselor': ['mental_health'],
  'financial-advisor': ['finance'],
  'expert-tutor': ['education'],
  'personal-trainer': ['fitness'],
  'travel-advisor': ['travel'],
  'career-counselor': ['career'],
  'tech-support-specialist': ['tech_support'],
  'life-coach': ['life_coaching'],
  'home-advisor': ['home_improvement'],

  // Specialized tech employees (for advanced software projects)
  'frontend-engineer': ['software', 'design'],
  'backend-engineer': ['software', 'architecture'],
  'code-reviewer': ['software', 'testing'],
  'debugger': ['software', 'testing'],
  'architect': ['architecture', 'software'],
  'senior-software-engineer': ['software', 'architecture'],
  'senior-devops-engineer': ['devops', 'software'],
  'senior-qa-engineer': ['testing', 'software'],
  'senior-ui-ux-designer': ['design', 'software'],
  'product-manager': ['product', 'software'],
  'system-architect': ['architecture', 'software'],
};

export interface RoutingScore {
  agentId: string;
  score: number;
  matchedKeywords: string[];
  confidence: 'high' | 'medium' | 'low';
}

export class IntelligentAgentRouter {
  private agents: Map<string, AgentCapability> = new Map();

  /**
   * Register agents for routing
   */
  registerAgents(agents: AgentCapability[]): void {
    agents.forEach(agent => {
      this.agents.set(agent.agentId, agent);
    });
  }

  /**
   * Analyze query and route to best agent(s)
   */
  routeQuery(
    query: string,
    options: {
      maxAgents?: number;
      minConfidence?: 'high' | 'medium' | 'low';
      allowMultiple?: boolean;
    } = {}
  ): string[] {
    const {
      maxAgents = 3,
      minConfidence = 'low',
      allowMultiple = true,
    } = options;

    // Score all agents
    const scores = this.scoreAllAgents(query);

    // Filter by minimum confidence
    const confidenceThreshold = this.getConfidenceThreshold(minConfidence);
    const qualified = scores.filter(s => s.score >= confidenceThreshold);

    // Sort by score (highest first)
    qualified.sort((a, b) => b.score - a.score);

    // Return agent IDs
    const selected = qualified.slice(0, allowMultiple ? maxAgents : 1);
    return selected.map(s => s.agentId);
  }

  /**
   * Get detailed routing analysis
   */
  analyzeQuery(query: string): RoutingScore[] {
    return this.scoreAllAgents(query);
  }

  /**
   * Score all agents against query
   */
  private scoreAllAgents(query: string): RoutingScore[] {
    const scores: RoutingScore[] = [];
    const normalizedQuery = query.toLowerCase();

    for (const agent of this.agents.values()) {
      const score = this.calculateAgentScore(normalizedQuery, agent);
      scores.push(score);
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate score for a specific agent
   */
  private calculateAgentScore(
    query: string,
    agent: AgentCapability
  ): RoutingScore {
    const matchedKeywords: string[] = [];
    let totalScore = 0;

    // Check agent's explicit expertise keywords
    for (const expertise of agent.expertise) {
      const expertiseKeywords = ExpertiseTaxonomy[expertise] || [expertise];

      for (const keyword of expertiseKeywords) {
        if (query.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);

          // Scoring logic:
          // - Exact word match: +10 points
          // - Partial match: +5 points
          // - First keyword match: Bonus +5 points

          const wordBoundaryRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
          if (wordBoundaryRegex.test(query)) {
            totalScore += 10;
            if (matchedKeywords.length === 1) {
              totalScore += 5; // First match bonus
            }
          } else {
            totalScore += 5;
          }
        }
      }
    }

    // Boost score if agent name is mentioned
    if (query.includes(agent.name.toLowerCase()) ||
        query.includes(`@${agent.agentId}`)) {
      totalScore += 50;
      matchedKeywords.push(`@${agent.name}`);
    }

    // Determine confidence level
    const confidence = this.determineConfidence(totalScore, matchedKeywords.length);

    return {
      agentId: agent.agentId,
      score: totalScore,
      matchedKeywords: [...new Set(matchedKeywords)],
      confidence,
    };
  }

  /**
   * Determine confidence level based on score
   */
  private determineConfidence(
    score: number,
    keywordCount: number
  ): 'high' | 'medium' | 'low' {
    // High confidence: Strong match with multiple keywords
    if (score >= 30 && keywordCount >= 3) return 'high';
    if (score >= 50) return 'high';

    // Medium confidence: Decent match
    if (score >= 15 && keywordCount >= 2) return 'medium';
    if (score >= 20) return 'medium';

    // Low confidence: Weak match
    if (score >= 5) return 'low';

    // No confidence: No match
    return 'low';
  }

  /**
   * Get numeric threshold for confidence level
   */
  private getConfidenceThreshold(confidence: 'high' | 'medium' | 'low'): number {
    switch (confidence) {
      case 'high':
        return 30;
      case 'medium':
        return 15;
      case 'low':
        return 5;
    }
  }

  /**
   * Get agent recommendations with explanations
   */
  getRecommendations(query: string): {
    primary: RoutingScore[];
    alternatives: RoutingScore[];
    explanation: string;
  } {
    const scores = this.analyzeQuery(query);

    const primary = scores.filter(s => s.confidence === 'high').slice(0, 2);
    const alternatives = scores
      .filter(s => s.confidence === 'medium' || s.confidence === 'high')
      .filter(s => !primary.includes(s))
      .slice(0, 3);

    let explanation = '';
    if (primary.length > 0) {
      const agent = this.agents.get(primary[0].agentId);
      explanation = `Based on your query, I recommend **${agent?.name}** (matched keywords: ${primary[0].matchedKeywords.join(', ')}).`;

      if (primary.length > 1) {
        const agent2 = this.agents.get(primary[1].agentId);
        explanation += ` **${agent2?.name}** could also help with this.`;
      }
    } else if (alternatives.length > 0) {
      explanation = `Your query might relate to: ${alternatives.map(a => this.agents.get(a.agentId)?.name).join(', ')}. Could you provide more details?`;
    } else {
      explanation = `I'm not sure which expert would be best for this. Could you rephrase or provide more context?`;
    }

    return {
      primary,
      alternatives,
      explanation,
    };
  }

  /**
   * Check if query needs multiple agents
   */
  needsMultipleAgents(query: string): boolean {
    const scores = this.scoreAllAgents(query);
    const highConfidence = scores.filter(s => s.confidence === 'high');

    // If multiple agents have high confidence, probably needs collaboration
    return highConfidence.length > 1;
  }

  /**
   * Suggest agent based on context
   */
  suggestByContext(context: {
    previousAgent?: string;
    domain?: string;
    complexity?: 'simple' | 'complex';
  }): string[] {
    // If previous agent exists and query is follow-up, stick with same agent
    if (context.previousAgent) {
      return [context.previousAgent];
    }

    // If domain specified, find agents for that domain
    if (context.domain) {
      const domainKeywords = ExpertiseTaxonomy[context.domain] || [];
      return this.routeQuery(domainKeywords.join(' '));
    }

    // For complex queries, suggest generalist or multiple agents
    if (context.complexity === 'complex') {
      return Array.from(this.agents.keys()).slice(0, 3);
    }

    return [];
  }
}

/**
 * Create examples for different query types
 */
export const RoutingExamples = {
  // General-purpose queries
  legal: "I need help reviewing a contract",
  cooking: "How do I make pasta carbonara?",
  health: "I have a persistent headache",
  mental_health: "I've been feeling really anxious lately",
  finance: "Should I invest in index funds or individual stocks?",
  education: "Can you explain quadratic equations?",
  fitness: "Create me a beginner workout plan",
  travel: "Plan a 5-day trip to Tokyo",
  career: "Help me prepare for a job interview",
  tech_support: "My computer is running really slow",
  life_coaching: "I want to change my life but don't know where to start",
  home_improvement: "How do I fix a leaky faucet?",

  // Specialized tech queries
  software: "How do I fix this TypeError in JavaScript?",
  devops: "How do I deploy a Docker container to Kubernetes?",
  testing: "Write unit tests for this function",
  design: "Review my UI design for accessibility",
  product: "Create a PRD for a dark mode feature",
  architecture: "Design a scalable microservices architecture",
};

export default IntelligentAgentRouter;
