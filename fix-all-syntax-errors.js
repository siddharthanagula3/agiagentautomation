import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing all syntax errors...\n');

const filesToFix = [
  'src/pages/dashboard/WorkforcePage.tsx',
  'src/pages/dashboard/EmployeesPage.tsx',
  'src/pages/dashboard/JobsPage.tsx',
  'src/pages/dashboard/ResourcesPage.tsx',
  'src/pages/dashboard/ImportPage.tsx',
  'src/pages/dashboard/AnalyticsPage.tsx',
  'src/pages/auth/RegisterPage.tsx'
];

async function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Fix malformed useState declarations
    const useStatePattern = /(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)/g;
    if (useStatePattern.test(content)) {
      content = content.replace(useStatePattern, (match, p1, p2) => {
        return p1 + p2;
      });
      hasChanges = true;
    }

    // Fix malformed function declarations
    const functionPattern = /(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+useEffect\(\(\)\s*=>\s*\{)/g;
    if (functionPattern.test(content)) {
      content = content.replace(functionPattern, (match, p1, p2) => {
        return p1 + p2;
      });
      hasChanges = true;
    }

    // Fix malformed await statements
    const awaitPattern = /(\s+const\s+result\s*=\s*await;\s*)(\s+[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\);\s*)/g;
    if (awaitPattern.test(content)) {
      content = content.replace(awaitPattern, (match, p1, p2) => {
        const functionCall = p2.trim();
        return `      const result = await ${functionCall}`;
      });
      hasChanges = true;
    }

    // Fix malformed component structure
    const componentPattern = /(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+useEffect\(\(\)\s*=>\s*\{)/g;
    if (componentPattern.test(content)) {
      content = content.replace(componentPattern, (match, p1, p2, p3) => {
        return p1 + p2 + p3;
      });
      hasChanges = true;
    }

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

async function fixAllFiles() {
  console.log('🔍 Checking files for syntax errors...\n');
  
  for (const file of filesToFix) {
    await fixFile(file);
  }
  
  console.log('\n🏁 Syntax error fixing complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Check for any remaining errors');
  console.log('3. Commit and push the fixes');
}

fixAllFiles();
