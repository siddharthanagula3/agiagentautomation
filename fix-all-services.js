import fs from 'fs';

const serviceFiles = [
  'src/services/agentsService.ts',
  'src/services/jobsService.ts',
  'src/services/analyticsService.ts'
];

function fixServiceFile(content) {
  // Fix the pattern where methods are missing closing braces
  // Look for patterns like: } catch (error) { ... } } async methodName(
  let fixed = content;
  
  // Add missing closing braces before async methods
  fixed = fixed.replace(
    /(\s+} catch \(error\) \{\s+[^}]+return[^}]+;\s+\})\s+async (\w+)/g,
    '$1  }\n\n  async $2'
  );
  
  // Fix any remaining issues with method declarations
  fixed = fixed.replace(
    /(\s+} catch \(error\) \{\s+[^}]+return[^}]+;\s+\})\s+(\w+)/g,
    '$1  }\n\n  $2'
  );
  
  return fixed;
}

serviceFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Fixing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    content = fixServiceFile(content);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('✅ All service files fixed!');