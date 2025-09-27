import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Palette, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Download,
  Upload,
  Loader2,
  Paintbrush,
  Layers,
  Type,
  ColorWand,
  Image,
  Layout,
  Grid,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Users,
  Target,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';

interface DesignSystem {
  id: string;
  name: string;
  type: 'color' | 'typography' | 'component' | 'layout' | 'icon' | 'pattern';
  status: 'active' | 'draft' | 'deprecated' | 'review';
  description: string;
  usage: number; // usage count
  lastUsed: string;
  variants: DesignVariant[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DesignVariant {
  id: string;
  name: string;
  value: string;
  description: string;
  usage: number;
}

  const [designSystems, setDesignSystems] = useState<DesignSystem[]>([]);
  const [filteredSystems, setFilteredSystems] = useState<DesignSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<DesignSystem | null>(null);
  useEffect(() => {
  useEffect(() => {
const DesignPage: React.FC = () => {
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
      loadDesignSystems();
    }
  }, [user]);

    filterDesignSystems();
  }, [designSystems, searchTerm, typeFilter, statusFilter]);

  const loadDesignSystems = async () => {
    try {
      setLoading(true);
      setError('');
      
      
      
      
      
      setDesignSystems(mockDesignSystems);
    } catch (error) {
      console.error('Error loading design systems:', error);
      setError('Failed to load design systems.');
    } finally {
      setLoading(false);
    }
  };

  const filterDesignSystems = useCallback(() => {
    let filtered = designSystems;

    if (searchTerm) {
      filtered = filtered.filter(system =>
        system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        system.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        system.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(system => system.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(system => system.status === statusFilter);
    }

    setFilteredSystems(filtered);
  }, [designSystems, searchTerm, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'deprecated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <Palette className="h-4 w-4 text-blue-500" />;
      case 'typography':
        return <Type className="h-4 w-4 text-green-500" />;
      case 'component':
        return <Layers className="h-4 w-4 text-purple-500" />;
      case 'layout':
        return <Grid className="h-4 w-4 text-orange-500" />;
      case 'icon':
        return <Image className="h-4 w-4 text-yellow-500" />;
      case 'pattern':
        return <Layout className="h-4 w-4 text-red-500" />;
      default:
        return <Palette className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'deprecated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'review':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Palette className="h-4 w-4 text-gray-500" />;
    }
  };

  const designStats = {
    total: designSystems.length,
    active: designSystems.filter(s => s.status === 'active').length,
    draft: designSystems.filter(s => s.status === 'draft').length,
    totalUsage: designSystems.reduce((sum, system) => sum + system.usage, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading design systems...</span>
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
          <h1 className="text-3xl font-bold text-foreground">Design System</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize your design system components and patterns.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Components</p>
                <p className="text-2xl font-bold text-foreground">{designStats.total}</p>
              </div>
              <Palette className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{designStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{designStats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-blue-600">{designStats.totalUsage.toLocaleString()}</p>
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
                  placeholder="Search design components..."
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
                <option value="color">Color</option>
                <option value="typography">Typography</option>
                <option value="component">Component</option>
                <option value="layout">Layout</option>
                <option value="icon">Icon</option>
                <option value="pattern">Pattern</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="deprecated">Deprecated</option>
                <option value="review">Review</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Systems List */}
      <div className="space-y-4">
        {filteredSystems.map((system) => (
          <Card key={system.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(system.type)}
                    <h3 className="font-semibold text-foreground">{system.name}</h3>
                    <Badge className={getStatusColor(system.status)}>
                      {system.status}
                    </Badge>
                    <Badge variant="outline">
                      {system.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{system.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="font-medium">{system.usage.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Variants:</span>
                      <span className="font-medium">{system.variants.length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="font-medium">{new Date(system.lastUsed).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Variants Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Variants</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {system.variants.slice(0, 3).map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <div className="flex items-center space-x-2">
                            {system.type === 'color' && (
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: variant.value }}
                              ></div>
                            )}
                            <span className="font-medium">{variant.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">{variant.usage}</span>
                            {system.type === 'color' && (
                              <span className="text-xs text-muted-foreground">{variant.value}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {system.variants.length > 3 && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          +{system.variants.length - 3} more variants
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {system.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(system.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(system.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSystem(system)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSystems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No design components found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by adding your first design component.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DesignPage;