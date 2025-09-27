import fs from 'fs';
import path from 'path';

const serviceFiles = [
  'src/services/agentsService.ts',
  'src/services/jobsService.ts',
  'src/services/analyticsService.ts'
];

function fixDuplicateCatchBlocks(content) {
  // Fix the pattern: } catch (error) { ... } } catch (error) { ... }
  return content.replace(
    /(\s+} catch \(error\) \{\s+[^}]+return[^}]+;\s+\})\s+} catch \(error\) \{\s+console\.error\('Service error:', error\);\s+return[^}]+;\s+\}/g,
    (match, firstCatch) => {
      // Keep only the first catch block but add console.error
      return firstCatch.replace(
        /return \{ data: [^,]+,[^}]+error: '[^']+' \};/,
        (returnMatch) => {
          return `console.error('Service error:', error);\n      ${returnMatch}`;
        }
      );
    }
  );
}

serviceFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Fixing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    content = fixDuplicateCatchBlocks(content);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('✅ All service files fixed!');
