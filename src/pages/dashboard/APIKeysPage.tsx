import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { 
  Key,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Settings,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Unlock,
  Zap,
  Globe,
  Server,
  Database,
  Bot,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink,
  Ban,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface APIKey {
  id: string;
  name: string;
  key: string;
  description: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  usage: {
    requests: number;
    rateLimit: number;
    rateLimitRemaining: number;
    lastRequest?: string;
  };
  restrictions: {
    ipWhitelist?: string[];
    userAgentWhitelist?: string[];
    allowedOrigins?: string[];
  };
  createdBy: string;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
  scopes: string[];
}

interface APIKeyTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  scopes: string[];
  environment: string;
  popularity: number;
  isOfficial: boolean;
}

  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<APIKey[]>([]);
  const [templates, setTemplates] = useState<APIKeyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  useEffect(() => {
  useEffect(() => {
const APIKeysPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
    <div>Component content</div>
  );
};

const loadAPIKeys = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setData([]);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  };

  const filterAPIKeys = useCallback(() => {
    let filtered = apiKeys;

    if (searchTerm) {
      filtered = filtered.filter(key =>
        key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(key => key.status === statusFilter);
    }

    if (environmentFilter) {
      filtered = filtered.filter(key => key.environment === environmentFilter);
    }

    setFilteredApiKeys(filtered);
  }, [apiKeys, searchTerm, statusFilter, environmentFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'revoked':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'revoked':
        return <Ban className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleCreateAPIKey = async () => {
    setIsCreatingKey(true);
    try {
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
      loadAPIKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleToggleKeyStatus = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' }
          : key
      ));
      toast({
        title: "Status Updated",
        description: "API key status has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API key status",
        variant: "destructive",
      });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' } : key
      ));
      toast({
        title: "Key Revoked",
        description: "API key has been revoked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const apiKeyStats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    inactive: apiKeys.filter(k => k.status === 'inactive').length,
    expired: apiKeys.filter(k => k.status === 'expired').length,
    revoked: apiKeys.filter(k => k.status === 'revoked').length,
    totalRequests: apiKeys.reduce((sum, k) => sum + k.usage.requests, 0),
    avgUsage: apiKeys.length > 0 
      ? apiKeys.reduce((sum, k) => sum + k.usage.requests, 0) / apiKeys.length 
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading API keys...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadAPIKeys}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
        <p className="text-muted-foreground mt-2">
            Manage API keys for secure programmatic access to your AI workforce platform.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={handleCreateAPIKey} disabled={isCreatingKey}>
            {isCreatingKey ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create API Key
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
                <p className="text-2xl font-bold text-foreground">{apiKeyStats.total}</p>
                <p className="text-sm text-green-600">{apiKeyStats.active} active</p>
              </div>
              <Key className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{apiKeyStats.totalRequests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Usage</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(apiKeyStats.avgUsage).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Requests per key</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{apiKeyStats.expired}</p>
                <p className="text-sm text-muted-foreground">Need attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
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
                  placeholder="Search API keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
              <select
                value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {filteredApiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{apiKey.name}</h3>
                    <Badge className={getStatusColor(apiKey.status)}>
                      {apiKey.status}
                    </Badge>
                    <Badge className={getEnvironmentColor(apiKey.environment)}>
                      {apiKey.environment}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{apiKey.description}</p>
                  
                  {/* API Key */}
                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">API Key</p>
                        <code className="text-sm font-mono">
                          {showApiKeys[apiKey.id] 
                            ? apiKey.key
                            : '••••••••••••••••••••••••••••••••'}
                        </code>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleApiKeyVisibility(apiKey.id)}
                        >
                          {showApiKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyApiKey(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Requests:</span>
                      <span className="ml-2 font-medium">{apiKey.usage.requests.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate Limit:</span>
                      <span className="ml-2 font-medium">{apiKey.usage.rateLimitRemaining}/{apiKey.usage.rateLimit}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="ml-2 font-medium">
                        {apiKey.lastUsed ? formatTimeAgo(apiKey.lastUsed) : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="ml-2 font-medium">
                        {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-muted-foreground">Permissions:</span>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Scopes */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-muted-foreground">Scopes:</span>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.scopes.slice(0, 3).map((scope, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                      {apiKey.scopes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{apiKey.scopes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Restrictions */}
                  {(apiKey.restrictions.ipWhitelist || apiKey.restrictions.allowedOrigins) && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Restrictions</p>
                      {apiKey.restrictions.ipWhitelist && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">IP Whitelist:</span>
                          <span className="ml-2 font-medium">
                            {apiKey.restrictions.ipWhitelist.join(', ')}
                          </span>
                        </div>
                      )}
                      {apiKey.restrictions.allowedOrigins && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Allowed Origins:</span>
                          <span className="ml-2 font-medium">
                            {apiKey.restrictions.allowedOrigins.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {apiKey.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(apiKey.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {formatTimeAgo(apiKey.createdAt)}
                  {apiKey.lastUsed && ` • Last used ${formatTimeAgo(apiKey.lastUsed)}`}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleKeyStatus(apiKey.id)}
                  >
                    {apiKey.status === 'active' ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRevokeKey(apiKey.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Ban className="h-4 w-4" />
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

      {/* API Key Templates */}
      {templates.length > 0 && (
      <Card>
        <CardHeader>
            <CardTitle>API Key Templates</CardTitle>
            <CardDescription>Pre-configured templates for common API key setups</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    {template.isOfficial && (
                      <Shield className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{template.environment}</p>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>⭐ {template.popularity}% popular</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleCreateAPIKey}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredApiKeys.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Key className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No API keys found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter || environmentFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first API key.'}
            </p>
            <Button onClick={handleCreateAPIKey}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First API Key
            </Button>
        </CardContent>
      </Card>
      )}
    </div>
  )
  };

;
};

export default APIKeysPage;
