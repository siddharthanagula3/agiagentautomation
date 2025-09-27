import React, { useState, 
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual data fetching
      setData([]);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { 
  Webhook,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  Square,
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
  Square as SquareIcon,
  Send,
  TestTube,
  History,
  Bell,
  Shield,
  Key
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface Webhook {
  id: string;
  name: string;
  url: string;
  description: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed' | 'testing';
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  createdAt: string;
  lastTriggered?: string;
  deliveryStats: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
  recentDeliveries: WebhookDelivery[];
  createdBy: string;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
  timeout: number; // in seconds
  isVerified: boolean;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  url: string;
  requestId: string;
  responseCode?: number;
  responseTime?: number;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  deliveredAt?: string;
  error?: string;
  payload: any;
}

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  payload: any;
}

const WebhooksPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [filteredWebhooks, setFilteredWebhooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user]);

  useEffect(() => {
    filterWebhooks();
  }, [webhooks, searchTerm, statusFilter, environmentFilter]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError('');
      
      
      
      

      
      
      setWebhooks(mockWebhooks);
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      setError('Failed to load webhooks.');
    } finally {
      setLoading(false);
    }
  };

  const filterWebhooks = useCallback(() => {
    let filtered = webhooks;

    if (searchTerm) {
      filtered = filtered.filter(webhook =>
        webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(webhook => webhook.status === statusFilter);
    }

    if (environmentFilter) {
      filtered = filtered.filter(webhook => webhook.environment === environmentFilter);
    }

    setFilteredWebhooks(filtered);
  }, [webhooks, searchTerm, statusFilter, environmentFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'testing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <SquareIcon className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <TestTube className="h-4 w-4 text-blue-500" />;
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

  const toggleSecretVisibility = (webhookId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }));
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copied",
      description: "Webhook secret copied to clipboard",
    });
  };

  const handleCreateWebhook = async () => {
    setIsCreatingWebhook(true);
    try {
      
      toast({
        title: "Webhook Created",
        description: "Your new webhook has been created successfully.",
      });
      loadWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create webhook.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      
      toast({
        title: "Test Sent",
        description: "Test webhook has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test webhook.",
        variant: "destructive",
      });
    }
  };

  const handleToggleWebhookStatus = async (webhookId: string) => {
    try {
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === webhookId 
          ? { ...webhook, status: webhook.status === 'active' ? 'inactive' : 'active' }
          : webhook
      ));
      toast({
        title: "Status Updated",
        description: "Webhook status has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  };

  const webhookStats = {
    total: webhooks.length,
    active: webhooks.filter(w => w.status === 'active').length,
    failed: webhooks.filter(w => w.status === 'failed').length,
    testing: webhooks.filter(w => w.status === 'testing').length,
    totalDeliveries: webhooks.reduce((sum, w) => sum + w.deliveryStats.total, 0),
    successRate: webhooks.length > 0 
      ? webhooks.reduce((sum, w) => sum + (w.deliveryStats.successful / w.deliveryStats.total), 0) / webhooks.length * 100
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading webhooks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadWebhooks}>Retry</Button>
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
          <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications from your AI workforce.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={handleCreateWebhook} disabled={isCreatingWebhook}>
            {isCreatingWebhook ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Webhook
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold text-foreground">{webhookStats.total}</p>
                <p className="text-sm text-green-600">{webhookStats.active} active</p>
              </div>
              <Webhook className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">{webhookStats.totalDeliveries.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{webhookStats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Average</p>
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
                <p className="text-2xl font-bold text-red-600">{webhookStats.failed}</p>
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
                  placeholder="Search webhooks..."
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
                <option value="failed">Failed</option>
                <option value="testing">Testing</option>
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

      {/* Webhooks List */}
      <div className="space-y-4">
        {filteredWebhooks.map((webhook) => (
          <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Webhook className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{webhook.name}</h3>
                    <Badge className={getStatusColor(webhook.status)}>
                      {webhook.status}
                    </Badge>
                    <Badge className={getEnvironmentColor(webhook.environment)}>
                      {webhook.environment}
                    </Badge>
                    {webhook.isVerified && (
                      <Badge variant="outline" className="bg-green-50">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{webhook.description}</p>
                  
                  {/* URL */}
                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Webhook URL</p>
                        <code className="text-sm font-mono break-all">{webhook.url}</code>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(webhook.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Secret */}
                  {webhook.secret && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Webhook Secret</p>
                          <code className="text-sm font-mono">
                            {showSecrets[webhook.id] 
                              ? webhook.secret
                              : '••••••••••••••••••••••••••••••••'}
                          </code>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySecret(webhook.secret || '')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Total Deliveries:</span>
                      <span className="ml-2 font-medium">{webhook.deliveryStats.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {((webhook.deliveryStats.successful / webhook.deliveryStats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Triggered:</span>
                      <span className="ml-2 font-medium">
                        {webhook.lastTriggered ? formatTimeAgo(webhook.lastTriggered) : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeout:</span>
                      <span className="ml-2 font-medium">{webhook.timeout}s</span>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-muted-foreground">Events:</span>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map((event, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Delivery Stats */}
                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Delivery Statistics</p>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Successful:</span>
                        <span className="ml-2 font-medium text-green-600">{webhook.deliveryStats.successful}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">{webhook.deliveryStats.failed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <span className="ml-2 font-medium text-yellow-600">{webhook.deliveryStats.pending}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retry Policy:</span>
                        <span className="ml-2 font-medium">{webhook.retryPolicy.maxRetries} retries</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {webhook.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(webhook.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {formatTimeAgo(webhook.createdAt)}
                  {webhook.lastTriggered && ` • Last triggered ${formatTimeAgo(webhook.lastTriggered)}`}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook.id)}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleWebhookStatus(webhook.id)}
                  >
                    {webhook.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
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
      {filteredWebhooks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Webhook className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No webhooks found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter || environmentFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first webhook.'}
            </p>
            <Button onClick={handleCreateWebhook}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebhooksPage;
