import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  TestTube, 
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
  Target,
  Bug,
  Shield,
  Database,
  Globe,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface Test {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'api';
  status: 'passed' | 'failed' | 'running' | 'pending' | 'skipped';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastRun: string;
  duration: number; // in seconds
  coverage: number; // percentage
  results: TestResult[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  id: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  message?: string;
  error?: string;
  coverage: number;
}

const TestingPage: React.FC = () => {
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
  
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  useEffect(() => {
    if (user) {
      loadTests();
    }
  }, [user]);

  useEffect(() => {
    filterTests();
  }, [tests, searchTerm, typeFilter, statusFilter]);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError('');
      
      
      
      
      
      setTests(mockTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      setError('Failed to load tests.');
    } finally {
      setLoading(false);
    }
  };

  const filterTests = useCallback(() => {
    let filtered = tests;

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(test => test.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, typeFilter, statusFilter]);

  const runTest = async (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', updatedAt: new Date().toISOString() }
        : test
    ));

    // Simulate test execution
    setTimeout(() => {
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: Math.random() > 0.2 ? 'passed' : 'failed',
              lastRun: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : test
      ));
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'skipped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
      case 'unit':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'integration':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'e2e':
        return <Globe className="h-4 w-4 text-purple-500" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'api':
        return <Database className="h-4 w-4 text-yellow-500" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'skipped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-500" />;
    }
  };

  const testStats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    running: tests.filter(t => t.status === 'running').length,
    avgCoverage: tests.length > 0 ? tests.reduce((sum, test) => sum + test.coverage, 0) / tests.length : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading tests...</span>
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
          <h1 className="text-3xl font-bold text-foreground">Testing</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your test suites and quality assurance.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Run All Tests
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold text-foreground">{testStats.total}</p>
              </div>
              <TestTube className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{testStats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{testStats.failed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold text-blue-600">{testStats.avgCoverage.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
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
                  placeholder="Search tests..."
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
                <option value="unit">Unit</option>
                <option value="integration">Integration</option>
                <option value="e2e">End-to-End</option>
                <option value="performance">Performance</option>
                <option value="security">Security</option>
                <option value="api">API</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="pending">Pending</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(test.type)}
                    <h3 className="font-semibold text-foreground">{test.name}</h3>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                    <Badge className={getPriorityColor(test.priority)}>
                      {test.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="font-medium">{new Date(test.lastRun).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{test.duration}s</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Coverage:</span>
                      <span className="font-medium">{test.coverage}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TestTube className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{test.type}</span>
                    </div>
                  </div>

                  {/* Test Results */}
                  {test.results.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Recent Results</h4>
                      <div className="space-y-1">
                        {test.results.slice(0, 2).map((result) => (
                          <div key={result.id} className="flex items-center space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              result.status === 'passed' ? 'bg-green-500' :
                              result.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-muted-foreground">{new Date(result.timestamp).toLocaleTimeString()}</span>
                            <span className="text-foreground">{result.status}</span>
                            <span className="text-muted-foreground">({result.duration}s)</span>
                            {result.error && (
                              <span className="text-red-500 text-xs">{result.error}</span>
                            )}
                          </div>
                        ))}
                        {test.results.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{test.results.length - 2} more results
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {test.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(test.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(test.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {test.status !== 'running' && (
                    <Button size="sm" variant="outline" onClick={() => runTest(test.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedTest(test)}>
                    <TestTube className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TestTube className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tests found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first test.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestingPage;