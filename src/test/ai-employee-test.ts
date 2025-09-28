// Test script to demonstrate AI Employee functionality
// This script creates a Software Engineer AI Employee and tests tool execution

import { AIEmployee, ExecutionContext } from '../types';
import { AI_EMPLOYEE_PROMPTS, AI_EMPLOYEE_TOOLS } from '../prompts/ai-employee-prompts';
import { createAIEmployeeExecutor } from '../services/ai/ai-employee-executor';

// Create a test Software Engineer AI Employee
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
    availableTools: AI_EMPLOYEE_TOOLS.software_engineer,
    toolProficiency: new Map([
      ['generate_code', 95],
      ['analyze_code', 90],
      ['create_api', 85],
      ['setup_database', 80],
      ['deploy_application', 75],
      ['run_tests', 90]
    ]),
    autonomyLevel: 'fully-autonomous',
    decisionMaking: [
      {
        type: 'technical_decision',
        description: 'Choose appropriate technology stack',
        confidence: 95,
        criteria: ['performance', 'scalability', 'team_expertise']
      }
    ],
    canCollaborate: true,
    collaborationProtocols: [
      {
        name: 'code_review',
        description: 'Review code changes before merging',
        steps: ['analyze_code', 'suggest_improvements', 'approve_changes'],
        triggers: ['pull_request_created']
      }
    ],
    communicationChannels: [
      {
        type: 'direct',
        name: 'Slack',
        description: 'Direct messaging for quick communication',
        participants: ['team_members']
      }
    ]
  },
  system_prompt: AI_EMPLOYEE_PROMPTS.software_engineer,
  tools: AI_EMPLOYEE_TOOLS.software_engineer,
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

// Create execution context
const executionContext: ExecutionContext = {
  userId: 'test-user-001',
  jobId: 'test-job-001',
  sessionId: 'test-session-001',
  timestamp: new Date().toISOString(),
  environment: 'development'
};

// Test tasks for the AI Employee
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
    expectedTools: ['analyze_code'],
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
export async function testAIEmployeeExecution(): Promise<void> {
  console.log('🤖 Starting AI Employee Test');
  console.log('=====================================');
  
  // Create AI Employee executor
  const executor = createAIEmployeeExecutor(testSoftwareEngineer, executionContext);
  
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
      const startTime = Date.now();
      const result = await executor.executeTask(task.description);
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Success: ${result.success}`);
      console.log(`🛠️  Tools Used: ${result.toolsUsed.join(', ')}`);
      console.log(`⏱️  Execution Time: ${executionTime}ms`);
      console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
      
      if (result.success) {
        totalSuccess++;
        console.log(`📄 Result: ${JSON.stringify(result.result, null, 2)}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      
      totalCost += result.cost;
      totalExecutionTime += executionTime;
      
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

/**
 * Test specific tool execution
 */
export async function testSpecificToolExecution(): Promise<void> {
  console.log('\n🔧 Testing Specific Tool Execution');
  console.log('=====================================');
  
  const executor = createAIEmployeeExecutor(testSoftwareEngineer, executionContext);
  
  // Test code generation
  console.log('\n💻 Testing Code Generation Tool');
  const codeTask = 'Create a TypeScript function that validates email addresses using regex';
  const codeResult = await executor.executeTask(codeTask);
  
  console.log(`✅ Code Generation Success: ${codeResult.success}`);
  if (codeResult.success) {
    console.log(`📄 Generated Code: ${JSON.stringify(codeResult.result, null, 2)}`);
  }
  
  // Test data analysis
  console.log('\n📊 Testing Data Analysis Tool');
  const dataTask = 'Analyze the user engagement data and provide insights';
  const dataResult = await executor.executeTask(dataTask);
  
  console.log(`✅ Data Analysis Success: ${dataResult.success}`);
  if (dataResult.success) {
    console.log(`📄 Analysis Results: ${JSON.stringify(dataResult.result, null, 2)}`);
  }
  
  console.log('\n🎯 Specific Tool Tests Completed!');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testAIEmployeeExecution()
    .then(() => testSpecificToolExecution())
    .then(() => {
      console.log('\n🚀 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}
