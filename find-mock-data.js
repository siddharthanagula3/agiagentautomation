/**
 * Mock Data Detection Script
 * Scans the entire project for mock data patterns
 */

const fs = require('fs');
const path = require('path');

const MOCK_PATTERNS = [
  /const\s+mock\w+\s*=/gi,
  /\/\/\s*mock data/gi,
  /\/\/\s*TODO.*mock/gi,
  /\/\/\s*fake data/gi,
  /\/\/\s*hardcoded/gi,
  /\/\/\s*sample data/gi,
  /const\s+\w+\s*=\s*\[\s*{\s*id:/gi,  // Array of objects with id
  /setStats\(\{\s*\w+:\s*0/gi,  // Setting stats to 0
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage'
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const mockDataFindings = [];

function scanDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        scanDirectory(fullPath, relPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (FILE_EXTENSIONS.includes(ext)) {
        checkFileForMockData(fullPath, relPath);
      }
    }
  }
}

function checkFileForMockData(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const findings = [];
  
  lines.forEach((line, index) => {
    MOCK_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        findings.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
  });
  
  if (findings.length > 0) {
    mockDataFindings.push({
      file: relativePath,
      findings
    });
  }
}

// Scan project
console.log('🔍 Scanning project for mock data...\n');

const projectRoot = process.cwd();
const srcPath = path.join(projectRoot, 'src');

if (fs.existsSync(srcPath)) {
  scanDirectory(srcPath, 'src');
}

// Print results
console.log('📊 Mock Data Detection Results\n');
console.log('='.repeat(80));

if (mockDataFindings.length === 0) {
  console.log('\n✅ No mock data patterns found! Your project is clean.\n');
} else {
  console.log(`\n⚠️  Found ${mockDataFindings.length} files with potential mock data:\n`);
  
  mockDataFindings.forEach(({ file, findings }) => {
    console.log(`\n📄 ${file}`);
    console.log('-'.repeat(80));
    findings.forEach(({ line, content }) => {
      console.log(`   Line ${line}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📝 Summary: ${mockDataFindings.length} files need attention`);
  console.log(`\n💡 Tip: Review each file and replace mock data with real database queries`);
  console.log(`    using analyticsService, automationService, or appropriate service.\n`);
}

// Save results to file
const resultsPath = path.join(projectRoot, 'mock-data-findings.json');
fs.writeFileSync(resultsPath, JSON.stringify(mockDataFindings, null, 2));
console.log(`📁 Detailed results saved to: mock-data-findings.json\n`);
