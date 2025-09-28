#!/usr/bin/env node

/**
 * AI Code Generation Script
 * Uses Claude Code for intelligent code generation
 */

import { execSync } from 'child_process';

console.log('🤖 Starting AI Code Generation...');

try {
  // Check if Claude Code is available
  execSync('claude --version', { stdio: 'pipe' });
  
  // Start Claude Code session
  console.log('🚀 Starting Claude Code session...');
  execSync('claude start', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error starting Claude Code:', error.message);
  console.log('💡 Make sure Claude Code CLI is installed and configured');
}
