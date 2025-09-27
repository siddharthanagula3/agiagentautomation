import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { 
  Plug,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link,
  Unlink,
  Settings,
  Key,
  Globe,
  Database,
  Bot,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Cloud,
  Github,
  Loader2,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Zap,
  Activity,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  provider: string;
  category: 'ai' | 'communication' | 'storage' | 'analytics' | 'development' | 'productivity' | 'payment' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  icon: string;
  apiKey?: string;
  webhookUrl?: string;
  config: Record<string, unknown>;
  permissions: string[];
  lastSync?: string;
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  usage: {
    requests: number;
    errors: number;
    lastRequest?: string;
    rateLimit?: number;
    rateLimitRemaining?: number;
  };
  createdAt: string;
  updatedAt: string;
  features: string[];
  documentation?: string;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  popularity: number;
  setupTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  features: string[];
}

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  useEffect(() => {
  useEffect(() => {
const IntegrationsPage: React.FC = () => {
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
      loadIntegrations();
    }
  }, [user]);

    filterIntegrations();
  }, [integrations, searchTerm, categoryFilter, statusFilter]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setData([]);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setError('Failed to load integrations.');
    } finally {
      setLoading(false);
    }
  };

  const filterIntegrations = useCallback(() => {
    let filtered = integrations;

    if (searchTerm) {
      filtered = filtered.filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(integration => integration.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(integration => integration.status === statusFilter);
    }

    setFilteredIntegrations(filtered);
  }, [integrations, searchTerm, categoryFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai':
        return <Bot className="h-4 w-4 text-purple-500" />;
      case 'communication':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'storage':
        return <Cloud className="h-4 w-4 text-green-500" />;
      case 'analytics':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'development':
        return <Github className="h-4 w-4 text-gray-500" />;
      case 'productivity':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'payment':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Plug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDataFlowIcon = (flow: string) => {
    switch (flow) {
      case 'inbound':
        return '⬅️';
      case 'outbound':
        return '➡️';
      case 'bidirectional':
        return '↔️';
      default:
        return '•';
    }
  };

  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const toggleApiKeyVisibility = (integrationId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleToggleConnection = async (integration: Integration) => {
    try {
      const newStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: newStatus } : i
      ));
      toast({
        title: newStatus === 'connected' ? "Connected" : "Disconnected",
        description: `${integration.name} has been ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update integration status",
        variant: "destructive",
      });
    }
  };

  const handleAddIntegration = async () => {
    setIsAddingIntegration(true);
    try {
      
      toast({
        title: "Integration Added",
        description: "New integration has been added successfully",
      });
      loadIntegrations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add integration",
        variant: "destructive",
      });
    } finally {
      setIsAddingIntegration(false);
    }
  };

  const integrationStats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    disconnected: integrations.filter(i => i.status === 'disconnected').length,
    errors: integrations.filter(i => i.status === 'error').length,
    totalRequests: integrations.reduce((sum, i) => sum + i.usage.requests, 0),
    totalErrors: integrations.reduce((sum, i) => sum + i.usage.errors, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadIntegrations}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your AI workforce with external tools and services.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={handleAddIntegration} disabled={isAddingIntegration}>
            {isAddingIntegration ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Integrations</p>
                <p className="text-2xl font-bold text-foreground">{integrationStats.total}</p>
                <p className="text-sm text-green-600">{integrationStats.connected} active</p>
              </div>
              <Plug className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">{integrationStats.connected}</p>
                <p className="text-sm text-muted-foreground">Active integrations</p>
              </div>
              <Link className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                <p className="text-2xl font-bold text-blue-600">{integrationStats.totalRequests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{integrationStats.totalErrors}</p>
                <p className="text-sm text-muted-foreground">{integrationStats.errors} integrations</p>
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
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                <option value="ai">AI & Machine Learning</option>
                <option value="communication">Communication</option>
                <option value="storage">Storage</option>
                <option value="analytics">Analytics</option>
                <option value="development">Development</option>
                <option value="productivity">Productivity</option>
                <option value="payment">Payment</option>
                <option value="custom">Custom</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getDataFlowIcon(integration.dataFlow)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{integration.provider}</p>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <Switch
                  checked={integration.status === 'connected'}
                  onCheckedChange={() => handleToggleConnection(integration)}
                  disabled={integration.status === 'pending' || integration.status === 'error'}
                />
              </div>

              {/* API Key / Webhook URL */}
              {(integration.apiKey || integration.webhookUrl) && (
                <div className="bg-muted/50 p-3 rounded-lg mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {integration.apiKey ? 'API Key' : 'Webhook URL'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono">
                          {showApiKeys[integration.id] 
                            ? (integration.apiKey || integration.webhookUrl)
                            : '••••••••••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleApiKeyVisibility(integration.id)}
                        >
                          {showApiKeys[integration.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyApiKey(integration.apiKey || integration.webhookUrl || '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground">Requests</p>
                  <p className="font-medium">{integration.usage.requests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-medium text-red-600">{integration.usage.errors}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Used</p>
                  <p className="font-medium">{formatTimeAgo(integration.usage.lastRequest)}</p>
                </div>
              </div>

              {/* Sync Info */}
              {integration.syncFrequency && (
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Sync:</span>
                    <span className="font-medium capitalize">{integration.syncFrequency}</span>
                  </div>
                  {integration.lastSync && (
                    <span className="text-muted-foreground">
                      Last: {formatTimeAgo(integration.lastSync)}
                    </span>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-3">
                {integration.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {integration.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{integration.features.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(integration.category)}
                  <span className="text-xs text-muted-foreground capitalize">
                    {integration.category}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                  {integration.documentation && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(integration.documentation, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>Popular integrations you can add to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{template.provider}</p>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>⏱ {template.setupTime}</span>
                    <span>⭐ {template.popularity}% popular</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Plug className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No integrations found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || categoryFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by adding your first integration.'}
            </p>
            <Button onClick={handleAddIntegration}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntegrationsPage;
