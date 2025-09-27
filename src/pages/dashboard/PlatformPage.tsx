import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Globe, 
  Plus, 
  Search, 
  Filter, 
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  Server,
  Database,
  Shield,
  Zap,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface Platform {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'api' | 'desktop' | 'cloud' | 'edge';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  metrics: PlatformMetrics;
  features: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlatformMetrics {
  uptime: number; // percentage
  responseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  users: number; // active users
  deployments: number; // deployment count
}

const PlatformPage: React.FC = () => {
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
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (user) {
      loadPlatforms();
    }
  }, [user]);

  useEffect(() => {
    filterPlatforms();
  }, [platforms, searchTerm, typeFilter, statusFilter]);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      setError('');
      
      
      
      
      
      setPlatforms(mockPlatforms);
    } catch (error) {
      console.error('Error loading platforms:', error);
      setError('Failed to load platforms.');
    } finally {
      setLoading(false);
    }
  };

  const filterPlatforms = useCallback(() => {
    let filtered = platforms;

    if (searchTerm) {
      filtered = filtered.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(platform => platform.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(platform => platform.status === statusFilter);
    }

    setFilteredPlatforms(filtered);
  }, [platforms, searchTerm, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'api':
        return <Server className="h-4 w-4 text-purple-500" />;
      case 'desktop':
        return <Monitor className="h-4 w-4 text-orange-500" />;
      case 'cloud':
        return <Database className="h-4 w-4 text-yellow-500" />;
      case 'edge':
        return <Zap className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const platformStats = {
    total: platforms.length,
    active: platforms.filter(p => p.status === 'active').length,
    maintenance: platforms.filter(p => p.status === 'maintenance').length,
    totalUsers: platforms.reduce((sum, p) => sum + p.metrics.users, 0),
    avgUptime: platforms.length > 0 ? platforms.reduce((sum, p) => sum + p.metrics.uptime, 0) / platforms.length : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading platforms...</span>
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
          <h1 className="text-3xl font-bold text-foreground">Platform Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your multi-platform AI workforce ecosystem.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Deploy All
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Platform
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Platforms</p>
                <p className="text-2xl font-bold text-foreground">{platformStats.total}</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{platformStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{platformStats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Uptime</p>
                <p className="text-2xl font-bold text-purple-600">{platformStats.avgUptime.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search platforms..."
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
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="api">API</option>
                <option value="desktop">Desktop</option>
                <option value="cloud">Cloud</option>
                <option value="edge">Edge</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platforms List */}
      <div className="space-y-4">
        {filteredPlatforms.map((platform) => (
          <Card key={platform.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(platform.type)}
                    <h3 className="font-semibold text-foreground">{platform.name}</h3>
                    <Badge className={getStatusColor(platform.status)}>
                      {platform.status}
                    </Badge>
                    <Badge variant="outline">
                      {platform.type}
                    </Badge>
                    <Badge variant="secondary">
                      v{platform.version}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{platform.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium">{platform.metrics.uptime}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Response:</span>
                      <span className="font-medium">{platform.metrics.responseTime}ms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Throughput:</span>
                      <span className="font-medium">{platform.metrics.throughput}/s</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">{platform.metrics.users.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {platform.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Environment and Deployments */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Environment:</span>
                      <Badge variant={platform.environment === 'production' ? 'default' : 'secondary'}>
                        {platform.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deployments:</span>
                      <span className="font-medium">{platform.metrics.deployments}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {platform.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(platform.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(platform.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPlatform(platform)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlatforms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No platforms found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by adding your first platform.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Platform
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlatformPage;