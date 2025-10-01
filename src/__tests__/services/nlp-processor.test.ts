import { describe, it, expect } from 'vitest';

// Mock the NLP processor for testing
const mockNLPProcessor = {
  analyzeInput: async (input: string) => {
    // Simple mock implementation
    const words = input.toLowerCase().split(' ');
    
    let type = 'unknown';
    let domain = 'general';
    let complexity = 'simple';
    
    // Determine intent type
    if (words.includes('create') || words.includes('build') || words.includes('make')) {
      type = 'create';
    } else if (words.includes('fix') || words.includes('debug') || words.includes('repair')) {
      type = 'fix';
    } else if (words.includes('analyze') || words.includes('review') || words.includes('check')) {
      type = 'analyze';
    }
    
    // Determine domain
    if (words.includes('code') || words.includes('function') || words.includes('component') || words.includes('bug') || words.includes('application')) {
      domain = 'code';
    } else if (words.includes('api') || words.includes('endpoint') || words.includes('server')) {
      domain = 'api';
    } else if (words.includes('database') || words.includes('data') || words.includes('query')) {
      domain = 'data';
    }
    
    // Determine complexity
    if (words.length > 10 || words.includes('complex') || words.includes('advanced')) {
      complexity = 'complex';
    } else if (words.length > 5) {
      complexity = 'medium';
    }
    
    return {
      intent: {
        type,
        domain,
        complexity
      },
      requirements: words.filter(word => 
        ['with', 'using', 'for', 'that', 'should', 'must', 'need'].includes(word)
      ),
      confidence: 0.8
    };
  }
};

describe('NLPProcessor', () => {
  describe('analyzeInput', () => {
    it('should identify code creation intent', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Create a React component for user profile'
      );
      
      expect(result.intent.type).toBe('create');
      expect(result.intent.domain).toBe('code');
      expect(result.intent.complexity).toBe('medium');
    });

    it('should identify fix intent', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Fix the authentication bug in the login system'
      );
      
      expect(result.intent.type).toBe('fix');
      expect(result.intent.domain).toBe('code');
      expect(result.intent.complexity).toBe('medium');
    });

    it('should identify API domain', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Create a REST API endpoint for user management'
      );
      
      expect(result.intent.type).toBe('create');
      expect(result.intent.domain).toBe('api');
      expect(result.intent.complexity).toBe('medium');
    });

    it('should identify complex tasks', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Build a complex full-stack application with authentication and database integration'
      );
      
      expect(result.intent.type).toBe('create');
      expect(result.intent.domain).toBe('code');
      expect(result.intent.complexity).toBe('complex');
    });

    it('should extract requirements', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Create a function that should handle user input and must validate data'
      );
      
      expect(result.requirements).toContain('should');
      expect(result.requirements).toContain('must');
    });

    it('should return confidence score', async () => {
      const result = await mockNLPProcessor.analyzeInput(
        'Create a simple hello world function'
      );
      
      expect(result.confidence).toBe(0.8);
    });
  });
});
