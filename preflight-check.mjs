#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AGI Agent Automation - Preflight Check');
console.log('==========================================\n');

let allChecksPassed = true;

function check(description, test) {
  try {
    const result = test();
    if (result) {
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.log(`❌ ${description}`);
      allChecksPassed = false;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - ${error.message}`);
    allChecksPassed = false;
    return false;
  }
}

// Check Node.js version
check('Node.js version (>=18.0.0)', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 18;
});

// Check package.json exists
check('package.json exists', () => {
  return fs.existsSync(path.join(__dirname, 'package.json'));
});

// Check dependencies are installed
check('Dependencies installed', () => {
  return fs.existsSync(path.join(__dirname, 'node_modules'));
});

// Check .env file exists
check('.env file exists', () => {
  return fs.existsSync(path.join(__dirname, '.env'));
});

// Check .env has required variables
check('.env has required variables', () => {
  if (!fs.existsSync(path.join(__dirname, '.env'))) return false;
  
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  return requiredVars.every(varName => envContent.includes(varName));
});

// Check AI API key configured
check('AI API key configured', () => {
  if (!fs.existsSync(path.join(__dirname, '.env'))) return false;
  
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  return envContent.includes('VITE_ANTHROPIC_API_KEY') || 
         envContent.includes('VITE_GOOGLE_AI_API_KEY');
});

// Check project structure
check('Project structure', () => {
  const requiredDirs = ['src', 'src/components', 'src/pages', 'src/services'];
  return requiredDirs.every(dir => fs.existsSync(path.join(__dirname, dir)));
});

// Check migration files exist
check('Migration files exist', () => {
  const migrationDir = path.join(__dirname, 'supabase', 'migrations');
  if (!fs.existsSync(migrationDir)) return false;
  
  const files = fs.readdirSync(migrationDir);
  return files.some(file => file.endsWith('.sql'));
});

// Check TypeScript config
check('TypeScript config', () => {
  return fs.existsSync(path.join(__dirname, 'tsconfig.json'));
});

// Check Vite config
check('Vite config', () => {
  return fs.existsSync(path.join(__dirname, 'vite.config.ts')) || 
         fs.existsSync(path.join(__dirname, 'vite.config.js'));
});

console.log('\n==========================================');

if (allChecksPassed) {
  console.log('🎉 PRE-FLIGHT CHECK PASSED!');
  console.log('✅ Your system is ready for implementation!');
  console.log('\n📋 Next Steps:');
  console.log('1. Get Supabase credentials (ENV_SETUP_GUIDE.md)');
  console.log('2. Get AI API key (ENV_SETUP_GUIDE.md)');
  console.log('3. Setup database (DATABASE_SETUP_COMPLETE.md)');
  console.log('4. Start application: npm run dev');
} else {
  console.log('❌ PRE-FLIGHT CHECK FAILED!');
  console.log('🔧 Please fix the issues above before continuing.');
  console.log('\n📖 For help, check:');
  console.log('- ENV_SETUP_GUIDE.md for credential issues');
  console.log('- IMPLEMENTATION_STEPS.md for detailed setup');
  console.log('- COMPREHENSIVE_FIX_PLAN.md for troubleshooting');
}

console.log('\n🚀 Ready to build something amazing!');
