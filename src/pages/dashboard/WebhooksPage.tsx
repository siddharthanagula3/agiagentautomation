import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../stores/unified-auth-store';
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
  Globe,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  secret?: string;
  created_at: string;
  last_triggered?: string;
  success_count: number;
  error_count: number;
}

const WebhooksPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WebhookData[]>([]);
  const [filteredData, setFilteredData] = useState<WebhookData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    errors: 0,
    totalTriggers: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      setisLoading(true);
      setError(null);
      
      // Set default values immediately for new users
      setData([]);
      setFilteredData([]);
      setStats({
        total: 0,
        // Add other default stats here
      });
      
      // Try to load real data with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service timeout')), 5000)
      );
      
      try {
        const result = await Promise.race([
          // Replace with actual service call
          Promise.resolve({ data: [], error: null }),
          timeoutPromise
        ]);
        
        if (result.error) {
          console.warn('Service error:', result.error);
          // Keep default values
        } else {
          setData(result.data);
          setFilteredData(result.data);
          
          // Calculate real stats from data
          const total = result.data.length;
          // Add other stat calculations here
          
          setStats({
            total,
            // Add other stats here
          });
        }
        
      } catch (serviceError) {
        console.warn('Service failed, using default values:', serviceError);
        // Keep the default values we set above
      } finally {
        setisLoading(false);
      }
    } catch (error) {
      console.error('Error isLoading data:', error);
      setError('Failed to load data');
      setisLoading(false);
    }
  }, []);

  const filterData = useCallback(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(webhook =>
        webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        webhook.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(webhook => webhook.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">isLoading webhooks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {data.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Webhook className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Webhooks Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first webhook to receive real-time notifications.
          </p>
          <Button onClick={() => setShowCreateWebhook(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Webhook
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Manage webhooks to receive real-time notifications.
          </p>
        </div>
        <Button onClick={() => setShowCreateWebhook(true)}>
              <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTriggers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            <option value="error">Error</option>
              </select>
            </div>
          </div>

      {/* Webhooks List */}
      {filteredData.length > 0 ? (
      <div className="space-y-4">
          {filteredData.map((webhook) => (
            <Card key={webhook.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                    <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Webhook className="h-5 w-5 text-primary-foreground" />
                      </div>
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription className="font-mono text-sm">{webhook.url}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(webhook.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(webhook.status)}
                        <span className="capitalize">{webhook.status}</span>
                      </div>
                    </Badge>
                      </div>
                    </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Events</span>
                      <div className="font-semibold">{webhook.events.length} events</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate</span>
                      <div className="font-semibold">
                        {webhook.success_count + webhook.error_count > 0 
                          ? Math.round((webhook.success_count / (webhook.success_count + webhook.error_count)) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Triggered</span>
                      <div className="font-semibold">
                        {webhook.last_triggered ? formatDate(webhook.last_triggered) : 'Never'}
                    </div>
                    </div>
                  </div>

                  {webhook.events.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Events</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map((event, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      </div>
                    </div>
                  )}
                  
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
      ) : data.length > 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No webhooks found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
                      </div>
      ) : null}

      {/* Create Webhook Modal */}
      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Webhook</CardTitle>
              <CardDescription>
                Add a new webhook to receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                      <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="Enter webhook name" />
                      </div>
                
                      <div>
                  <label className="text-sm font-medium">URL</label>
                  <Input placeholder="https://example.com/webhook" />
                      </div>
                
                      <div>
                  <label className="text-sm font-medium">Events</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="job-created" />
                      <label htmlFor="job-created" className="text-sm">Job Created</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="job-completed" />
                      <label htmlFor="job-completed" className="text-sm">Job Completed</label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <input type="checkbox" id="employee-added" />
                      <label htmlFor="employee-added" className="text-sm">Employee Added</label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setShowCreateWebhook(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Create Webhook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      )}
    </div>
  );
};

export default WebhooksPage;
