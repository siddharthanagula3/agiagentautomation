/**
 * Backup and Disaster Recovery Service
 * Handles automated backups, data recovery, and disaster recovery procedures
 */

import { supabase } from '@/lib/supabase-client';
import { monitoringService } from './monitoring-service';

interface BackupConfig {
  enableAutomatedBackups: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly';
  retentionDays: number;
  enableCloudBackup: boolean;
  enableLocalBackup: boolean;
  cloudProvider: 'aws' | 'gcp' | 'azure' | 'supabase';
  encryptionEnabled: boolean;
}

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

interface RestoreOptions {
  backupId: string;
  tables?: string[];
  pointInTime?: Date;
  dryRun?: boolean;
}

class BackupService {
  private isInitialized = false;
  private config: BackupConfig;
  private backupInterval: NodeJS.Timeout | null = null;
  private backups: BackupMetadata[] = [];

  constructor() {
    this.config = {
      enableAutomatedBackups: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      enableCloudBackup: true,
      enableLocalBackup: false,
      cloudProvider: 'supabase',
      encryptionEnabled: true,
    };
  }

  /**
   * Initialize backup service
   */
  initialize(config?: Partial<BackupConfig>): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    if (this.config.enableAutomatedBackups) {
      this.startAutomatedBackups();
    }

    this.loadBackupHistory();
    this.isInitialized = true;

    console.log('BackupService initialized with config:', this.config);
    monitoringService.trackEvent('backup_service_initialized', this.config);
  }

  /**
   * Start automated backup schedule
   */
  private startAutomatedBackups(): void {
    const intervalMs = this.getBackupIntervalMs();
    
    this.backupInterval = setInterval(() => {
      this.performBackup('incremental');
    }, intervalMs);

    console.log(`Automated backups scheduled every ${this.config.backupFrequency}`);
  }

  /**
   * Get backup interval in milliseconds
   */
  private getBackupIntervalMs(): number {
    switch (this.config.backupFrequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Perform backup
   */
  async performBackup(type: 'full' | 'incremental' | 'differential' = 'incremental'): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const timestamp = new Date();
    
    const backup: BackupMetadata = {
      id: backupId,
      timestamp,
      type,
      size: 0,
      status: 'in_progress',
      tables: [],
      checksum: '',
      location: '',
    };

    try {
      monitoringService.trackEvent('backup_started', { backupId, type });
      
      // Get list of tables to backup
      const tables = await this.getTablesToBackup();
      backup.tables = tables;

      // Perform the backup
      const backupData = await this.createBackupData(tables, type);
      backup.size = this.calculateBackupSize(backupData);
      backup.checksum = this.calculateChecksum(backupData);

      // Store backup
      if (this.config.enableCloudBackup) {
        backup.location = await this.storeCloudBackup(backupId, backupData);
      }
      
      if (this.config.enableLocalBackup) {
        await this.storeLocalBackup(backupId, backupData);
      }

      // Save backup metadata
      await this.saveBackupMetadata(backup);
      
      backup.status = 'completed';
      this.backups.push(backup);

      monitoringService.trackEvent('backup_completed', {
        backupId,
        type,
        size: backup.size,
        tables: backup.tables.length,
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return backup;
    } catch (error) {
      backup.status = 'failed';
      monitoringService.captureError(error as Error, {
        context: 'backup_operation',
        backupId,
        type,
      });
      throw error;
    }
  }

  /**
   * Get list of tables to backup
   */
  private async getTablesToBackup(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'backup_metadata');

      if (error) throw error;

      return data.map(row => row.table_name);
    } catch (error) {
      console.error('Error getting tables to backup:', error);
      return [];
    }
  }

  /**
   * Create backup data
   */
  private async createBackupData(tables: string[], type: string): Promise<Record<string, any[]>> {
    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) throw error;

        backupData[table] = data || [];
      } catch (error) {
        console.error(`Error backing up table ${table}:`, error);
        backupData[table] = [];
      }
    }

    return backupData;
  }

  /**
   * Store backup in cloud
   */
  private async storeCloudBackup(backupId: string, data: Record<string, any[]>): Promise<string> {
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      data,
    };

    const { data: result, error } = await supabase
      .from('backup_storage')
      .insert({
        backup_id: backupId,
        data: backupData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return `cloud://backup_storage/${backupId}`;
  }

  /**
   * Store backup locally
   */
  private async storeLocalBackup(backupId: string, data: Record<string, any[]>): Promise<void> {
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      data,
    };

    // In a real implementation, this would save to local storage or file system
    localStorage.setItem(`backup_${backupId}`, JSON.stringify(backupData));
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(backup: BackupMetadata): Promise<void> {
    const { error } = await supabase
      .from('backup_metadata')
      .insert({
        id: backup.id,
        timestamp: backup.timestamp.toISOString(),
        type: backup.type,
        size: backup.size,
        status: backup.status,
        tables: backup.tables,
        checksum: backup.checksum,
        location: backup.location,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Load backup history
   */
  private async loadBackupHistory(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      this.backups = data.map(row => ({
        id: row.id,
        timestamp: new Date(row.timestamp),
        type: row.type,
        size: row.size,
        status: row.status,
        tables: row.tables,
        checksum: row.checksum,
        location: row.location,
      }));
    } catch (error) {
      console.error('Error loading backup history:', error);
      this.backups = [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const { backupId, tables, pointInTime, dryRun = false } = options;

    try {
      monitoringService.trackEvent('restore_started', { backupId, dryRun });

      // Find backup
      const backup = this.backups.find(b => b.id === backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Load backup data
      const backupData = await this.loadBackupData(backupId);
      if (!backupData) {
        throw new Error(`Backup data for ${backupId} not found`);
      }

      if (dryRun) {
        console.log('Dry run restore - would restore:', {
          backupId,
          tables: tables || Object.keys(backupData.data),
          pointInTime,
        });
        return;
      }

      // Restore tables
      const tablesToRestore = tables || Object.keys(backupData.data);
      
      for (const table of tablesToRestore) {
        if (backupData.data[table]) {
          await this.restoreTable(table, backupData.data[table]);
        }
      }

      monitoringService.trackEvent('restore_completed', {
        backupId,
        tables: tablesToRestore,
      });

    } catch (error) {
      monitoringService.captureError(error as Error, {
        context: 'restore_operation',
        backupId,
        options,
      });
      throw error;
    }
  }

  /**
   * Load backup data
   */
  private async loadBackupData(backupId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('backup_storage')
        .select('data')
        .eq('backup_id', backupId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error loading backup data:', error);
      return null;
    }
  }

  /**
   * Restore table data
   */
  private async restoreTable(tableName: string, data: any[]): Promise<void> {
    try {
      // Clear existing data
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) throw deleteError;

      // Insert backup data
      if (data.length > 0) {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(data);

        if (insertError) throw insertError;
      }

      console.log(`Restored ${data.length} records to table ${tableName}`);
    } catch (error) {
      console.error(`Error restoring table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldBackups = this.backups.filter(
      backup => backup.timestamp < cutoffDate
    );

    for (const backup of oldBackups) {
      try {
        // Delete from cloud storage
        if (this.config.enableCloudBackup) {
          await supabase
            .from('backup_storage')
            .delete()
            .eq('backup_id', backup.id);
        }

        // Delete from local storage
        if (this.config.enableLocalBackup) {
          localStorage.removeItem(`backup_${backup.id}`);
        }

        // Delete metadata
        await supabase
          .from('backup_metadata')
          .delete()
          .eq('id', backup.id);

        console.log(`Cleaned up old backup: ${backup.id}`);
      } catch (error) {
        console.error(`Error cleaning up backup ${backup.id}:`, error);
      }
    }

    // Update local backup list
    this.backups = this.backups.filter(
      backup => backup.timestamp >= cutoffDate
    );
  }

  /**
   * Get backup history
   */
  getBackupHistory(): BackupMetadata[] {
    return [...this.backups];
  }

  /**
   * Get backup status
   */
  getBackupStatus(): {
    isEnabled: boolean;
    lastBackup: BackupMetadata | null;
    nextBackup: Date | null;
    totalBackups: number;
    totalSize: number;
  } {
    const lastBackup = this.backups[0] || null;
    const nextBackup = this.backupInterval 
      ? new Date(Date.now() + this.getBackupIntervalMs())
      : null;
    const totalSize = this.backups.reduce((sum, backup) => sum + backup.size, 0);

    return {
      isEnabled: this.config.enableAutomatedBackups,
      lastBackup,
      nextBackup,
      totalBackups: this.backups.length,
      totalSize,
    };
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate backup size
   */
  private calculateBackupSize(data: Record<string, any[]>): number {
    return JSON.stringify(data).length;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(data: Record<string, any[]>): string {
    // Simple checksum - in production, use a proper hash function
    return btoa(JSON.stringify(data)).substr(0, 16);
  }

  /**
   * Stop automated backups
   */
  stopAutomatedBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  /**
   * Test backup and restore
   */
  async testBackupRestore(): Promise<boolean> {
    try {
      // Create a test backup
      const backup = await this.performBackup('full');
      
      // Test restore (dry run)
      await this.restoreBackup({
        backupId: backup.id,
        dryRun: true,
      });

      return true;
    } catch (error) {
      console.error('Backup/restore test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const backupService = new BackupService();
