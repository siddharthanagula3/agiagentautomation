import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  Key,
  Plus,
  Search,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface APIKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'inactive' | 'expired';
  permissions: string[];
  created_at: string;
  last_used?: string;
  expires_at?: string;
  usage_count: number;
  rate_limit?: number;
}

const APIKeysPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<APIKey[]>([]);
  const [filteredData, setFilteredData] = useState<APIKey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
    totalUsage: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for demonstration
      const mockData: APIKey[] = [];
      setData(mockData);
      setFilteredData(mockData);
      
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        expired: 0,
        totalUsage: 0
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterData = useCallback(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(key =>
        key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(key => key.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newKey: APIKey = {
        id: `key-${Date.now()}`,
        name: newKeyData.name,
        key: `sk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        status: 'active',
        permissions: newKeyData.permissions,
        created_at: new Date().toISOString(),
        usage_count: 0,
        expires_at: newKeyData.expiresAt || undefined
      };

      setData(prev => [newKey, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, active: prev.active + 1 }));
      setShowCreateDialog(false);
      setNewKeyData({ name: '', permissions: [], expiresAt: '' });
      toast.success('API key created successfully!');
      
    } catch (error) {
      toast.error('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(prev => prev.filter(k => k.id !== keyId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'inactive': return 'bg-muted text-muted-foreground border';
      case 'expired': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '...' + key.substring(key.length - 4);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newShowKeys = new Set(showKeys);
    if (newShowKeys.has(keyId)) {
      newShowKeys.delete(keyId);
    } else {
      newShowKeys.add(keyId);
    }
    setShowKeys(newShowKeys);
  };

  const togglePermission = (permission: string) => {
    setNewKeyData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (isLoading) {
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
          <Button variant="outline" onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for secure access to our services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading && 'animate-spin'}`} />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search API keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {data.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first API key to start integrating with our services
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {filteredData.length > 0 && (
        <div className="space-y-4">
          {filteredData.map((apiKey) => (
            <Card key={apiKey.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                      <CardDescription className="font-mono text-sm">
                        {showKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(apiKey.status)}>
                    {apiKey.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <div className="font-semibold">{formatDate(apiKey.created_at)}</div>
                    </div>
                    {apiKey.last_used && (
                      <div>
                        <span className="text-muted-foreground">Last Used</span>
                        <div className="font-semibold">{formatDate(apiKey.last_used)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Usage Count</span>
                      <div className="font-semibold">{apiKey.usage_count.toLocaleString()}</div>
                    </div>
                  </div>

                  {apiKey.permissions.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Permissions</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {apiKey.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {showKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {data.length > 0 && filteredData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for your applications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                placeholder="Enter key name"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                {['read', 'write', 'admin'].map(perm => (
                  <div key={perm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={perm}
                      checked={newKeyData.permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="rounded"
                    />
                    <label htmlFor={perm} className="text-sm capitalize">{perm} Access</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="expires">Expiration (Optional)</Label>
              <Input
                id="expires"
                type="date"
                value={newKeyData.expiresAt}
                onChange={(e) => setNewKeyData(prev => ({ ...prev, expiresAt: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} className="gradient-primary">
                Create API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default APIKeysPage;
