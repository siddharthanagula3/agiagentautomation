#!/usr/bin/env tsx

/**
 * Database cleanup script
 * Removes old data, optimizes tables, and maintains database health
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CleanupOptions {
  dryRun?: boolean;
  olderThanDays?: number;
  batchSize?: number;
}

async function cleanupDatabase(options: CleanupOptions = {}) {
  const { dryRun = false, olderThanDays = 30, batchSize = 1000 } = options;

  console.log('🧹 Starting database cleanup...');
  console.log(`📅 Cleaning data older than ${olderThanDays} days`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`🔍 Dry run: ${dryRun ? 'YES' : 'NO'}`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    // Clean up old chat messages
    console.log('💬 Cleaning old chat messages...');
    const { data: oldMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .lt('created_at', cutoffDate.toISOString())
      .limit(batchSize);

    if (messagesError) {
      console.error('❌ Error fetching old messages:', messagesError);
      return;
    }

    if (oldMessages && oldMessages.length > 0) {
      console.log(`📊 Found ${oldMessages.length} old messages`);

      if (!dryRun) {
        const { error: deleteError } = await supabase
          .from('chat_messages')
          .delete()
          .in(
            'id',
            oldMessages.map((m) => m.id)
          );

        if (deleteError) {
          console.error('❌ Error deleting old messages:', deleteError);
        } else {
          console.log('✅ Deleted old messages');
        }
      }
    }

    // Clean up old sessions
    console.log('🔐 Cleaning old sessions...');
    const { data: oldSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .lt('created_at', cutoffDate.toISOString())
      .limit(batchSize);

    if (sessionsError) {
      console.error('❌ Error fetching old sessions:', sessionsError);
      return;
    }

    if (oldSessions && oldSessions.length > 0) {
      console.log(`📊 Found ${oldSessions.length} old sessions`);

      if (!dryRun) {
        const { error: deleteError } = await supabase
          .from('user_sessions')
          .delete()
          .in(
            'id',
            oldSessions.map((s) => s.id)
          );

        if (deleteError) {
          console.error('❌ Error deleting old sessions:', deleteError);
        } else {
          console.log('✅ Deleted old sessions');
        }
      }
    }

    // Clean up old automation executions
    console.log('🤖 Cleaning old automation executions...');
    const { data: oldExecutions, error: executionsError } = await supabase
      .from('automation_executions')
      .select('id')
      .lt('created_at', cutoffDate.toISOString())
      .limit(batchSize);

    if (executionsError) {
      console.error('❌ Error fetching old executions:', executionsError);
      return;
    }

    if (oldExecutions && oldExecutions.length > 0) {
      console.log(`📊 Found ${oldExecutions.length} old executions`);

      if (!dryRun) {
        const { error: deleteError } = await supabase
          .from('automation_executions')
          .delete()
          .in(
            'id',
            oldExecutions.map((e) => e.id)
          );

        if (deleteError) {
          console.error('❌ Error deleting old executions:', deleteError);
        } else {
          console.log('✅ Deleted old executions');
        }
      }
    }

    // Clean up old audit logs (keep only last 90 days)
    console.log('📋 Cleaning old audit logs...');
    const auditCutoffDate = new Date();
    auditCutoffDate.setDate(auditCutoffDate.getDate() - 90);

    const { data: oldAuditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id')
      .lt('created_at', auditCutoffDate.toISOString())
      .limit(batchSize);

    if (auditError) {
      console.error('❌ Error fetching old audit logs:', auditError);
      return;
    }

    if (oldAuditLogs && oldAuditLogs.length > 0) {
      console.log(`📊 Found ${oldAuditLogs.length} old audit logs`);

      if (!dryRun) {
        const { error: deleteError } = await supabase
          .from('audit_logs')
          .delete()
          .in(
            'id',
            oldAuditLogs.map((a) => a.id)
          );

        if (deleteError) {
          console.error('❌ Error deleting old audit logs:', deleteError);
        } else {
          console.log('✅ Deleted old audit logs');
        }
      }
    }

    // Optimize tables
    console.log('⚡ Optimizing tables...');
    if (!dryRun) {
      const { error: optimizeError } = await supabase.rpc('optimize_tables');
      if (optimizeError) {
        console.log('⚠️  Warning: Table optimization not available or failed');
      } else {
        console.log('✅ Tables optimized');
      }
    }

    console.log('✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanupOptions = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--older-than':
      options.olderThanDays = parseInt(args[i + 1]);
      i++;
      break;
    case '--batch-size':
      options.batchSize = parseInt(args[i + 1]);
      i++;
      break;
    case '--help':
      console.log(`
Database Cleanup Script

Usage: tsx scripts/maintenance/cleanup-db.ts [options]

Options:
  --dry-run              Show what would be deleted without actually deleting
  --older-than <days>    Clean data older than specified days (default: 30)
  --batch-size <size>    Process in batches of specified size (default: 1000)
  --help                 Show this help message

Examples:
  tsx scripts/maintenance/cleanup-db.ts --dry-run
  tsx scripts/maintenance/cleanup-db.ts --older-than 60 --batch-size 500
      `);
      process.exit(0);
  }
}

// Run the cleanup
cleanupDatabase(options);
