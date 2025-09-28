import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  Trash2
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'busy';
  tasksCompleted: number;
  successRate: number;
  lastActive: string;
}

const AIEmployeesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setisLoading] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    busy: 0,
    offline: 0,
    totalTasks: 0,
    avgSuccessRate: 0
  });

  useEffect(() => {
    setisLoading(true);
    
    // Set default values immediately
    setAgents([]);
    setStats({
      total: 0,
      active: 0,
      busy: 0,
      offline: 0,
      totalTasks: 0,
      avgSuccessRate: 0
    });
    
    // Simulate API call
    setTimeout(() => {
      setisLoading(false);
    }, 1000);
  }, []);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Employees</h1>
          <p className="text-muted-foreground">
            Manage your AI workforce and monitor their performance.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500 dark:bg-green-400"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500 dark:bg-yellow-400"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.busy}</div>
            <p className="text-xs text-muted-foreground">
              Working on tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500 dark:bg-blue-400"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Agents</CardTitle>
          <CardDescription>
            Find and manage your AI employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>
            Your AI workforce and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No AI agents yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first AI agent to get started with automation.
              </p>
                <div className="mt-6">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Agent
                  </Button>
                </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {agent.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {agent.role}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {agent.tasksCompleted} tasks completed
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {agent.successRate}% success rate
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={agent.status === 'active' ? 'default' : 
                              agent.status === 'busy' ? 'secondary' : 'outline'}
                    >
                      {agent.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your AI workforce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <Plus className="h-6 w-6 mb-2" />
              Create Agent
            </Button>
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-6 w-6 mb-2" />
              Configure
            </Button>
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <Users className="h-6 w-6 mb-2" />
              Manage Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIEmployeesPage;
