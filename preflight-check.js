#!/usr/bin/env node

/**
 * Pre-Flight Checklist
 * Verifies system is ready for implementation
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 AGI AGENT AUTOMATION - PRE-FLIGHT CHECK\n');
console.log('='.repeat(50));
console.log('\n');

let allChecksPass = true;
const results = [];

// Check 1: Node.js version
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (>= 18 required)`);
  results.push({ check: 'Node.js version', status: 'PASS', detail: nodeVersion });
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Need >= 18)`);
  results.push({ check: 'Node.js version', status: 'FAIL', detail: nodeVersion });
  allChecksPass = false;
}

// Check 2: package.json exists
console.log('\n📄 Checking package.json...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json found');
  results.push({ check: 'package.json', status: 'PASS' });
  
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`   📌 Project: ${packageJson.name} v${packageJson.version}`);
} else {
  console.log('   ❌ package.json not found');
  results.push({ check: 'package.json', status: 'FAIL' });
  allChecksPass = false;
}

// Check 3: node_modules exists
console.log('\n📚 Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules directory exists');
  results.push({ check: 'Dependencies installed', status: 'PASS' });
  
  // Count packages
  const dirs = fs.readdirSync(nodeModulesPath).filter(d => {
    return fs.statSync(path.join(nodeModulesPath, d)).isDirectory() && !d.startsWith('.');
  });
  console.log(`   📦 ${dirs.length} packages installed`);
} else {
  console.log('   ⚠️  node_modules not found - run: npm install');
  results.push({ check: 'Dependencies installed', status: 'WARN', action: 'Run: npm install' });
}

// Check 4: .env file
console.log('\n🔐 Checking .env configuration...');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  results.push({ check: '.env file', status: 'PASS' });
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  // Check for placeholder values
  const checks = {
    'VITE_SUPABASE_URL': false,
    'VITE_SUPABASE_ANON_KEY': false,
    'VITE_ANTHROPIC_API_KEY': false,
    'VITE_GOOGLE_AI_API_KEY': false
  };
  
  envLines.forEach(line => {
    const [key, value] = line.split('=').map(s => s.trim());
    if (checks.hasOwnProperty(key)) {
      const hasValue = value && 
                       value.length > 10 && 
                       !value.includes('placeholder') &&
                       !value.includes('xxxxx') &&
                       !value.includes('your_');
      checks[key] = hasValue;
    }
  });
  
  console.log('\n   🔍 Environment Variables Status:');
  console.log('   ' + '-'.repeat(45));
  
  if (checks.VITE_SUPABASE_URL && checks.VITE_SUPABASE_ANON_KEY) {
    console.log('   ✅ Supabase configured');
    results.push({ check: 'Supabase config', status: 'PASS' });
  } else {
    console.log('   ❌ Supabase NOT configured (placeholder values)');
    results.push({ check: 'Supabase config', status: 'FAIL', action: 'Update .env with real Supabase credentials' });
    allChecksPass = false;
  }
  
  if (checks.VITE_ANTHROPIC_API_KEY || checks.VITE_GOOGLE_AI_API_KEY) {
    const provider = checks.VITE_ANTHROPIC_API_KEY ? 'Anthropic' : 'Google AI';
    console.log(`   ✅ AI API configured (${provider})`);
    results.push({ check: 'AI API key', status: 'PASS', detail: provider });
  } else {
    console.log('   ❌ No AI API keys configured (placeholder values)');
    results.push({ check: 'AI API key', status: 'FAIL', action: 'Add at least one AI API key to .env' });
    allChecksPass = false;
  }
} else {
  console.log('   ❌ .env file not found');
  console.log('   📋 Action: Copy .env.example to .env and configure');
  results.push({ check: '.env file', status: 'FAIL', action: 'Create .env file from .env.example' });
  allChecksPass = false;
}

// Check 5: Critical directories
console.log('\n📁 Checking project structure...');
const criticalDirs = ['src', 'supabase', 'public'];
let dirChecksPass = true;

criticalDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}/ directory exists`);
  } else {
    console.log(`   ❌ ${dir}/ directory missing`);
    dirChecksPass = false;
    allChecksPass = false;
  }
});

results.push({ 
  check: 'Project structure', 
  status: dirChecksPass ? 'PASS' : 'FAIL' 
});

// Check 6: Migration files
console.log('\n🗄️  Checking database migrations...');
const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrationFiles = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
  console.log(`   ✅ ${migrationFiles.length} migration files found`);
  results.push({ check: 'Migration files', status: 'PASS', detail: `${migrationFiles.length} files` });
  
  // List key migrations
  const keyMigrations = [
    '001_initial_schema.sql',
    '003_settings_tables.sql',
    '004_complete_workforce_schema.sql',
    '005_analytics_tables.sql',
    '006_automation_tables.sql'
  ];
  
  const foundMigrations = keyMigrations.filter(m => 
    migrationFiles.some(f => f.includes(m) || f === m)
  );
  
  console.log(`   📊 Key migrations: ${foundMigrations.length}/${keyMigrations.length}`);
} else {
  console.log('   ⚠️  No migrations directory found');
  results.push({ check: 'Migration files', status: 'WARN' });
}

// Check 7: TypeScript config
console.log('\n⚙️  Checking TypeScript configuration...');
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json exists');
  results.push({ check: 'TypeScript config', status: 'PASS' });
} else {
  console.log('   ❌ tsconfig.json missing');
  results.push({ check: 'TypeScript config', status: 'FAIL' });
  allChecksPass = false;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 PRE-FLIGHT CHECK SUMMARY\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warned = results.filter(r => r.status === 'WARN').length;

console.log(`   ✅ Passed: ${passed}`);
if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
if (warned > 0) console.log(`   ⚠️  Warnings: ${warned}`);

console.log('\n' + '-'.repeat(50));

// Action items
const failedChecks = results.filter(r => r.status === 'FAIL' && r.action);
const warnChecks = results.filter(r => r.status === 'WARN' && r.action);

if (failedChecks.length > 0) {
  console.log('\n🔧 REQUIRED ACTIONS:\n');
  failedChecks.forEach((check, i) => {
    console.log(`   ${i + 1}. ${check.action}`);
  });
}

if (warnChecks.length > 0) {
  console.log('\n⚠️  RECOMMENDED ACTIONS:\n');
  warnChecks.forEach((check, i) => {
    console.log(`   ${i + 1}. ${check.action}`);
  });
}

// Final verdict
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('\n✅ PRE-FLIGHT CHECK PASSED!');
  console.log('\n🎯 READY FOR IMPLEMENTATION');
  console.log('\nNext steps:');
  console.log('   1. Run database migrations (see DATABASE_SETUP_COMPLETE.md)');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Test application');
  console.log('\n');
  process.exit(0);
} else {
  console.log('\n❌ PRE-FLIGHT CHECK FAILED');
  console.log('\n⚠️  FIX REQUIRED ISSUES BEFORE CONTINUING');
  console.log('\nSee above for required actions.');
  console.log('\n');
  process.exit(1);
}
