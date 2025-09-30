/**
 * Workforce Demo Page - Complete demonstration of the AI Workforce system
 * Shows the full capabilities of the workforce orchestration
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkforceChat } from '@/components/workforce/WorkforceChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Code, 
  Database, 
  Zap, 
  Search, 
  Terminal, 
  Globe,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { getWorkforceStatus } from '@/services/workforce-orchestrator';

export const WorkforceDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const workforceStatus = getWorkforceStatus();

  const handleTaskComplete = (result: any) => {
    setCompletedTasks(prev => [...prev, result]);
  };

  const examplePrompts = [
    {
      category: 'Code',
      icon: Code,
      color: 'text-blue-500',
      prompts: [
        'Create a React component for a user profile card with avatar, name, and bio',
        'Build a REST API endpoint for user authentication with JWT tokens',
        'Refactor this code to use TypeScript and add proper error handling',
        'Generate unit tests for my shopping cart component'
      ]
    },
    {
      category: 'Data',
      icon: Database,
      color: 'text-green-500',
      prompts: [
        'Analyze this CSV file and generate insights about sales trends',
        'Create a data visualization dashboard showing user engagement metrics',
        'Process this JSON data and extract key statistics',
        'Generate a report comparing Q3 and Q4 performance'
      ]
    },
    {
      category: 'Research',
      icon: Search,
      color: 'text-purple-500',
      prompts: [
        'Research the best practices for implementing microservices architecture',
        'Find the latest trends in React development for 2025',
        'Compare different state management solutions for React apps',
        'Investigate security vulnerabilities in my dependencies'
      ]
    },
    {
      category: 'Automation',
      icon: Zap,
      color: 'text-yellow-500',
      prompts: [
        'Create a CI/CD pipeline for my Node.js application',
        'Build an automation script to deploy my app to AWS',
        'Set up automated testing with GitHub Actions',
        'Create a webhook to sync data between Slack and our database'
      ]
    },
    {
      category: 'DevOps',
      icon: Terminal,
      color: 'text-orange-500',
      prompts: [
        'Deploy my application to production with Docker and Kubernetes',
        'Set up monitoring and logging for my microservices',
        'Create a backup strategy for my PostgreSQL database',
        'Optimize my application for better performance and scalability'
      ]
    },
    {
      category: 'Web',
      icon: Globe,
      color: 'text-cyan-500',
      prompts: [
        'Scrape product data from these e-commerce websites',
        'Create automated tests for my web application using Puppeteer',
        'Build a web crawler to monitor competitor prices',
        'Generate SEO-optimized content for my landing page'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">AI Workforce Demo</h1>
                <p className="text-sm text-slate-400">
                  Complete orchestration of AI agents for any task
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {workforceStatus.agentsAvailable}
                </div>
                <div className="text-xs text-slate-400">Agents Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {workforceStatus.activeExecutions}
                </div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {workforceStatus.totalTasksCompleted}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="chat">
              <Bot className="w-4 h-4 mr-2" />
              Workforce Chat
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Zap className="w-4 h-4 mr-2" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Code className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="results">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Results ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700 h-[700px]">
                  <WorkforceChat
                    userId="demo-user"
                    onComplete={handleTaskComplete}
                    className="h-full"
                  />
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                  <div className="space-y-4">
                    <Step 
                      number={1}
                      title="Natural Input"
                      description="Describe what you need in plain English"
                    />
                    <Step 
                      number={2}
                      title="AI Analysis"
                      description="System analyzes intent and creates a plan"
                    />
                    <Step 
                      number={3}
                      title="Task Breakdown"
                      description="Complex tasks are broken into subtasks"
                    />
                    <Step 
                      number={4}
                      title="Agent Selection"
                      description="Optimal AI agents are assigned to each task"
                    />
                    <Step 
                      number={5}
                      title="Execution"
                      description="Tasks execute in parallel with real-time updates"
                    />
                    <Step 
                      number={6}
                      title="Results"
                      description="Get completed work with full transparency"
                    />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-800 border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Real-time progress tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Pause/resume execution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Rollback to any task</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Automatic error recovery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Cost & time estimation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Multi-agent coordination</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examplePrompts.map((category) => (
                <Card key={category.category} className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                    <h3 className="text-lg font-semibold">{category.category}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.prompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-sm"
                        onClick={() => {
                          // Switch to chat tab with this prompt
                          const chatTab = document.querySelector('[value="chat"]') as HTMLElement;
                          chatTab?.click();
                          // TODO: Set input value
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AgentCard
                name="Claude Code"
                description="Advanced AI for coding, analysis, and documentation"
                strengths={['Code generation', 'Debugging', 'Technical docs', 'Code review']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Cursor Agent"
                description="IDE-integrated coding agent with real-time editing"
                strengths={['File editing', 'Refactoring', 'Multi-file changes']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Replit Agent 3"
                description="Full-stack development and deployment specialist"
                strengths={['Complete projects', 'Deployment', 'Testing']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Gemini CLI"
                description="Research and analysis agent with web search"
                strengths={['Web research', 'Data analysis', 'Content generation']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Web Search"
                description="Specialized agent for web research and info gathering"
                strengths={['Real-time data', 'Fact verification', 'Multiple sources']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Bash Executor"
                description="System-level operations and script execution"
                strengths={['System access', 'Script execution', 'Process management']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="Puppeteer Agent"
                description="Browser automation and web scraping specialist"
                strengths={['Browser automation', 'Web scraping', 'UI testing']}
                status="available"
                tasksCompleted={0}
              />
              <AgentCard
                name="MCP Tool"
                description="Generic tool execution via Model Context Protocol"
                strengths={['Flexible integration', 'Tool execution', 'Extensible']}
                status="available"
                tasksCompleted={0}
              />
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {completedTasks.length === 0 ? (
              <Card className="p-12 bg-slate-800 border-slate-700 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold mb-2">No completed tasks yet</h3>
                <p className="text-slate-400">
                  Execute some tasks in the Chat tab to see results here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task, idx) => (
                  <Card key={idx} className="p-4 bg-slate-800 border-slate-700">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Task Completed</h3>
                        <pre className="text-sm bg-slate-900 p-4 rounded-lg overflow-x-auto">
                          {JSON.stringify(task, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Step Component
const Step: React.FC<{
  number: number;
  title: string;
  description: string;
}> = ({ number, title, description }) => {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>
  );
};

// Agent Card Component
const AgentCard: React.FC<{
  name: string;
  description: string;
  strengths: string[];
  status: 'available' | 'busy' | 'offline';
  tasksCompleted: number;
}> = ({ name, description, strengths, status, tasksCompleted }) => {
  const statusColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-red-500'
  };

  return (
    <Card className="p-4 bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{name}</h3>
            <Badge className={`${statusColors[status]} text-white text-xs`}>
              {status}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">{description}</p>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300">Strengths:</div>
        <div className="flex flex-wrap gap-1">
          {strengths.map((strength, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {strength}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <CheckCircle2 className="w-3 h-3" />
          {tasksCompleted} completed
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <TrendingUp className="w-3 h-3" />
          95% success
        </div>
      </div>
    </Card>
  );
};

export default WorkforceDemoPage;
