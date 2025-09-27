import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Database,
  Server,
  Globe,
  Shield,
  Monitor
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface Operation {
  id: string;
  name: string;
  type: 'automation' | 'monitoring' | 'maintenance' | 'deployment' | 'backup' | 'security';
  status: 'running' | 'stopped' | 'paused' | 'error' | 'scheduled';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastRun: string;
  nextRun?: string;
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  duration: number; // in minutes
  successRate: number; // percentage
  resources: ResourceUsage;
  logs: OperationLog[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResourceUsage {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: number; // MB/s
}

interface OperationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  useEffect(() => {
  useEffect(() => {
const OperationsPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  

    if (user) {
      loadOperations();
    }
  }, [user]);

    filterOperations();
  }, [operations, searchTerm, typeFilter, statusFilter]);

  const loadOperations = async () => {
    try {
      setLoading(true);
      setError('');
      
      
      
      
      
      setOperations(mockOperations);
    } catch (error) {
      console.error('Error loading operations:', error);
      setError('Failed to load operations.');
    } finally {
      setLoading(false);
    }
  };

  const filterOperations = useCallback(() => {
    let filtered = operations;

    if (searchTerm) {
      filtered = filtered.filter(operation =>
        operation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(operation => operation.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(operation => operation.status === statusFilter);
    }

    setFilteredOperations(filtered);
  }, [operations, searchTerm, typeFilter, statusFilter]);

  const updateOperationStatus = async (operationId: string, status: Operation['status']) => {
    setOperations(prev => prev.map(operation => 
      operation.id === operationId 
        ? { ...operation, status, updatedAt: new Date().toISOString() }
        : operation
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'automation':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'monitoring':
        return <Monitor className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'deployment':
        return <Server className="h-4 w-4 text-purple-500" />;
      case 'backup':
        return <Database className="h-4 w-4 text-orange-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const operationStats = {
    total: operations.length,
    running: operations.filter(o => o.status === 'running').length,
    stopped: operations.filter(o => o.status === 'stopped').length,
    error: operations.filter(o => o.status === 'error').length,
    avgSuccessRate: operations.length > 0 ? operations.reduce((sum, op) => sum + op.successRate, 0) / operations.length : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading operations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground mb-4">
            This page will show your data once you start using the system.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operations</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your system operations and automations.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Operation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Operations</p>
                <p className="text-2xl font-bold text-foreground">{operationStats.total}</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-green-600">{operationStats.running}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{operationStats.error}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{operationStats.avgSuccessRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search operations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="automation">Automation</option>
                <option value="monitoring">Monitoring</option>
                <option value="maintenance">Maintenance</option>
                <option value="deployment">Deployment</option>
                <option value="backup">Backup</option>
                <option value="security">Security</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations List */}
      <div className="space-y-4">
        {filteredOperations.map((operation) => (
          <Card key={operation.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(operation.type)}
                    <h3 className="font-semibold text-foreground">{operation.name}</h3>
                    <Badge className={getStatusColor(operation.status)}>
                      {operation.status}
                    </Badge>
                    <Badge className={getPriorityColor(operation.priority)}>
                      {operation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{operation.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="font-medium">{new Date(operation.lastRun).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{operation.duration}min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-medium">{operation.successRate}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium">{operation.frequency}</span>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Resource Usage</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">CPU:</span>
                        <span className="font-medium">{operation.resources.cpu}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Memory:</span>
                        <span className="font-medium">{operation.resources.memory}MB</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Disk:</span>
                        <span className="font-medium">{operation.resources.disk}MB</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Network:</span>
                        <span className="font-medium">{operation.resources.network}MB/s</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Logs */}
                  {operation.logs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Recent Logs</h4>
                      <div className="space-y-1">
                        {operation.logs.slice(0, 2).map((log) => (
                          <div key={log.id} className="flex items-center space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              log.level === 'success' ? 'bg-green-500' :
                              log.level === 'warning' ? 'bg-yellow-500' :
                              log.level === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="text-foreground">{log.message}</span>
                          </div>
                        ))}
                        {operation.logs.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{operation.logs.length - 2} more logs
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {operation.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(operation.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(operation.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {operation.status === 'stopped' && (
                    <Button size="sm" variant="outline" onClick={() => updateOperationStatus(operation.id, 'running')}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {operation.status === 'running' && (
                    <Button size="sm" variant="outline" onClick={() => updateOperationStatus(operation.id, 'paused')}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedOperation(operation)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOperations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No operations found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first operation.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Operation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OperationsPage;