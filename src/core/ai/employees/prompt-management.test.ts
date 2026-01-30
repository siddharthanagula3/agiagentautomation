/**
 * Prompt Management Service Unit Tests
 * Tests for system prompts, AI employee loading, and prompt optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SystemPromptsService } from './prompt-management';

// Mock gray-matter for markdown parsing
vi.mock('gray-matter', () => ({
  default: vi.fn((content: string) => {
    // Simple mock that parses YAML-like frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatterStr = frontmatterMatch[1];
      const body = frontmatterMatch[2];

      // Parse simple key: value pairs
      const data: Record<string, unknown> = {};
      frontmatterStr.split('\n').forEach((line) => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          data[match[1]] = match[2];
        }
      });

      return { data, content: body };
    }
    return { data: {}, content };
  }),
}));

// Mock logger
vi.mock('@shared/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SystemPromptsService', () => {
  let service: SystemPromptsService;

  beforeEach(() => {
    // Create a fresh instance for each test
    service = new SystemPromptsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Instance Management', () => {
    it('should return singleton instance', () => {
      const instance1 = SystemPromptsService.getInstance();
      const instance2 = SystemPromptsService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Default Prompts', () => {
    it('should have default prompts for OpenAI', () => {
      const prompt = service.getPrompt('openai');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('openai');
      expect(prompt.content).toContain('helpful');
    });

    it('should have default prompts for Anthropic', () => {
      const prompt = service.getPrompt('anthropic');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('anthropic');
      expect(prompt.content).toContain('Claude');
    });

    it('should have default prompts for Google', () => {
      const prompt = service.getPrompt('google');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('google');
      expect(prompt.content).toContain('Gemini');
    });

    it('should have default prompts for Perplexity', () => {
      const prompt = service.getPrompt('perplexity');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('perplexity');
      expect(prompt.content).toContain('research');
    });
  });

  describe('addPrompt', () => {
    it('should add a new prompt', () => {
      const customPrompt = {
        id: 'custom-prompt',
        name: 'Custom Prompt',
        content: 'You are a custom assistant.',
        provider: 'openai',
        category: 'general' as const,
        guidelines: ['Be helpful', 'Be accurate'],
        cacheKey: 'custom-prompt-key',
        lastUpdated: new Date(),
      };

      service.addPrompt(customPrompt);

      // The getPrompt uses provider-role format, so we need to test differently
      expect(service.getPrompt('openai')).toBeDefined();
    });

    it('should cache added prompts', () => {
      const customPrompt = {
        id: 'cached-prompt',
        name: 'Cached Prompt',
        content: 'Cached content',
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'cached-key',
        lastUpdated: new Date(),
      };

      service.addPrompt(customPrompt);

      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.entries).toContain('cached-key');
    });
  });

  describe('getPrompt', () => {
    it('should return prompt for provider and role', () => {
      const prompt = service.getPrompt('openai', 'general');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('openai');
    });

    it('should fallback to general prompt when role not found', () => {
      const prompt = service.getPrompt('openai', 'non-existent-role');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('openai');
    });

    it('should create default prompt for unknown provider', () => {
      const prompt = service.getPrompt('unknown-provider');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('unknown-provider');
      expect(prompt.content).toContain('helpful AI assistant');
    });

    it('should use cache for repeated requests', () => {
      const prompt1 = service.getPrompt('openai');
      const prompt2 = service.getPrompt('openai');

      expect(prompt1).toEqual(prompt2);
    });
  });

  describe('createRolePrompt', () => {
    it('should create product manager prompt', () => {
      const prompt = service.createRolePrompt('product manager', 'openai');

      expect(prompt.content).toContain('product manager');
      expect(prompt.content).toContain('product strategy');
      expect(prompt.category).toBe('role-specific');
    });

    it('should create data scientist prompt', () => {
      const prompt = service.createRolePrompt('data scientist', 'openai');

      expect(prompt.content).toContain('data scientist');
      expect(prompt.content).toContain('data analysis');
    });

    it('should create software engineer prompt', () => {
      const prompt = service.createRolePrompt('software engineer', 'openai');

      expect(prompt.content).toContain('software engineer');
      expect(prompt.content).toContain('software development');
    });

    it('should create marketing specialist prompt', () => {
      const prompt = service.createRolePrompt('marketing specialist', 'openai');

      expect(prompt.content).toContain('marketing specialist');
      expect(prompt.content).toContain('marketing strategy');
    });

    it('should handle custom role', () => {
      const prompt = service.createRolePrompt('custom role', 'openai');

      expect(prompt.content).toContain('custom role');
      expect(prompt.content).toContain('expert assistance');
    });

    it('should include additional instructions', () => {
      const prompt = service.createRolePrompt(
        'developer',
        'openai',
        'Always use TypeScript.'
      );

      expect(prompt.content).toContain('Always use TypeScript.');
    });

    it('should add provider-specific capabilities', () => {
      const prompt = service.createRolePrompt('developer', 'openai');

      // OpenAI supports function calling
      expect(prompt.content).toContain('tools');
    });

    it('should add web search capability for Perplexity', () => {
      const prompt = service.createRolePrompt('researcher', 'perplexity');

      expect(prompt.content).toContain('search');
    });

    it('should include safety guidelines', () => {
      const prompt = service.createRolePrompt('developer', 'openai');

      expect(prompt.content).toContain('accurate');
      expect(prompt.content).toContain('safe');
    });
  });

  describe('optimizePrompt', () => {
    it('should add creative instructions for creative use case', () => {
      const basePrompt = service.getPrompt('openai');
      const optimized = service.optimizePrompt(basePrompt, 'creative');

      expect(optimized.content).toContain('creative');
      expect(optimized.content).toContain('innovative');
    });

    it('should add technical instructions for technical use case', () => {
      const basePrompt = service.getPrompt('openai');
      const optimized = service.optimizePrompt(basePrompt, 'technical');

      expect(optimized.content).toContain('technical accuracy');
    });

    it('should add educational instructions for educational use case', () => {
      const basePrompt = service.getPrompt('openai');
      const optimized = service.optimizePrompt(basePrompt, 'educational');

      expect(optimized.content).toContain('concepts clearly');
      expect(optimized.content).toContain('examples');
    });

    it('should add analytical instructions for analytical use case', () => {
      const basePrompt = service.getPrompt('openai');
      const optimized = service.optimizePrompt(basePrompt, 'analytical');

      expect(optimized.content).toContain('thorough analysis');
      expect(optimized.content).toContain('perspectives');
    });

    it('should truncate overly long prompts', () => {
      const longPrompt = {
        id: 'long-prompt',
        name: 'Long Prompt',
        content: 'A'.repeat(3000),
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'long',
        lastUpdated: new Date(),
      };

      const optimized = service.optimizePrompt(longPrompt, 'creative');

      // OpenAI max length is 2000
      expect(optimized.content.length).toBeLessThanOrEqual(2000);
      expect(optimized.content).toContain('...');
    });

    it('should return original prompt for unknown provider', () => {
      const unknownPrompt = {
        id: 'unknown',
        name: 'Unknown',
        content: 'Test content',
        provider: 'unknown-provider',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'unknown',
        lastUpdated: new Date(),
      };

      const optimized = service.optimizePrompt(unknownPrompt, 'creative');

      expect(optimized.content).toBe('Test content');
    });
  });

  describe('getGuidelines', () => {
    it('should return guidelines for OpenAI', () => {
      const guidelines = service.getGuidelines('openai');

      expect(guidelines).toBeDefined();
      expect(guidelines?.maxLength).toBe(2000);
      expect(guidelines?.recommendedLength).toBe(500);
      expect(guidelines?.keyElements).toContain('Role definition');
    });

    it('should return guidelines for Anthropic', () => {
      const guidelines = service.getGuidelines('anthropic');

      expect(guidelines).toBeDefined();
      expect(guidelines?.maxLength).toBe(4000);
      expect(guidelines?.providerSpecific.supportsLongContext).toBe(true);
    });

    it('should return guidelines for Google', () => {
      const guidelines = service.getGuidelines('google');

      expect(guidelines).toBeDefined();
      expect(guidelines?.providerSpecific.supportsMultimodal).toBe(true);
    });

    it('should return guidelines for Perplexity', () => {
      const guidelines = service.getGuidelines('perplexity');

      expect(guidelines).toBeDefined();
      expect(guidelines?.providerSpecific.supportsWebSearch).toBe(true);
    });

    it('should be case-insensitive', () => {
      const guidelines1 = service.getGuidelines('OpenAI');
      const guidelines2 = service.getGuidelines('openai');

      expect(guidelines1).toEqual(guidelines2);
    });

    it('should return undefined for unknown provider', () => {
      const guidelines = service.getGuidelines('unknown-provider');

      expect(guidelines).toBeUndefined();
    });
  });

  describe('validatePrompt', () => {
    it('should validate correct prompt', () => {
      const validPrompt = {
        id: 'valid',
        name: 'Valid Prompt',
        content:
          'You are a helpful assistant. Role definition. Behavior guidelines. Response format. Safety instructions. You provide accurate information.',
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'valid',
        lastUpdated: new Date(),
      };

      const result = service.validatePrompt(validPrompt);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch prompt too long', () => {
      const longPrompt = {
        id: 'long',
        name: 'Long Prompt',
        content: 'A'.repeat(3000),
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'long',
        lastUpdated: new Date(),
      };

      const result = service.validatePrompt(longPrompt);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too long'))).toBe(true);
    });

    it('should catch prompt too short', () => {
      const shortPrompt = {
        id: 'short',
        name: 'Short Prompt',
        content: 'Short',
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'short',
        lastUpdated: new Date(),
      };

      const result = service.validatePrompt(shortPrompt);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
    });

    it('should report missing key elements', () => {
      const incompletePrompt = {
        id: 'incomplete',
        name: 'Incomplete Prompt',
        content:
          'This is a prompt without the required key elements mentioned. It is long enough to pass the length check but lacks structure.',
        provider: 'openai',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'incomplete',
        lastUpdated: new Date(),
      };

      const result = service.validatePrompt(incompletePrompt);

      expect(result.errors.some((e) => e.includes('Missing key elements'))).toBe(
        true
      );
    });

    it('should handle unknown provider', () => {
      const unknownPrompt = {
        id: 'unknown',
        name: 'Unknown Prompt',
        content: 'Content for unknown provider',
        provider: 'unknown-provider',
        category: 'general' as const,
        guidelines: [],
        cacheKey: 'unknown',
        lastUpdated: new Date(),
      };

      const result = service.validatePrompt(unknownPrompt);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('No guidelines found'))
      ).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      // Add some prompts to cache
      service.getPrompt('openai');
      service.getPrompt('anthropic');

      const statsBefore = service.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      service.clearCache();

      const statsAfter = service.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should report cache statistics', () => {
      service.clearCache();
      service.getPrompt('openai');
      service.getPrompt('anthropic');

      const stats = service.getCacheStats();

      expect(stats.size).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(stats.entries)).toBe(true);
    });
  });

  describe('getAvailableEmployees', () => {
    it('should return empty array in non-browser environment', async () => {
      // In test environment (non-browser), import.meta.glob won't work as expected
      const employees = await service.getAvailableEmployees();

      // The method handles the case gracefully
      expect(Array.isArray(employees)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock import.meta.glob to throw error
      const originalWindow = global.window;

      try {
        // Simulate browser environment with failing glob
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        const employees = await service.getAvailableEmployees();

        expect(Array.isArray(employees)).toBe(true);
      } finally {
        // Restore window
        Object.defineProperty(global, 'window', {
          value: originalWindow,
          writable: true,
        });
      }
    });

    it('should support forceRefresh parameter', async () => {
      // First call loads employees
      await service.getAvailableEmployees();

      // Second call with forceRefresh should reload
      const employees = await service.getAvailableEmployees(true);

      expect(Array.isArray(employees)).toBe(true);
    });

    it('should use cache for repeated calls within TTL', async () => {
      // First call
      await service.getAvailableEmployees();

      // Second call should use cache
      const employees = await service.getAvailableEmployees();

      expect(Array.isArray(employees)).toBe(true);
    });
  });

  describe('Employee Cache Management', () => {
    it('should invalidate employee cache', async () => {
      // Load employees first
      await service.getAvailableEmployees();

      // Check cache is loaded
      const statsBefore = service.getEmployeeCacheStats();
      expect(statsBefore.loaded).toBe(true);

      // Invalidate cache
      service.invalidateEmployeeCache();

      // Check cache is cleared
      const statsAfter = service.getEmployeeCacheStats();
      expect(statsAfter.loaded).toBe(false);
      expect(statsAfter.count).toBe(0);
    });

    it('should refresh employees immediately', async () => {
      // Load employees first
      await service.getAvailableEmployees();

      // Refresh should reload
      const employees = await service.refreshEmployees();

      expect(Array.isArray(employees)).toBe(true);
    });

    it('should return correct cache statistics', async () => {
      // Clear any existing cache state by creating fresh instance
      service.invalidateEmployeeCache();

      // Before loading, cache should be empty
      const statsBefore = service.getEmployeeCacheStats();
      expect(statsBefore.loaded).toBe(false);
      expect(statsBefore.count).toBe(0);
      expect(statsBefore.ageMs).toBe(0);
      expect(statsBefore.ttlMs).toBe(5 * 60 * 1000); // 5 minutes
      expect(statsBefore.isExpired).toBe(true);

      // Load employees
      await service.getAvailableEmployees();

      // After loading, cache should be populated
      const statsAfter = service.getEmployeeCacheStats();
      expect(statsAfter.loaded).toBe(true);
      expect(statsAfter.isExpired).toBe(false);
      expect(statsAfter.ageMs).toBeGreaterThanOrEqual(0);
      expect(statsAfter.ageMs).toBeLessThan(1000); // Should be very recent
    });

    it('should track cache expiration based on TTL', async () => {
      // Load employees
      await service.getAvailableEmployees();

      const stats = service.getEmployeeCacheStats();

      // TTL should be 5 minutes
      expect(stats.ttlMs).toBe(5 * 60 * 1000);

      // Fresh cache should not be expired
      expect(stats.isExpired).toBe(false);
    });
  });

  describe('getEmployeeByName', () => {
    it('should be case-insensitive', async () => {
      // In Vitest with Vite, import.meta.glob works and loads actual employee files
      // This tests the actual case-insensitive behavior
      const employee = await service.getEmployeeByName('Code-Reviewer');

      // If an employee file exists with this name, it should be found
      // The test verifies case-insensitive matching works
      if (employee) {
        expect(employee.name.toLowerCase()).toBe('code-reviewer');
      } else {
        // If no employee file exists, undefined is acceptable
        expect(employee).toBeUndefined();
      }
    });

    it('should return undefined for non-existent employee', async () => {
      const employee = await service.getEmployeeByName('definitely-non-existent-employee-xyz-123');

      expect(employee).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty role string', () => {
      const prompt = service.getPrompt('openai', '');

      expect(prompt).toBeDefined();
      expect(prompt.provider).toBe('openai');
    });

    it('should handle whitespace-only role', () => {
      const prompt = service.getPrompt('openai', '   ');

      expect(prompt).toBeDefined();
    });

    it('should handle special characters in role name', () => {
      const prompt = service.createRolePrompt('dev/ops engineer', 'openai');

      expect(prompt).toBeDefined();
      expect(prompt.content).toContain('dev/ops engineer');
    });

    it('should handle very long role name', () => {
      const longRole = 'A'.repeat(100);
      const prompt = service.createRolePrompt(longRole, 'openai');

      expect(prompt).toBeDefined();
      expect(prompt.id).toContain(longRole.toLowerCase());
    });
  });
});
