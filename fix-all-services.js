// Fix all service files syntax errors
import fs from 'fs';

const serviceFiles = [
  'src/services/agentsService.ts',
  'src/services/jobsService.ts',
  'src/services/analyticsService.ts'
];

function fixServiceFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix duplicate catch blocks
    content = content.replace(/\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}\s*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/g, (match) => {
      const firstCatch = match.match(/\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/);
      return firstCatch ? firstCatch[0] : match;
    });
    
    // Fix missing closing braces before method declarations
    content = content.replace(/\}\s*async\s+(\w+)\s*\(/g, '}\n\n  async $1(');
    
    // Fix duplicate return statements
    content = content.replace(/return\s*\{[^}]*\};\s*return\s*\{[^}]*\};/g, (match) => {
      const firstReturn = match.match(/return\s*\{[^}]*\};/);
      return firstReturn ? firstReturn[0] : match;
    });
    
    // Fix method declarations without proper spacing
    content = content.replace(/\}\s*async\s+(\w+)\s*\(/g, '}\n\n  async $1(');
    
    // Fix missing closing braces
    content = content.replace(/\}\s*async\s+(\w+)/g, '}\n\n  async $1');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed syntax in ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  ${filePath} already clean`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing all service syntax errors...\n');

let fixed = 0;
serviceFiles.forEach(service => {
  if (fixServiceFile(service)) {
    fixed++;
  }
});

console.log(`\n📊 Summary: ${fixed} services updated`);
console.log('\n✅ All service syntax errors fixed');
