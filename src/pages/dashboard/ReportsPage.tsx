import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/auth-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'analytics' | 'financial' | 'performance' | 'usage';
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  generated_at?: string;
  file_url?: string;
  size?: number;
  description?: string;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Report[]>([]);
  const [filteredData, setFilteredData] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    generating: 0,
    failed: 0,
    totalSize: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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
      }
      
      setLoading(false);
    }
  }, []);

  const filterData = useCallback(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(report => report.type === typeFilter);
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, typeFilter]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analytics': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'usage': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading reports...</span>
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
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate your first report to track your AI workforce performance.
          </p>
          <Button onClick={() => setShowCreateReport(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Your First Report
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage performance reports.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateReport(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.generating}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="">All Types</option>
            <option value="analytics">Analytics</option>
            <option value="financial">Financial</option>
            <option value="performance">Performance</option>
            <option value="usage">Usage</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredData.length > 0 ? (
        <div className="space-y-4">
          {filteredData.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(report.type)}>
                      {report.type}
                    </Badge>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <div className="font-semibold">{formatDate(report.created_at)}</div>
                    </div>
                    {report.generated_at && (
                      <div>
                        <span className="text-muted-foreground">Generated</span>
                        <div className="font-semibold">{formatDate(report.generated_at)}</div>
                      </div>
                    )}
                    {report.size && (
                      <div>
                        <span className="text-muted-foreground">Size</span>
                        <div className="font-semibold">{formatFileSize(report.size)}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    {report.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
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
          <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : null}

      {/* Create Report Modal */}
      {showCreateReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>
                Create a new performance report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Title</label>
                  <Input placeholder="Enter report title" />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="analytics">Analytics Report</option>
                    <option value="financial">Financial Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="usage">Usage Report</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Enter report description" />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setShowCreateReport(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Generate Report
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

export default ReportsPage;