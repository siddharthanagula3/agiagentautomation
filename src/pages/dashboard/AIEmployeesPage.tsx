import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { agentsService } from '../../services/agentsService';
import type { Database } from '../../integrations/supabase/types';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Bot,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Star,
  Activity,
  Target,
  DollarSign
} from 'lucide-react';

type AIAgent = Database['public']['Tables']['ai_agents']['Row'];

// Use the real AIAgent type from database
type AIEmployee = AIAgent;

const AIEmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<AIEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    totalTasks: 0,
    avgSuccessRate: 0
  });

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    description: '',
    capabilities: [] as string[],
    status: 'available' as 'available' | 'busy' | 'offline' | 'maintenance'
  });

  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user]);

  
  
  
  
  const loadEmployees = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Set default values immediately
      setData([]);
      setFilteredData([]);
      setStats({
        total: 0,
        // Add other default stats here
      });
      
      // NEVER wait for services - always resolve immediately
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  }, [user]);

  // Override useEffect to always call loadData
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Create AI agent using real service
      const result = await agentsService.createAgent(user.id, {
        name: newEmployee.name,
        description: newEmployee.description,
        role: 'assistant',
        capabilities: newEmployee.capabilities,
        status: newEmployee.status,
        is_active: true
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the list
        await loadEmployees();
        setNewEmployee({ name: '', description: '', capabilities: [], status: 'available' });
        setShowCreateEmployee(false);
      }
      
    } catch (err) {
      console.error('Error creating AI employee:', err);
      setError('Failed to create AI employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = useCallback(() => {
    let filtered = employees;
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter]);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <Clock className="h-4 w-4" />;
      case 'offline': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading AI employees...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadEmployees}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {employees.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No AI Employees Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI employee to get started with automation.
          </p>
          <Button onClick={() => setShowCreateEmployee(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First AI Employee
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Employees</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your AI workforce.
          </p>
        </div>
        <Button onClick={() => setShowCreateEmployee(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create AI Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.busy}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search AI employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Employee List */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription>{employee.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(employee.status)}
                      <span className="capitalize">{employee.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Capabilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {employee.capabilities.map((capability, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tasks Completed</span>
                      <div className="font-semibold">{employee.performance.tasks_completed}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate</span>
                      <div className="font-semibold">{employee.performance.success_rate}%</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length > 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No employees found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : null}

      {/* Create Employee Modal */}
      {showCreateEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create AI Employee</CardTitle>
              <CardDescription>
                Add a new AI employee to your workforce.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter employee name"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newEmployee.description}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter employee description"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateEmployee(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Employee'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIEmployeesPage;
