import fs from 'fs';

console.log('🔧 ULTIMATE LOADING FIX - BYPASS ALL LOADING STATES');
console.log('==================================================');

// Fix AuthContext to completely bypass loading states
const authContextPath = 'src/contexts/AuthContext.tsx';
let authContext = fs.readFileSync(authContextPath, 'utf8');

// Replace the entire useEffect with a simplified version
const newUseEffect = `
  useEffect(() => {
    let isMounted = true;

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const hasValidCredentials = supabaseUrl && 
                                supabaseKey && 
                                !supabaseUrl.includes('your_supabase_url_here') && 
                                !supabaseKey.includes('your_supabase_anon_key_here');

    // If no valid credentials, immediately set loading to false for demo mode
    if (!hasValidCredentials) {
      console.log('No valid Supabase credentials - running in demo mode');
      setLoading(false);
      return;
    }

    // ULTIMATE FIX: Set loading to false immediately and check for user
    console.log('🚀 ULTIMATE FIX: Setting loading to false immediately');
    setLoading(false);
    
    // Check for existing user immediately
    const checkUser = async () => {
      try {
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        if (existingUser && isMounted) {
          console.log('🚀 ULTIMATE: User found, setting user state');
          setUser(existingUser);
        }
      } catch (error) {
        console.log('User check failed:', error);
      }
    };
    
    // Run user check
    checkUser();

    // Set up auth state change listener
    if (hasValidCredentials && typeof supabase?.auth?.onAuthStateChange === 'function') {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

          if (session?.user) {
            try {
              const { user: authUser, error } = await authService.getCurrentUser();
              if (authUser && !error && isMounted) {
                setUser(authUser);
              }
            } catch (error) {
              console.error('Error getting user:', error);
            }
          } else {
            setUser(null);
          }
        });
        subscription = data?.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);`;

// Replace the entire useEffect
authContext = authContext.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  newUseEffect
);

fs.writeFileSync(authContextPath, authContext);
console.log('✅ AuthContext updated with ultimate loading fix');

// Also fix ProtectedRoute to be even more aggressive
const protectedRoutePath = 'src/components/auth/ProtectedRoute.tsx';
let protectedRoute = fs.readFileSync(protectedRoutePath, 'utf8');

// Replace the entire ProtectedRoute with a simplified version
const newProtectedRoute = `import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const { user, loading } = useAuth();

  // ULTIMATE FIX: If user exists, allow access immediately
  if (user) {
    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  }

  // ULTIMATE FIX: Only redirect if we're sure there's no user and not loading
  if (!loading && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // ULTIMATE FIX: Show loading only if we're actually loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ULTIMATE FIX: If we reach here, show children (this should not happen)
  return <>{children}</>;
};

export { ProtectedRoute };`;

fs.writeFileSync(protectedRoutePath, newProtectedRoute);
console.log('✅ ProtectedRoute updated with ultimate loading fix');

console.log('🎯 ULTIMATE LOADING FIX COMPLETED!');
console.log('==================================');
console.log('📊 Changes:');
console.log('  - Completely bypassed loading states in AuthContext');
console.log('  - Simplified ProtectedRoute logic');
console.log('  - Should resolve all "Loading... Disconnected" issues');
console.log('  - Pages should now render immediately');
