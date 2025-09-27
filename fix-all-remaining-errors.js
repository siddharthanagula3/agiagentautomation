import fs from 'fs';

console.log('🔧 Fixing all remaining syntax errors...\n');

const filesToCheck = [
  'src/pages/dashboard/EmployeesPage.tsx',
  'src/pages/dashboard/JobsPage.tsx',
  'src/pages/dashboard/ResourcesPage.tsx',
  'src/pages/dashboard/ImportPage.tsx',
  'src/pages/dashboard/AnalyticsPage.tsx'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix malformed semicolons and braces
    content = content.replace(/\s+;\s*};/g, ';');
    hasChanges = true;

    // Fix malformed function declarations
    content = content.replace(/(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)/g, (match, p1, p2) => p1 + p2);
    hasChanges = true;

    // Fix malformed component structure
    content = content.replace(/(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+useEffect\(\(\)\s*=>\s*\{)/g, (match, p1, p2) => p1 + p2);
    hasChanges = true;

    // Fix malformed return statements
    content = content.replace(/(\s+return\s+\([^)]*\)\s*;\s*)(\s+};)/g, (match, p1, p2) => p1 + p2);
    hasChanges = true;

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`✅ No issues found: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔍 Checking files for syntax errors...\n');

for (const file of filesToCheck) {
  fixFile(file);
}

console.log('\n🏁 All syntax errors fixed!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run build');
console.log('2. If successful, commit and push');
console.log('3. Check deployment status');
