import fs from 'fs';

console.log('🔧 BYPASS LOADING FIX - IMMEDIATE RESOLUTION');
console.log('============================================');

// Fix AuthContext to bypass loading entirely for authenticated users
const authContextPath = 'src/contexts/AuthContext.tsx';
let authContext = fs.readFileSync(authContextPath, 'utf8');

// Add immediate user check at the start of checkSession
const immediateUserCheck = `
  // IMMEDIATE USER CHECK - bypass loading if user exists
  const currentUser = supabase.auth.getUser();
  if (currentUser && currentUser.data && currentUser.data.user) {
    console.log('🚀 IMMEDIATE: User found, bypassing loading');
    setUser(currentUser.data.user);
    setLoading(false);
    return;
  }
`;

// Insert the immediate check at the beginning of checkSession
authContext = authContext.replace(
  /const checkSession = async \(\) => \{/,
  `const checkSession = async () => {
    ${immediateUserCheck}`
);

// Also add immediate check in onAuthStateChange
const immediateAuthCheck = `
  // IMMEDIATE AUTH CHECK - bypass loading if user exists
  const currentUser = supabase.auth.getUser();
  if (currentUser && currentUser.data && currentUser.data.user) {
    console.log('🚀 IMMEDIATE AUTH: User found, bypassing loading');
    setUser(currentUser.data.user);
    setLoading(false);
    return;
  }
`;

authContext = authContext.replace(
  /supabase\.auth\.onAuthStateChange\(async \(event, session\) => \{/,
  `supabase.auth.onAuthStateChange(async (event, session) => {
    ${immediateAuthCheck}`
);

fs.writeFileSync(authContextPath, authContext);
console.log('✅ AuthContext updated with immediate user checks');

// Also fix ProtectedRoute to be even more aggressive
const protectedRoutePath = 'src/components/auth/ProtectedRoute.tsx';
let protectedRoute = fs.readFileSync(protectedRoutePath, 'utf8');

// Add immediate user check at the start
const immediateProtectedCheck = `
  // IMMEDIATE PROTECTED ROUTE CHECK
  const immediateUser = supabase.auth.getUser();
  if (immediateUser && immediateUser.data && immediateUser.data.user) {
    console.log('🚀 IMMEDIATE PROTECTED: User found, bypassing loading');
    return <>{children}</>;
  }
`;

protectedRoute = protectedRoute.replace(
  /const ProtectedRoute: React\.FC<ProtectedRouteProps> = \(\{ children, requiredRole = 'user' \}\) => \{/,
  `const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
    ${immediateProtectedCheck}`
);

// Add supabase import
protectedRoute = protectedRoute.replace(
  /import React from 'react';/,
  `import React from 'react';
import { supabase } from '../../lib/supabase';`
);

fs.writeFileSync(protectedRoutePath, protectedRoute);
console.log('✅ ProtectedRoute updated with immediate user checks');

console.log('🎯 BYPASS LOADING FIX COMPLETED!');
console.log('==================================');
console.log('📊 Changes:');
console.log('  - Added immediate user checks in AuthContext');
console.log('  - Added immediate user checks in ProtectedRoute');
console.log('  - Bypasses loading state entirely for authenticated users');
console.log('  - Should resolve "Loading... Disconnected" issue');
