import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Database, 
  Download, 
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  HardDrive,
  Shield,
  Settings,
  Trash2,
  Play,
  Pause,
  Loader2,
  CloudUpload,
  CloudDownload,
  Archive,
  FileText,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'running' | 'failed' | 'scheduled';
  size: number; // in bytes
  compressedSize: number; // in bytes
  compressionRatio: number; // percentage
  createdAt: string;
  completedAt: string | null;
  duration: number; // in seconds
  source: string;
  destination: string;
  schedule?: BackupSchedule;
  retention: number; // days
  encrypted: boolean;
  verified: boolean;
  tags: string[];
}

interface BackupSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  enabled: boolean;
  nextRun: string;
  lastRun: string | null;
}

const BackupsPage: React.FC = () => {
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
  
  const [backups, setBackups] = useState<Backup[]>([]);
  const [filteredBackups, setFilteredBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [activeSchedules, setActiveSchedules] = useState(3);

  useEffect(() => {
    if (user) {
      loadBackups();
    }
  }, [user]);

  useEffect(() => {
    filterBackups();
  }, [backups, searchTerm, typeFilter, statusFilter]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setData([]);
    } catch (error) {
      console.error('Error loading backups:', error);
      setError('Failed to load backups.');
    } finally {
      setLoading(false);
    }
  };

  const filterBackups = useCallback(() => {
    let filtered = backups;

    if (searchTerm) {
      filtered = filtered.filter(backup =>
        backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        backup.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        backup.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        backup.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(backup => backup.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(backup => backup.status === statusFilter);
    }

    setFilteredBackups(filtered);
  }, [backups, searchTerm, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      
      toast({
        title: "Backup Started",
        description: "Your backup has been initiated successfully.",
      });
      loadBackups();
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backup: Backup) => {
    try {
      
      toast({
        title: "Restore Started",
        description: `Restoring from backup: ${backup.name}`,
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const backupStats = {
    total: backups.length,
    completed: backups.filter(b => b.status === 'completed').length,
    running: backups.filter(b => b.status === 'running').length,
    scheduled: backups.filter(b => b.status === 'scheduled').length,
    failed: backups.filter(b => b.status === 'failed').length,
    totalSize: backups.reduce((sum, b) => sum + b.compressedSize, 0),
    avgCompressionRatio: backups.length > 0 
      ? backups.reduce((sum, b) => sum + b.compressionRatio, 0) / backups.length 
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading backups...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadBackups}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backups</h1>
          <p className="text-muted-foreground mt-2">
            Manage data backups and recovery for your AI workforce.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
            {isCreatingBackup ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="mr-2 h-4 w-4" />
            )}
            Create Backup
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold text-foreground">{backupStats.total}</p>
                <p className="text-sm text-muted-foreground">{activeSchedules} scheduled</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-foreground">{formatSize(backupStats.totalSize)}</p>
                <p className="text-sm text-green-600">-{backupStats.avgCompressionRatio.toFixed(0)}% compressed</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{backupStats.completed}</p>
                <p className="text-sm text-muted-foreground">{backupStats.running} running</p>
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
                <p className="text-2xl font-bold text-red-600">{backupStats.failed}</p>
                <p className="text-sm text-muted-foreground">Needs attention</p>
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
                  placeholder="Search backups..."
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
                <option value="full">Full</option>
                <option value="incremental">Incremental</option>
                <option value="differential">Differential</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <div className="space-y-4">
        {filteredBackups.map((backup) => (
          <Card key={backup.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-foreground">{backup.name}</h3>
                    <Badge className={getStatusColor(backup.status)}>
                      {backup.status}
                    </Badge>
                    <Badge variant="outline">
                      {backup.type}
                    </Badge>
                    {backup.encrypted && (
                      <Badge variant="outline" className="bg-green-50">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}
                    {backup.verified && (
                      <Badge variant="outline" className="bg-blue-50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 font-medium">
                        {formatSize(backup.compressedSize)} 
                        <span className="text-muted-foreground text-xs">
                          ({formatSize(backup.size)} uncompressed)
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{formatDuration(backup.duration)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <span className="ml-2 font-medium">{backup.source}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retention:</span>
                      <span className="ml-2 font-medium">{backup.retention} days</span>
                    </div>
                  </div>

                  {backup.schedule && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">{backup.schedule.frequency}</span>
                          </div>
                          {backup.schedule.time && (
                            <span className="text-muted-foreground">at {backup.schedule.time}</span>
                          )}
                          <Badge variant={backup.schedule.enabled ? "default" : "secondary"}>
                            {backup.schedule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="text-right text-muted-foreground">
                          <div>Next run: {new Date(backup.schedule.nextRun).toLocaleString()}</div>
                          {backup.schedule.lastRun && (
                            <div>Last run: {formatTimeAgo(backup.schedule.lastRun)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex space-x-1">
                      {backup.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(backup.status)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Created {formatTimeAgo(backup.createdAt)}
                  {backup.completedAt && ` • Completed ${formatTimeAgo(backup.completedAt)}`}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                  {backup.status === 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestoreBackup(backup)}
                    >
                      <CloudDownload className="h-4 w-4" />
                    </Button>
                  )}
                  {backup.status === 'running' && (
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4" />
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

      {/* Empty State */}
      {filteredBackups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No backups found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || typeFilter || statusFilter
                ? 'Try adjusting your search criteria.'
                : 'Start by creating your first backup.'}
            </p>
            <Button onClick={handleCreateBackup}>
              <CloudUpload className="mr-2 h-4 w-4" />
              Create Your First Backup
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupsPage;
