/**
 * Backup Dashboard Component
 * Provides interface for managing backups and disaster recovery
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { backupService } from '@/services/backup-service';
import { monitoringService } from '@/services/monitoring-service';
import { toast } from 'sonner';

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tables: string[];
  checksum: string;
  location: string;
}

interface BackupDashboardProps {
  className?: string;
}

const BackupDashboard: React.FC<BackupDashboardProps> = ({ className }) => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [backupStatus, setBackupStatus] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    setIsLoading(true);
    try {
      const backupHistory = backupService.getBackupHistory();
      const status = backupService.getBackupStatus();
      
      setBackups(backupHistory);
      setBackupStatus(status);
    } catch (error) {
      console.error('Error loading backup data:', error);
      toast.error('Failed to load backup data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (type: 'full' | 'incremental' | 'differential') => {
    setIsLoading(true);
    try {
      const backup = await backupService.performBackup(type);
      toast.success(`${type} backup created successfully`);
      await loadBackupData();
      
      monitoringService.trackEvent('manual_backup_created', {
        type,
        backupId: backup.id,
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setIsLoading(true);
    try {
      await backupService.restoreBackup({
        backupId: selectedBackup,
        dryRun: false,
      });
      toast.success('Backup restored successfully');
      setRestoreDialogOpen(false);
      
      monitoringService.trackEvent('backup_restored', {
        backupId: selectedBackup,
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestBackup = async () => {
    setIsLoading(true);
    try {
      const success = await backupService.testBackupRestore();
      if (success) {
        toast.success('Backup/restore test completed successfully');
      } else {
        toast.error('Backup/restore test failed');
      }
      setTestDialogOpen(false);
      
      monitoringService.trackEvent('backup_test_completed', { success });
    } catch (error) {
      console.error('Error testing backup:', error);
      toast.error('Failed to test backup system');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (isLoading && !backupStatus) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Backup Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading backup information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Backup Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Backup Status
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={backupStatus?.isEnabled ? 'default' : 'secondary'}>
                {backupStatus?.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Button variant="outline" size="sm" onClick={loadBackupData}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{backupStatus?.totalBackups || 0}</div>
              <p className="text-sm text-muted-foreground">Total Backups</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatFileSize(backupStatus?.totalSize || 0)}</div>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {backupStatus?.lastBackup ? formatDate(backupStatus.lastBackup.timestamp) : 'Never'}
              </div>
              <p className="text-sm text-muted-foreground">Last Backup</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {backupStatus?.nextBackup ? formatDate(backupStatus.nextBackup) : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Next Backup</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Backup Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleCreateBackup('full')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Create Full Backup
            </Button>
            <Button
              onClick={() => handleCreateBackup('incremental')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Create Incremental Backup
            </Button>
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Test Backup System
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Test Backup System</DialogTitle>
                  <DialogDescription>
                    This will create a test backup and perform a dry-run restore to verify the system is working correctly.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTestBackup} disabled={isLoading}>
                    {isLoading ? 'Testing...' : 'Run Test'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No backups found</p>
              <p className="text-sm text-muted-foreground">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="font-medium">{backup.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(backup.timestamp)} • {backup.type} • {formatFileSize(backup.size)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {backup.tables.length} tables
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(backup.status)}>
                      {backup.status}
                    </Badge>
                    <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBackup(backup.id)}
                          disabled={backup.status !== 'completed'}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restore Backup</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to restore from backup "{backup.id}"? 
                            This will overwrite current data.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRestoreBackup} disabled={isLoading}>
                            {isLoading ? 'Restoring...' : 'Restore'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupDashboard;
