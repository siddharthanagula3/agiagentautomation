import fs from 'fs';

console.log('🔧 Fixing WorkforcePage.tsx...\n');

const filePath = 'src/pages/dashboard/WorkforcePage.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the malformed setTimeout
  content = content.replace(
    /const timeout = setTimeou;\s*t\(\(\) => setLoading\(false\), 8000\);/g,
    'const timeout = setTimeout(() => setLoading(false), 8000);'
  );
  
  // Fix malformed function declarations
  content = content.replace(
    /(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+useEffect\(\(\)\s*=>\s*\{)/g,
    (match, p1, p2) => p1 + p2
  );
  
  // Fix malformed useCallback declarations
  content = content.replace(
    /(\s+const\s+\[[^]]+\]\s*=\s*useState\([^)]+\);\s*)(\s+const\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*useCallback\([^)]*\)\s*=>\s*\{)/g,
    (match, p1, p2) => p1 + p2
  );
  
  // Fix malformed if statements
  content = content.replace(
    /(\s+if\s*\([^)]+\)\s*\{)\s*([^}]+)\s*\}/g,
    (match, p1, p2) => p1 + p2 + '}'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed WorkforcePage.tsx');
  
} catch (error) {
  console.error('❌ Error fixing WorkforcePage.tsx:', error.message);
}
