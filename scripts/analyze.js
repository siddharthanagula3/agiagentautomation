#!/usr/bin/env node

/**
 * AI Analysis Script
 * Uses Gemini CLI for comprehensive project analysis
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('🔍 Starting AI Analysis...');

try {
  // Check if Gemini CLI is available
  execSync('gemini --version', { stdio: 'pipe' });
  
  // Run comprehensive analysis
  console.log('📊 Analyzing project structure...');
  execSync('gemini analyze --full-context .', { stdio: 'inherit' });
  
  console.log('✅ Analysis complete!');
} catch (error) {
  console.error('❌ Error running analysis:', error.message);
  console.log('💡 Make sure Gemini CLI is installed and configured');
}
