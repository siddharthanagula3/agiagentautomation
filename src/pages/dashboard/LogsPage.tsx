import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  FileText,
  Download,
  Search,
  Filter,
  Eye,
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
  Key,
  Calendar,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Upload,
  Archive,
  Trash,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
}

interface LogFilter {
  level: string;
  service: string;
  environment: string;
  dateRange: {
    start: string;
    end: string;
  };
  searchTerm: string;
}

const LogsPage: React.FC = () => {
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
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter, serviceFilter, environmentFilter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadLogs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      
      
      
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      if (!silent) setError('Failed to load logs.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filterLogs = useCallback(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (levelFilter) {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (serviceFilter) {
      filtered = filtered.filter(log => log.service === serviceFilter);
    }

    if (environmentFilter) {
      filtered = filtered.filter(log => log.environment === environmentFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, serviceFilter, environmentFilter]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'fatal':
        return 'bg-red-200 text-red-900 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug':
        return <Info className="h-4 w-4 text-gray-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'fatal':
        return <Ban className="h-4 w-4 text-red-600" />;
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

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      
      toast({
        title: "Export Started",
        description: "Logs are being exported and will be available for download shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export logs.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLog = (log: LogEntry) => {
    const logText = `[${log.timestamp}] ${log.level.toUpperCase()} ${log.service}: ${log.message}`;
    navigator.clipboard.writeText(logText);
    toast({
      title: "Copied",
      description: "Log entry copied to clipboard",
    });
  };

  const logStats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error' || l.level === 'fatal').length,
    warnings: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
    services: [...new Set(logs.map(l => l.service))].length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={() => loadLogs()}>Retry</Button>
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
          <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system activity, errors, and performance metrics in real-time.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" onClick={() => loadLogs()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportLogs} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold text-foreground">{logStats.total}</p>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{logStats.errors}</p>
                <p className="text-sm text-muted-foreground">Need attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{logStats.warnings}</p>
                <p className="text-sm text-muted-foreground">Monitor closely</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services</p>
                <p className="text-2xl font-bold text-blue-600">{logStats.services}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Levels</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Services</option>
                <option value="ai-worker">AI Worker</option>
                <option value="api-gateway">API Gateway</option>
                <option value="database">Database</option>
                <option value="auth-service">Auth Service</option>
                <option value="payment-processor">Payment Processor</option>
                <option value="webhook-delivery">Webhook Delivery</option>
                <option value="analytics">Analytics</option>
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

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getLevelIcon(log.level)}
                    <Badge className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {log.service}
                    </Badge>
                    <Badge className={getEnvironmentColor(log.environment)}>
                      {log.environment}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground mb-2 font-medium">{log.message}</p>
                  
                  {log.details && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Details</p>
                      <pre className="text-xs font-mono text-foreground overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    {log.userId && (
                      <span>User: {log.userId}</span>
                    )}
                    {log.sessionId && (
                      <span>Session: {log.sessionId}</span>
                    )}
                    {log.requestId && (
                      <span>Request: {log.requestId}</span>
                    )}
                    {log.duration && (
                      <span>Duration: {log.duration}ms</span>
                    )}
                  </div>

                  {log.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-muted-foreground">Tags:</span>
                      <div className="flex space-x-1">
                        {log.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLog(log)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No logs found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || levelFilter || serviceFilter || environmentFilter
                ? 'Try adjusting your search criteria.'
                : 'No logs available for the selected time period.'}
            </p>
            <Button onClick={() => loadLogs()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Logs
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LogsPage;
