// AI Employee Demo Page
// Demonstrates the AI Employee system with real tool execution

import React, { useState } from 'react';
import { AIEmployee } from '../../types';
import { AI_EMPLOYEE_PROMPTS, AI_EMPLOYEE_TOOLS } from '../../prompts/ai-employee-prompts';
import { AIEmployeeChat } from '../../components/ai-employees/AIEmployeeChat';

export const AIEmployeeDemo: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(null);
  const [toolExecutionHistory, setToolExecutionHistory] = useState<any[]>([]);

  // Demo AI Employees
  const demoEmployees: AIEmployee[] = [
    {
      id: 'demo-software-engineer',
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
        decisionMaking: [],
        canCollaborate: true,
        collaborationProtocols: [],
        communicationChannels: []
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
    },
    {
      id: 'demo-data-analyst',
      name: 'Sarah Johnson',
      role: 'Senior Data Analyst',
      category: 'Data & Analytics',
      department: 'Analytics',
      level: 'senior',
      status: 'available',
      capabilities: {
        coreSkills: ['Statistical analysis', 'Data visualization', 'Business intelligence'],
        technicalSkills: ['Python', 'R', 'SQL', 'Tableau', 'Power BI'],
        softSkills: ['Analytical thinking', 'Communication', 'Problem-solving'],
        availableTools: AI_EMPLOYEE_TOOLS.data_analyst,
        toolProficiency: new Map([
          ['analyze_data', 95],
          ['create_visualization', 90],
          ['query_database', 85],
          ['generate_report', 80],
          ['forecast_trends', 75],
          ['clean_data', 90]
        ]),
        autonomyLevel: 'semi-autonomous',
        decisionMaking: [],
        canCollaborate: true,
        collaborationProtocols: [],
        communicationChannels: []
      },
      system_prompt: AI_EMPLOYEE_PROMPTS.data_analyst,
      tools: AI_EMPLOYEE_TOOLS.data_analyst,
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
        maxConcurrentTasks: 2,
        autoAcceptTasks: true,
        priorityLevel: 'medium'
      },
      cost: {
        baseCost: 40,
        perTaskCost: 8,
        perToolExecutionCost: 0.005,
        currency: 'USD',
        billingPeriod: 'hourly'
      },
      metadata: {
        experience: '4+ years',
        specializations: ['Python', 'SQL', 'Tableau'],
        certifications: ['Google Analytics Certified', 'Tableau Desktop Specialist']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const handleToolExecution = (toolId: string, result: any) => {
    setToolExecutionHistory(prev => [...prev, {
      id: `execution-${Date.now()}`,
      toolId,
      result,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleStartChat = (employee: AIEmployee) => {
    setSelectedEmployee(employee);
  };

  const handleBackToSelection = () => {
    setSelectedEmployee(null);
  };

  if (selectedEmployee) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToSelection}
              className="mb-4 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              ← Back to Employee Selection
            </button>
            <h1 className="text-3xl font-bold text-foreground">AI Employee Chat</h1>
            <p className="text-muted-foreground">Chat with {selectedEmployee.name} and see them execute real tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="h-[600px]">
                <AIEmployeeChat
                  employee={selectedEmployee}
                  userId="demo-user"
                  onToolExecution={handleToolExecution}
                />
              </div>
            </div>

            {/* Employee Info & Tool History */}
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Employee Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedEmployee.name}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {selectedEmployee.role}
                  </div>
                  <div>
                    <span className="font-medium">Level:</span> {selectedEmployee.level}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedEmployee.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Autonomy:</span> {selectedEmployee.capabilities.autonomyLevel}
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span> ${selectedEmployee.cost.baseCost}/hour
                  </div>
                </div>
              </div>

              {/* Available Tools */}
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Available Tools</h3>
                <div className="space-y-2">
                  {selectedEmployee.tools.map((tool) => (
                    <div key={tool.id} className="text-sm">
                      <div className="font-medium text-foreground">{tool.name}</div>
                      <div className="text-muted-foreground">{tool.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tool Execution History */}
              {toolExecutionHistory.length > 0 && (
                <div className="bg-card border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3">Tool Execution History</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {toolExecutionHistory.slice(-5).reverse().map((execution) => (
                      <div key={execution.id} className="text-sm border-l-2 border-primary pl-2">
                        <div className="font-medium text-foreground">{execution.toolId}</div>
                        <div className="text-muted-foreground">
                          {new Date(execution.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Success: {execution.result.success ? '✅' : '❌'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Employee Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of AI Employees that can actually execute tools and complete real work. 
            Choose an employee below and start a conversation to see them in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {demoEmployees.map((employee) => (
            <div key={employee.id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{employee.name}</h3>
                    <p className="text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    employee.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-xs text-muted-foreground capitalize">{employee.status}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">Core Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {employee.capabilities.coreSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {employee.capabilities.coreSkills.length > 3 && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                      +{employee.capabilities.coreSkills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">Available Tools</h4>
                <div className="text-sm text-muted-foreground">
                  {employee.tools.length} tools available
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {employee.tools.slice(0, 2).map((tool) => (
                    <span key={tool.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {tool.name}
                    </span>
                  ))}
                  {employee.tools.length > 2 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      +{employee.tools.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Cost: </span>
                  <span className="font-medium text-foreground">${employee.cost.baseCost}/hour</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Autonomy: </span>
                  <span className="font-medium text-foreground capitalize">
                    {employee.capabilities.autonomyLevel.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleStartChat(employee)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Start Chat with {employee.name}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Choose an Employee</h3>
              <p className="text-muted-foreground">
                Select from our specialized AI Employees, each with unique skills and tools.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Give Them a Task</h3>
              <p className="text-muted-foreground">
                Describe what you need done in natural language. They'll understand and act.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Watch Them Work</h3>
              <p className="text-muted-foreground">
                See them execute real tools, generate code, analyze data, and complete tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
