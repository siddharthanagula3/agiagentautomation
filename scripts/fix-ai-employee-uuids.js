#!/usr/bin/env node

/**
 * Fix AI Employee UUIDs
 * Updates the migration file to use proper UUID format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250110000008_add_comprehensive_ai_employees.sql');
let migrationContent = fs.readFileSync(migrationPath, 'utf8');

// Generate UUIDs for each employee
const employeeIds = [
  'emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005',
  'emp-006', 'emp-007', 'emp-008', 'emp-009', 'emp-010',
  'emp-011', 'emp-012', 'emp-013', 'emp-014', 'emp-015',
  'emp-016', 'emp-017', 'emp-018', 'emp-019', 'emp-020',
  'emp-021', 'emp-022', 'emp-023', 'emp-024', 'emp-025',
  'emp-026', 'emp-027', 'emp-028', 'emp-029', 'emp-030',
  'emp-031', 'emp-032', 'emp-033', 'emp-034', 'emp-035',
  'emp-036', 'emp-037', 'emp-038', 'emp-039', 'emp-040',
  'emp-041', 'emp-042', 'emp-043', 'emp-044', 'emp-045',
  'emp-046', 'emp-047', 'emp-048', 'emp-049', 'emp-050'
];

// Replace each employee ID with a proper UUID
employeeIds.forEach((oldId, index) => {
  const newUuid = `550e8400-e29b-41d4-a716-44665544${String(index + 10).padStart(4, '0')}`;
  migrationContent = migrationContent.replace(new RegExp(`'${oldId}'`, 'g'), `'${newUuid}'`);
});

// Write the updated migration file
fs.writeFileSync(migrationPath, migrationContent);

console.log('✅ Fixed all AI employee UUIDs in migration file');
console.log('🎯 Migration file is now ready to run');
