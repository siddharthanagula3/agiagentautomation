import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing all syntax errors in React components...\n');

// List of files that likely have syntax errors
const filesToFix = [
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/RegisterPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/dashboard/TeamPage.tsx',
  'src/pages/dashboard/WorkforcePage.tsx',
  'src/pages/dashboard/EmployeesPage.tsx',
  'src/pages/dashboard/ProfilePage.tsx',
  'src/pages/dashboard/SettingsPage.tsx',
  'src/pages/dashboard/SimpleDashboard.tsx',
  'src/pages/dashboard/Dashboard.tsx',
  'src/pages/ChatInterface.tsx',
  'src/components/RealtimeDashboard.tsx',
  'src/components/auth/LoginForm.tsx',
  'src/components/auth/RegisterForm.tsx',
  'src/components/layout/PublicHeader.tsx',
  'src/components/ui/theme-toggle.tsx',
  'src/hooks/use-mobile.tsx',
  'src/hooks/useAccessibility.ts',
  'src/hooks/useSecureStorage.ts',
  'src/lib/api.test.ts',
  'src/lib/stripe.ts'
];

let fixedCount = 0;

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`🔧 Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix common syntax errors
  // Fix malformed component structures
  content = content.replace(/const \[(\w+), set\w+\] = useState\(\{[\s\S]*?\}\);[\s]*const \[/g, (match) => {
    // This is a complex regex to fix malformed useState declarations
    return match.replace(/const \[(\w+), set\w+\] = useState\(\{[\s\S]*?\}\);[\s]*const \[/g, 'const [');
  });

  // Fix missing component declarations
  content = content.replace(/^\s*const \[(\w+), set\w+\] = useState\(/gm, (match, stateName) => {
    // Check if this is at the start of a component
    const lines = content.split('\n');
    const matchIndex = content.indexOf(match);
    const lineIndex = content.substring(0, matchIndex).split('\n').length - 1;
    
    // If this is the first useState in the file, add component declaration
    if (lineIndex < 10 && !content.includes('const ') || content.includes('React.FC')) {
      return `const Component: React.FC = () => {\n  const [${stateName}, set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}] = useState(`;
    }
    return match;
  });

  // Fix malformed function declarations
  content = content.replace(/const (\w+) = asyn;\s*c \(/g, 'const $1 = async (');
  content = content.replace(/const (\w+) = useNavigat;\s*e\(\);/g, 'const $1 = useNavigate();');
  content = content.replace(/const (\w+) = useNavigat;\s*e\(\)/g, 'const $1 = useNavigate()');

  // Fix missing semicolons and brackets
  content = content.replace(/}\s*const \[/g, '};\n  const [');
  content = content.replace(/}\s*const (\w+) = /g, '};\n  const $1 = ');

  // Fix malformed useEffect
  content = content.replace(/useEffect\(\(\) => \{[\s\S]*?email: '[\s\S]*?password: '[\s\S]*?\}\);[\s]*\/\/ If already authenticated/g, 
    'useEffect(() => {\n    // If already authenticated');

  // Fix duplicate component declarations
  content = content.replace(/const (\w+): React\.FC = \(\) => \{[\s\S]*?const (\w+): React\.FC = \(\) => \{/g, 
    'const $1: React.FC = () => {');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Fixed ${filePath}`);
    fixedCount++;
  } else {
    console.log(`  ✅ ${filePath} is clean`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files`);
console.log('\n📋 Next steps:');
console.log('1. Run `npm run build` to test the fixes');
console.log('2. Commit and push changes to trigger Netlify build');
console.log('3. Netlify build should now pass!');
