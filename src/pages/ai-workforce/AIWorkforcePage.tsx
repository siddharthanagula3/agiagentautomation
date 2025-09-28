/**
 * AI Workforce Page
 * The star of the show - where users submit projects to the "CEO" agent
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Workflow, 
  Bot, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Zap,
  Target,
  FileText,
  Upload,
  Send,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskDivision, type Task } from '@/components/chat/TaskDivision';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'analyzing' | 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  estimatedTokens: number;
  actualTokens: number;
  taskPlan?: Task[];
  result?: string;
  error?: string;
}

interface AIWorkforcePageProps {
  className?: string;
}

export const AIWorkforcePage: React.FC<AIWorkforcePageProps> = ({ className }) => {
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    files: [] as File[],
  });
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch user's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['ai-workforce-projects'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: '1',
          title: 'Website Development',
          description: 'Create a modern website for my business',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          estimatedTokens: 5000,
          actualTokens: 4800,
          result: 'Website successfully created with modern design and responsive layout.',
        },
        {
          id: '2',
          title: 'Data Analysis Report',
          description: 'Analyze customer data and generate insights',
          status: 'executing',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          estimatedTokens: 3000,
          actualTokens: 1200,
          taskPlan: [
            {
              id: '1',
              title: 'Data Collection',
              description: 'Gather customer data from various sources',
              type: 'simple',
              status: 'completed',
              estimatedTime: 30,
              assignedEmployee: 'Data Collector AI',
            },
            {
              id: '2',
              title: 'Data Analysis',
              description: 'Analyze patterns and trends in the data',
              type: 'reasoning',
              status: 'running',
              estimatedTime: 60,
              assignedEmployee: 'Data Analyst AI',
              dependencies: ['1'],
            },
            {
              id: '3',
              title: 'Report Generation',
              description: 'Create comprehensive analysis report',
              type: 'medium',
              status: 'pending',
              estimatedTime: 45,
              assignedEmployee: 'Report Writer AI',
              dependencies: ['2'],
            },
          ],
        },
        {
          id: '3',
          title: 'Marketing Campaign',
          description: 'Develop a comprehensive marketing strategy',
          status: 'planning',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          estimatedTokens: 4000,
          actualTokens: 0,
        },
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Submit project mutation
  const submitProjectMutation = useMutation({
    mutationFn: async (projectData: { title: string; description: string; files: File[] }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        title: projectData.title,
        description: projectData.description,
        status: 'analyzing',
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedTokens: Math.floor(Math.random() * 5000) + 1000,
        actualTokens: 0,
      };
      
      return newProject;
    },
    onSuccess: (project) => {
      queryClient.setQueryData(['ai-workforce-projects'], (old: Project[] = []) => [project, ...old]);
      setCurrentProject(project);
      setNewProject({ title: '', description: '', files: [] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Failed to submit project:', error);
      setIsSubmitting(false);
    },
  });

  const handleSubmitProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) return;
    
    setIsSubmitting(true);
    submitProjectMutation.mutate(newProject);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewProject(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'submitted':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'analyzing':
        return <Brain className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'planning':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'executing':
        return <Workflow className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'planning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'executing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Workforce</h1>
          <p className="text-muted-foreground">
            Submit complex projects to your AI CEO and watch your workforce execute them.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Bot className="h-3 w-3 mr-1" />
            CEO Agent Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submit New Project */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                Submit New Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What do you want to achieve?"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Project Description</label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about your project..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Attach Files (Optional)</label>
                <div className="mt-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    Choose Files
                  </Button>
                </div>
                {newProject.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newProject.files.map((file, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSubmitProject}
                disabled={!newProject.title.trim() || !newProject.description.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit to AI Workforce
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Project Details */}
        <div className="lg:col-span-2">
          {currentProject ? (
            <div className="space-y-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {getStatusIcon(currentProject.status)}
                      <span className="ml-2">{currentProject.title}</span>
                    </CardTitle>
                    <Badge className={cn('text-xs', getStatusColor(currentProject.status))}>
                      {currentProject.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{currentProject.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estimated Tokens:</span>
                      <span className="ml-2 font-medium">{currentProject.estimatedTokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual Tokens:</span>
                      <span className="ml-2 font-medium">{currentProject.actualTokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(currentProject.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="ml-2 font-medium">{formatDate(currentProject.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task Plan */}
              {currentProject.taskPlan && currentProject.taskPlan.length > 0 && (
                <TaskDivision
                  tasks={currentProject.taskPlan}
                  onApprove={() => console.log('Approve task plan')}
                  onReject={() => console.log('Reject task plan')}
                  onStart={() => console.log('Start tasks')}
                  onPause={() => console.log('Pause tasks')}
                  onReset={() => console.log('Reset tasks')}
                  isRunning={currentProject.status === 'executing'}
                  isPaused={false}
                />
              )}

              {/* Result */}
              {currentProject.result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Project Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{currentProject.result}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Project</h3>
                <p className="text-muted-foreground text-center">
                  Submit a new project to see the AI Workforce in action.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Project History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground">
                Submit your first project to get started with the AI Workforce.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setCurrentProject(project)}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(project.status)}
                    <div>
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={cn('text-xs', getStatusColor(project.status))}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
