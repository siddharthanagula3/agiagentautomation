import fs from 'fs';
import path from 'path';

console.log('🎯 Fixing remaining syntax errors...\n');

const fixFile = (filePath) => {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix the specific pattern: extra semicolon and malformed component closure
  content = content.replace(/;\s*;\s*};/g, ';');
  content = content.replace(/;\s*};/g, ';');
  content = content.replace(/;\s*export default/g, ';\n\nexport default');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
};

// Get all dashboard files
const getDashboardFiles = () => {
  const files = [];
  const dashboardDir = 'src/pages/dashboard';
  
  if (fs.existsSync(dashboardDir)) {
    const items = fs.readdirSync(dashboardDir);
    for (const item of items) {
      if (item.endsWith('.tsx')) {
        files.push(path.join(dashboardDir, item));
      }
    }
  }
  
  return files;
};

console.log('🔍 Scanning dashboard files...');
const dashboardFiles = getDashboardFiles();

let fixedCount = 0;

// Fix all dashboard files
for (const file of dashboardFiles) {
  console.log(`Checking ${file}...`);
  if (fixFile(file)) {
    console.log(`  ✅ Fixed ${file}`);
    fixedCount++;
  } else {
    console.log(`  ✅ ${file} is clean`);
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files with remaining syntax fixes`);
console.log('\n📋 Next steps:');
console.log('1. Run `npm run build` to test all fixes');
console.log('2. If successful, commit and push to trigger Netlify');
console.log('3. Netlify build should now pass completely!');
