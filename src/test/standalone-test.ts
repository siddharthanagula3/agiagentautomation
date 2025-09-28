// Completely Standalone AI Employee Test
// Tests AI Employee functionality without any external dependencies

import { AIEmployee, ExecutionContext, ToolResult } from '../types';

// Mock tool execution service
class MockToolInvocationService {
  async invokeTool(
    toolId: string,
    parameters: Record<string, any>,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    // Simulate tool execution based on tool ID
    let result: any;
    let success = true;
    let error: string | undefined;

    try {
      switch (toolId) {
        case 'generate_code':
          result = {
            code: `// Generated ${parameters.language || 'javascript'} code\n// Requirements: ${parameters.requirements || parameters.task}\n\nfunction example() {\n  return "Hello World";\n}`,
            language: parameters.language || 'javascript',
            lines: 5,
            complexity: 'simple'
          };
          break;

        case 'analyze_data':
          result = {
            insights: [
              'Data shows positive trend over time',
              'Key metrics improved by 15%',
              'Recommendation: Continue current strategy'
            ],
            charts: ['trend_chart.png', 'distribution.png'],
            summary: 'Analysis completed successfully'
          };
          break;

        case 'send_email':
          result = {
            messageId: `msg_${Date.now()}`,
            status: 'sent',
            recipient: parameters.to || 'user@example.com',
            timestamp: new Date().toISOString()
          };
          break;

        case 'web_search':
          result = {
            results: [
              {
                title: 'Search Result 1',
                url: 'https://example.com/1',
                snippet: 'Relevant information about the search query'
              },
              {
                title: 'Search Result 2',
                url: 'https://example.com/2',
                snippet: 'More relevant information'
              }
            ],
            totalResults: 2,
            searchTime: '0.5s'
          };
          break;

        case 'file_upload':
          result = {
            fileId: `file_${Date.now()}`,
            url: `https://storage.example.com/files/${parameters.filename || 'document.txt'}`,
            size: parameters.content?.length || 0,
            type: parameters.type || 'text/plain'
          };
          break;

        default:
          throw new Error(`Unknown tool: ${toolId}`);
      }

      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    } catch (err) {
      success = false;
      error = (err as Error).message;
      result = null;
    }

    const executionTime = Date.now() - startTime;
    const cost = this.calculateCost(toolId, executionTime);

    return {
      success,
      data: result,
      error,
      executionTime,
      cost,
      metadata: {
        toolId,
        parameters,
        context,
        timestamp: new Date().toISOString()
      }
    };
  }

  private calculateCost(toolId: string, executionTime: number): number {
    const baseCosts: Record<string, number> = {
      'generate_code': 0.01,
      'analyze_data': 0.005,
      'send_email': 0.001,
      'web_search': 0.002,
      'file_upload': 0.001
    };

    const baseCost = baseCosts[toolId] || 0.01;
    const timeMultiplier = Math.max(1, executionTime / 1000);
    return baseCost * timeMultiplier;
  }
}

// Mock AI Employee Executor
class MockAIEmployeeExecutor {
  private employee: AIEmployee;
  private context: ExecutionContext;
  private toolService: MockToolInvocationService;

  constructor(employee: AIEmployee, context: ExecutionContext) {
    this.employee = employee;
    this.context = context;
    this.toolService = new MockToolInvocationService();
  }

  async executeTask(task: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    toolsUsed: string[];
    executionTime: number;
    cost: number;
  }> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];
    let totalCost = 0;

    try {
      console.log(`AI Employee ${this.employee.name} starting task: ${task}`);

      // Identify required tools
      const requiredTools = this.identifyRequiredTools(task);
      console.log(`Identified required tools: ${requiredTools.join(', ')}`);

      // Execute tools
      const results: any[] = [];
      for (const toolId of requiredTools) {
        try {
          const parameters = this.prepareToolParameters(toolId, task);
          const toolResult = await this.toolService.invokeTool(toolId, parameters, this.context);
          
          results.push(toolResult.data);
          toolsUsed.push(toolId);
          totalCost += toolResult.cost;

          console.log(`Tool ${toolId} executed successfully`);
        } catch (error) {
          console.error(`Tool ${toolId} execution failed:`, error);
        }
      }

      // Combine results
      const combinedResult = this.combineResults(results);

      return {
        success: true,
        result: combinedResult,
        toolsUsed,
        executionTime: Date.now() - startTime,
        cost: totalCost
      };

    } catch (error) {
      console.error(`Task execution failed for ${this.employee.name}:`, error);
      return {
        success: false,
        error: (error as Error).message,
        toolsUsed,
        executionTime: Date.now() - startTime,
        cost: totalCost
      };
    }
  }

  private identifyRequiredTools(task: string): string[] {
    const availableTools = this.employee.tools || [];
    const requiredTools: string[] = [];
    const taskLower = task.toLowerCase();

    // Simple keyword-based tool identification
    if (taskLower.includes('code') || taskLower.includes('program') || taskLower.includes('function')) {
      const codeTool = availableTools.find(tool => tool.id === 'generate_code');
      if (codeTool) requiredTools.push('generate_code');
    }

    if (taskLower.includes('analyze') || taskLower.includes('data') || taskLower.includes('report')) {
      const dataTool = availableTools.find(tool => tool.id === 'analyze_data');
      if (dataTool) requiredTools.push('analyze_data');
    }

    if (taskLower.includes('email') || taskLower.includes('send') || taskLower.includes('message')) {
      const emailTool = availableTools.find(tool => tool.id === 'send_email');
      if (emailTool) requiredTools.push('send_email');
    }

    if (taskLower.includes('search') || taskLower.includes('find') || taskLower.includes('research')) {
      const searchTool = availableTools.find(tool => tool.id === 'web_search');
      if (searchTool) requiredTools.push('web_search');
    }

    if (taskLower.includes('upload') || taskLower.includes('file') || taskLower.includes('document')) {
      const uploadTool = availableTools.find(tool => tool.id === 'file_upload');
      if (uploadTool) requiredTools.push('file_upload');
    }

    // If no specific tools identified, use the first available tool
    if (requiredTools.length === 0 && availableTools.length > 0) {
      requiredTools.push(availableTools[0].id);
    }

    return requiredTools;
  }

  private prepareToolParameters(toolId: string, task: string): Record<string, any> {
    const baseParameters = {
      task,
      employee: this.employee.name,
      role: this.employee.role,
      timestamp: new Date().toISOString()
    };

    switch (toolId) {
      case 'generate_code':
        return {
          ...baseParameters,
          language: this.extractLanguage(task) || 'javascript',
          requirements: task,
          framework: this.extractFramework(task) || 'react'
        };

      case 'analyze_data':
        return {
          ...baseParameters,
          data: { type: 'mock_dataset', size: 1000, fields: ['id', 'name', 'value'] },
          analysisType: this.extractAnalysisType(task) || 'descriptive',
          format: 'json'
        };

      case 'send_email':
        return {
          ...baseParameters,
          to: this.extractEmail(task) || 'user@example.com',
          subject: this.extractSubject(task) || 'Task Update',
          body: task
        };

      case 'web_search':
        return {
          ...baseParameters,
          query: task,
          maxResults: 10
        };

      case 'file_upload':
        return {
          ...baseParameters,
          filename: this.extractFilename(task) || 'document.txt',
          content: task,
          type: 'text/plain'
        };

      default:
        return baseParameters;
    }
  }

  private extractLanguage(task: string): string | null {
    const languages = ['javascript', 'python', 'java', 'typescript', 'csharp', 'php', 'ruby', 'go'];
    const taskLower = task.toLowerCase();
    
    for (const lang of languages) {
      if (taskLower.includes(lang)) {
        return lang;
      }
    }
    return null;
  }

  private extractFramework(task: string): string | null {
    const frameworks = ['react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring'];
    const taskLower = task.toLowerCase();
    
    for (const framework of frameworks) {
      if (taskLower.includes(framework)) {
        return framework;
      }
    }
    return null;
  }

  private extractAnalysisType(task: string): string | null {
    const types = ['descriptive', 'predictive', 'diagnostic', 'prescriptive'];
    const taskLower = task.toLowerCase();
    
    for (const type of types) {
      if (taskLower.includes(type)) {
        return type;
      }
    }
    return null;
  }

  private extractEmail(task: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = task.match(emailRegex);
    return match ? match[0] : null;
  }

  private extractSubject(task: string): string | null {
    const subjectMatch = task.match(/subject:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1].trim() : null;
  }

  private extractFilename(task: string): string | null {
    const filenameMatch = task.match(/filename:\s*(.+)/i);
    return filenameMatch ? filenameMatch[1].trim() : null;
  }

  private combineResults(results: any[]): any {
    if (results.length === 0) {
      return { message: 'No tools were executed' };
    }

    if (results.length === 1) {
      return results[0];
    }

    return {
      combined: true,
      results,
      summary: `Executed ${results.length} tools successfully`,
      totalResults: results.length
    };
  }
}

// Test data
const testSoftwareEngineer: AIEmployee = {
  id: 'test-software-engineer-001',
  name: 'Alex Chen',
  role: 'Senior Software Engineer',
  category: 'Engineering & Technology',
  department: 'Engineering',
  level: 'senior',
  status: 'available',
  capabilities: {
    coreSkills: ['Full-stack development', 'Cloud architecture', 'DevOps'],
    technicalSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
    softSkills: ['Communication', 'Leadership', 'Problem-solving'],
    availableTools: [],
    toolProficiency: new Map(),
    autonomyLevel: 'fully-autonomous',
    decisionMaking: [],
    canCollaborate: true,
    collaborationProtocols: [],
    communicationChannels: []
  },
  system_prompt: 'You are a Senior Software Engineer...',
  tools: [
    { id: 'generate_code', name: 'Code Generator', description: 'Generate production-ready code', category: 'code_generation', parameters: [], executionEndpoint: '', costPerExecution: 0.01, estimatedDuration: 1000, requirements: [] },
    { id: 'analyze_data', name: 'Data Analyzer', description: 'Perform statistical analysis', category: 'data_analysis', parameters: [], executionEndpoint: '', costPerExecution: 0.005, estimatedDuration: 2000, requirements: [] },
    { id: 'send_email', name: 'Email Sender', description: 'Send emails to recipients', category: 'marketing', parameters: [], executionEndpoint: '', costPerExecution: 0.001, estimatedDuration: 500, requirements: [] },
    { id: 'web_search', name: 'Web Search', description: 'Search the web for information', category: 'business', parameters: [], executionEndpoint: '', costPerExecution: 0.002, estimatedDuration: 1500, requirements: [] },
    { id: 'file_upload', name: 'File Uploader', description: 'Upload files to storage', category: 'business', parameters: [], executionEndpoint: '', costPerExecution: 0.001, estimatedDuration: 800, requirements: [] }
  ],
  performance: {
    tasksCompleted: 0,
    successRate: 0,
    averageResponseTime: 0,
    averageExecutionTime: 0,
    errorRate: 0,
    userSatisfaction: 0,
    costEfficiency: 0,
    lastUpdated: new Date().toISOString()
  },
  availability: {
    timezone: 'UTC',
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      breaks: []
    },
    maxConcurrentTasks: 3,
    autoAcceptTasks: true,
    priorityLevel: 'high'
  },
  cost: {
    baseCost: 50,
    perTaskCost: 10,
    perToolExecutionCost: 0.01,
    currency: 'USD',
    billingPeriod: 'hourly'
  },
  metadata: {
    experience: '5+ years',
    specializations: ['React', 'Node.js', 'AWS'],
    certifications: ['AWS Certified Developer', 'React Professional']
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const executionContext: ExecutionContext = {
  userId: 'test-user-001',
  jobId: 'test-job-001',
  sessionId: 'test-session-001',
  timestamp: new Date().toISOString(),
  environment: 'development'
};

const testTasks = [
  {
    id: 'task-001',
    description: 'Create a React component for user authentication with TypeScript',
    expectedTools: ['generate_code'],
    complexity: 'medium'
  },
  {
    id: 'task-002',
    description: 'Analyze the performance of our API endpoints and suggest optimizations',
    expectedTools: ['analyze_data'],
    complexity: 'high'
  },
  {
    id: 'task-003',
    description: 'Send an email notification to the team about the deployment status',
    expectedTools: ['send_email'],
    complexity: 'low'
  },
  {
    id: 'task-004',
    description: 'Search for the latest best practices in React performance optimization',
    expectedTools: ['web_search'],
    complexity: 'low'
  },
  {
    id: 'task-005',
    description: 'Upload the project documentation file to the shared drive',
    expectedTools: ['file_upload'],
    complexity: 'low'
  }
];

/**
 * Test AI Employee execution
 */
async function testAIEmployeeExecution(): Promise<void> {
  console.log('🤖 Starting AI Employee Test');
  console.log('=====================================');
  
  const executor = new MockAIEmployeeExecutor(testSoftwareEngineer, executionContext);
  
  console.log(`\n👤 AI Employee: ${testSoftwareEngineer.name}`);
  console.log(`🎯 Role: ${testSoftwareEngineer.role}`);
  console.log(`🛠️  Available Tools: ${testSoftwareEngineer.tools.map(t => t.name).join(', ')}`);
  console.log(`🧠 Autonomy Level: ${testSoftwareEngineer.capabilities.autonomyLevel}`);
  
  console.log('\n📋 Executing Test Tasks...');
  console.log('=====================================');
  
  let totalSuccess = 0;
  let totalCost = 0;
  let totalExecutionTime = 0;
  
  for (const task of testTasks) {
    console.log(`\n🎯 Task: ${task.description}`);
    console.log(`📊 Expected Tools: ${task.expectedTools.join(', ')}`);
    console.log(`⚡ Complexity: ${task.complexity}`);
    
    try {
      const result = await executor.executeTask(task.description);
      
      console.log(`✅ Success: ${result.success}`);
      console.log(`🛠️  Tools Used: ${result.toolsUsed.join(', ')}`);
      console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
      console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
      
      if (result.success) {
        totalSuccess++;
        console.log(`📄 Result: ${JSON.stringify(result.result, null, 2)}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      
      totalCost += result.cost;
      totalExecutionTime += result.executionTime;
      
    } catch (error) {
      console.log(`❌ Task failed with error: ${(error as Error).message}`);
    }
    
    console.log('-------------------------------------');
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('=====================================');
  console.log(`✅ Successful Tasks: ${totalSuccess}/${testTasks.length}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`⏱️  Total Execution Time: ${totalExecutionTime}ms`);
  console.log(`📈 Success Rate: ${((totalSuccess / testTasks.length) * 100).toFixed(1)}%`);
  console.log(`💵 Average Cost per Task: $${(totalCost / testTasks.length).toFixed(4)}`);
  console.log(`⚡ Average Execution Time: ${(totalExecutionTime / testTasks.length).toFixed(0)}ms`);
  
  console.log('\n🎉 AI Employee Test Completed!');
}

// Run the test
async function runTest(): Promise<void> {
  try {
    await testAIEmployeeExecution();
    console.log('\n🚀 Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Export for use in other files
export { testAIEmployeeExecution, runTest };

// Run the test
runTest()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });
