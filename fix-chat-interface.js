import fs from 'fs';

console.log('🔧 Fixing ChatInterface.tsx...\n');

const filePath = 'src/pages/ChatInterface.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix malformed useEffect
  content = content.replace(
    /(\s+// Apply dark mode\s*)(\s+if\s*\(darkMode\)\s*\{[^}]+\}\s*else\s*\{[^}]+\}\s*)\s*(\}, \[darkMode\]\);/g,
    (match, p1, p2, p3) => {
      return `  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);`;
    }
  );
  
  // Fix malformed useRef declarations
  content = content.replace(
    /(\s+const\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*useRe;\s*)(\s+f<[^>]+>\([^)]+\);)/g,
    (match, p1, p2) => {
      const refName = p1.match(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)/)[1];
      const type = p2.match(/f<([^>]+)>/)[1];
      return `  const ${refName} = useRef<${type}>(null);`;
    }
  );
  
  // Fix malformed component structure
  content = content.replace(
    /(\s+const\s+Component:\s*React\.FC\s*=\s*\(\)\s*=>\s*\{)/g,
    'const ChatInterface: React.FC = () => {'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed ChatInterface.tsx');
  
} catch (error) {
  console.error('❌ Error fixing ChatInterface.tsx:', error.message);
}
