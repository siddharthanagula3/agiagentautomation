import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Loader2,
  FileText,
  Table,
  PieChart,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream' | 'cache';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  description: string;
  size: number; // in MB
  records: number;
  lastUpdated: string;
  schema: DataSchema[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DataSchema {
  field: string;
  type: string;
  nullable: boolean;
  description: string;
}

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [filteredSources, setFilteredSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  useEffect(() => {
  useEffect(() => {
const DataPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
    <div>Component content</div>
  );

const loadDataSources = async () => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setDataSources([]);
    } catch (error) {
      console.error('Error loading data sources:', error);
      setError('Failed to load data sources.');
    } finally {
      setLoading(false);
    }
  };

  const filterDataSources = useCallback(() => {
    let filtered = dataSources;

    if (searchTerm) {
      filtered = filtered.filter(source =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(source => source.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(source => source.status === statusFilter);
    }

    setFilteredSources(filtered);
  }, [dataSources, searchTerm, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'api':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'file':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'stream':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'cache':
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const dataStats = {
    total: dataSources.length,
    active: dataSources.filter(s => s.status === 'active').length,
    totalSize: dataSources.reduce((sum, source) => sum + source.size, 0),
    totalRecords: dataSources.reduce((sum, source) => sum + source.records, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading data sources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your data sources and analytics.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sources</p>
                <p className="text-2xl font-bold text-foreground">{dataStats.total}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{dataStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold text-blue-600">{dataStats.totalSize.toFixed(1)} MB</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-purple-600">{dataStats.totalRecords.toLocaleString()}</p>
              </div>
              <Table className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search data sources..."
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
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="file">File</option>
                <option value="stream">Stream</option>
                <option value="cache">Cache</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources List */}
      <div className="space-y-4">
        {filteredSources.map((source) => (
          <Card key={source.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(source.type)}
                    <h3 className="font-semibold text-foreground">{source.name}</h3>
                    <Badge className={getStatusColor(source.status)}>
                      {source.status}
                    </Badge>
                    <Badge variant="outline">
                      {source.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{source.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{source.size} MB</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Table className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Records:</span>
                      <span className="font-medium">{source.records.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">{new Date(source.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Schema:</span>
                      <span className="font-medium">{source.schema.length} fields</span>
                    </div>
                  </div>

                  {/* Schema Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Schema Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {source.schema.slice(0, 4).map((field, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm bg-muted p-2 rounded">
                          <span className="font-medium">{field.field}</span>
                          <Badge variant="outline" className="text-xs">{field.type}</Badge>
                          {!field.nullable && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                      {source.schema.length > 4 && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          +{source.schema.length - 4} more fields
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {source.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(source.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(source.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSource(source)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSources.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No data sources found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by adding your first data source.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Data Source
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
  };

export default DataPage;