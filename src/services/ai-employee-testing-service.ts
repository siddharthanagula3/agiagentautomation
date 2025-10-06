/**
 * AI Employee Testing Service
 * Comprehensive testing system for all AI employee implementations
 * Tests system prompts, tools, and provider-specific optimizations
 */

import { enhancedAIEmployeeService, EmployeeConfig } from '@/services/enhanced-ai-employee-service';
import { getProviderOptimizedPrompt, getAvailableRoles } from '@/prompts/provider-optimized-prompts';
import { getToolsForProvider } from '@/services/provider-tools-integration';

export interface TestResult {
  test: string;
  provider: string;
  role: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

export class AIEmployeeTestingService {
  private testResults: TestResult[] = [];
  
  /**
   * Run comprehensive tests for all providers and roles
   */
  async runAllTests(): Promise<TestSuite[]> {
    const providers: Array<'openai' | 'anthropic' | 'google' | 'perplexity'> = 
      ['openai', 'anthropic', 'google', 'perplexity'];
    
    const testSuites: TestSuite[] = [];
    
    for (const provider of providers) {
      console.log(`🧪 Testing ${provider.toUpperCase()} provider...`);
      
      const suite = await this.runProviderTests(provider);
      testSuites.push(suite);
    }
    
    return testSuites;
  }

  /**
   * Run tests for a specific provider
   */
  async runProviderTests(provider: 'openai' | 'anthropic' | 'google' | 'perplexity'): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];
    
    // Test 1: System Prompt Optimization
    const promptTest = await this.testSystemPromptOptimization(provider);
    tests.push(promptTest);
    
    // Test 2: Tool Integration
    const toolTest = await this.testToolIntegration(provider);
    tests.push(toolTest);
    
    // Test 3: Role-Specific Prompts
    const roleTest = await this.testRoleSpecificPrompts(provider);
    tests.push(roleTest);
    
    // Test 4: Provider-Specific Features
    const featureTest = await this.testProviderSpecificFeatures(provider);
    tests.push(featureTest);
    
    // Test 5: Error Handling
    const errorTest = await this.testErrorHandling(provider);
    tests.push(errorTest);
    
    const duration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.success).length;
    const failedTests = tests.filter(t => !t.success).length;
    
    return {
      name: `${provider.toUpperCase()} Provider Tests`,
      tests,
      totalTests: tests.length,
      passedTests,
      failedTests,
      duration
    };
  }

  /**
   * Test system prompt optimization
   */
  private async testSystemPromptOptimization(provider: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const roles = getAvailableRoles(provider as any);
      let success = true;
      let error: string | undefined;
      
      for (const role of roles) {
        const prompt = getProviderOptimizedPrompt(provider as any, role);
        if (!prompt) {
          success = false;
          error = `No optimized prompt found for role: ${role}`;
          break;
        }
        
        // Validate prompt structure
        if (!prompt.systemPrompt || prompt.systemPrompt.length < 100) {
          success = false;
          error = `Invalid prompt structure for role: ${role}`;
          break;
        }
        
        // Check for provider-specific optimizations
        const hasProviderOptimizations = this.checkProviderOptimizations(provider, prompt);
        if (!hasProviderOptimizations) {
          success = false;
          error = `Missing provider-specific optimizations for ${provider}`;
          break;
        }
      }
      
      return {
        test: 'System Prompt Optimization',
        provider,
        role: 'all',
        success,
        duration: Date.now() - startTime,
        error,
        details: { roles: roles.length }
      };
    } catch (error) {
      return {
        test: 'System Prompt Optimization',
        provider,
        role: 'all',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test tool integration
   */
  private async testToolIntegration(provider: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const tools = getToolsForProvider(provider as any);
      let success = true;
      let error: string | undefined;
      
      if (tools.length === 0) {
        success = false;
        error = 'No tools available for provider';
      } else {
        // Validate tool structure
        for (const tool of tools) {
          if (!tool.name || !tool.description || !tool.parameters) {
            success = false;
            error = `Invalid tool structure: ${tool.name}`;
            break;
          }
        }
      }
      
      return {
        test: 'Tool Integration',
        provider,
        role: 'all',
        success,
        duration: Date.now() - startTime,
        error,
        details: { toolsCount: tools.length }
      };
    } catch (error) {
      return {
        test: 'Tool Integration',
        provider,
        role: 'all',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test role-specific prompts
   */
  private async testRoleSpecificPrompts(provider: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const roles = ['software_engineer', 'data_analyst', 'product_manager'];
      let success = true;
      let error: string | undefined;
      
      for (const role of roles) {
        const prompt = getProviderOptimizedPrompt(provider as any, role);
        if (!prompt) {
          success = false;
          error = `No prompt found for role: ${role}`;
          break;
        }
        
        // Test prompt quality
        const qualityScore = this.assessPromptQuality(prompt.systemPrompt, role);
        if (qualityScore < 0.7) {
          success = false;
          error = `Low quality prompt for role: ${role} (score: ${qualityScore})`;
          break;
        }
      }
      
      return {
        test: 'Role-Specific Prompts',
        provider,
        role: 'multiple',
        success,
        duration: Date.now() - startTime,
        error,
        details: { rolesTested: roles.length }
      };
    } catch (error) {
      return {
        test: 'Role-Specific Prompts',
        provider,
        role: 'multiple',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test provider-specific features
   */
  private async testProviderSpecificFeatures(provider: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      let success = true;
      let error: string | undefined;
      
      switch (provider) {
        case 'openai':
          success = this.testOpenAIFeatures();
          if (!success) error = 'OpenAI-specific features not properly implemented';
          break;
        case 'anthropic':
          success = this.testAnthropicFeatures();
          if (!success) error = 'Anthropic-specific features not properly implemented';
          break;
        case 'google':
          success = this.testGoogleFeatures();
          if (!success) error = 'Google-specific features not properly implemented';
          break;
        case 'perplexity':
          success = this.testPerplexityFeatures();
          if (!success) error = 'Perplexity-specific features not properly implemented';
          break;
        default:
          success = false;
          error = 'Unknown provider';
      }
      
      return {
        test: 'Provider-Specific Features',
        provider,
        role: 'all',
        success,
        duration: Date.now() - startTime,
        error
      };
    } catch (error) {
      return {
        test: 'Provider-Specific Features',
        provider,
        role: 'all',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(provider: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid configuration
      const invalidConfig: EmployeeConfig = {
        employee: {
          id: 'test',
          name: 'Test Employee',
          role: 'invalid_role',
          category: 'test',
          description: 'Test employee',
          provider: provider as any,
          price: 0,
          avatar: '',
          skills: [],
          specialty: 'test',
          fitLevel: 'good'
        }
      };
      
      const result = await enhancedAIEmployeeService.testEmployee(invalidConfig);
      
      return {
        test: 'Error Handling',
        provider,
        role: 'invalid',
        success: !result.success, // Should fail gracefully
        duration: Date.now() - startTime,
        details: { errorHandled: !result.success }
      };
    } catch (error) {
      return {
        test: 'Error Handling',
        provider,
        role: 'invalid',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check provider-specific optimizations
   */
  private checkProviderOptimizations(provider: string, prompt: any): boolean {
    switch (provider) {
      case 'openai':
        return prompt.systemPrompt.includes('function_calls') || 
               prompt.systemPrompt.includes('tools') ||
               prompt.systemPrompt.includes('TOOL USAGE');
      case 'anthropic':
        return prompt.systemPrompt.includes('<role>') || 
               prompt.systemPrompt.includes('<expertise>') ||
               prompt.systemPrompt.includes('<tools>');
      case 'google':
        return prompt.systemPrompt.includes('MULTIMODAL') || 
               prompt.systemPrompt.includes('Image Analysis') ||
               prompt.systemPrompt.includes('analyze_images');
      case 'perplexity':
        return prompt.systemPrompt.includes('web_search') || 
               prompt.systemPrompt.includes('research') ||
               prompt.systemPrompt.includes('current information');
      default:
        return false;
    }
  }

  /**
   * Assess prompt quality
   */
  private assessPromptQuality(prompt: string, role: string): number {
    let score = 0;
    
    // Length check (should be substantial)
    if (prompt.length > 500) score += 0.2;
    
    // Role-specific content
    if (prompt.toLowerCase().includes(role.toLowerCase())) score += 0.2;
    
    // Structure check
    if (prompt.includes('##') || prompt.includes('**') || prompt.includes('<')) score += 0.2;
    
    // Tool usage
    if (prompt.includes('tool') || prompt.includes('function')) score += 0.2;
    
    // Guidelines/instructions
    if (prompt.includes('guideline') || prompt.includes('instruction') || prompt.includes('framework')) score += 0.2;
    
    return Math.min(score, 1);
  }

  /**
   * Test OpenAI-specific features
   */
  private testOpenAIFeatures(): boolean {
    const tools = getToolsForProvider('openai');
    return tools.some(tool => tool.name === 'generate_code' || tool.name === 'analyze_code');
  }

  /**
   * Test Anthropic-specific features
   */
  private testAnthropicFeatures(): boolean {
    const tools = getToolsForProvider('anthropic');
    return tools.some(tool => tool.name === 'generate_code' || tool.name === 'analyze_code');
  }

  /**
   * Test Google-specific features
   */
  private testGoogleFeatures(): boolean {
    const tools = getToolsForProvider('google');
    return tools.some(tool => tool.name === 'analyze_image');
  }

  /**
   * Test Perplexity-specific features
   */
  private testPerplexityFeatures(): boolean {
    const tools = getToolsForProvider('perplexity');
    return tools.some(tool => tool.name === 'web_search' || tool.name === 'research_topic');
  }

  /**
   * Generate test report
   */
  generateTestReport(testSuites: TestSuite[]): string {
    let report = '# AI Employee Testing Report\n\n';
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    for (const suite of testSuites) {
      report += `## ${suite.name}\n\n`;
      report += `- **Total Tests:** ${suite.totalTests}\n`;
      report += `- **Passed:** ${suite.passedTests}\n`;
      report += `- **Failed:** ${suite.failedTests}\n`;
      report += `- **Duration:** ${suite.duration}ms\n`;
      report += `- **Success Rate:** ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%\n\n`;
      
      report += `### Test Details\n\n`;
      for (const test of suite.tests) {
        const status = test.success ? '✅' : '❌';
        report += `- ${status} **${test.test}** (${test.role})\n`;
        if (test.error) {
          report += `  - Error: ${test.error}\n`;
        }
        if (test.details) {
          report += `  - Details: ${JSON.stringify(test.details)}\n`;
        }
        report += `  - Duration: ${test.duration}ms\n\n`;
      }
    }
    
    return report;
  }
}

// Export the testing service
export const aiEmployeeTestingService = new AIEmployeeTestingService();
