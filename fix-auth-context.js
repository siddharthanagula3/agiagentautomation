// Fix AuthContext Loading State Issue
import fs from 'fs';

console.log('🔧 FIXING AUTH CONTEXT LOADING STATE');
console.log('====================================');

class AuthContextFixer {
  constructor() {
    this.authContextFile = 'src/contexts/AuthContext.tsx';
  }

  fixAuthContext() {
    console.log('\n📊 STEP 1: Fixing AuthContext Loading State');
    console.log('--------------------------------------------');
    
    try {
      let content = fs.readFileSync(this.authContextFile, 'utf8');
      
      // Replace the entire useEffect with a more robust version
      const newUseEffect = `
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Comprehensive diagnostic for live site
    console.log('🔍 COMPREHENSIVE DIAGNOSTIC FOR LIVE SITE');
    console.log('==========================================');
    
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');
    
    if (supabaseUrl) {
      console.log('URL Value:', supabaseUrl);
      console.log('URL Valid:', !supabaseUrl.includes('your_supabase_url_here'));
      console.log('URL Format:', supabaseUrl.startsWith('https://') ? '✅ Correct' : '❌ Incorrect');
    } else {
      console.log('❌ CRITICAL: VITE_SUPABASE_URL is missing');
    }
    
    if (supabaseKey) {
      console.log('Key Value:', supabaseKey.substring(0, 20) + '...');
      console.log('Key Valid:', !supabaseKey.includes('your_supabase_anon_key_here'));
      console.log('Key Format:', supabaseKey.startsWith('eyJ') ? '✅ Correct' : '❌ Incorrect');
    } else {
      console.log('❌ CRITICAL: VITE_SUPABASE_ANON_KEY is missing');
    }
    
    const hasValidCredentials = supabaseUrl && 
                                supabaseKey && 
                                !supabaseUrl.includes('your_supabase_url_here') && 
                                !supabaseKey.includes('your_supabase_anon_key_here');
    
    console.log('Valid Credentials:', hasValidCredentials ? '✅ Yes' : '❌ No');
    
    if (!hasValidCredentials) {
      console.log('⚠️  MODE: Demo Mode (No Backend)');
      console.log('🎯 CAUSE: Missing or invalid environment variables');
      console.log('🔧 SOLUTION: Configure Netlify environment variables');
      console.log('');
      console.log('📋 NETLIFY SETUP INSTRUCTIONS:');
      console.log('1. Go to https://app.netlify.com');
      console.log('2. Select your site: agiagentautomation');
      console.log('3. Go to Site Settings → Environment Variables');
      console.log('4. Click "Add variable"');
      console.log('5. Add Variable 1:');
      console.log('   Name: VITE_SUPABASE_URL');
      console.log('   Value: https://lywdzvfibhzbljrgovwr.supabase.co');
      console.log('6. Add Variable 2:');
      console.log('   Name: VITE_SUPABASE_ANON_KEY');
      console.log('   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991fDh770PYQRNx3L9va1D_qupbb_j-JynYo2XcTw');
      console.log('7. Click "Save" for each variable');
      console.log('8. Go to Deploys tab');
      console.log('9. Click "Trigger deploy" → "Deploy site"');
      console.log('10. Wait 2-3 minutes for deployment');
    } else {
      console.log('✅ MODE: Production Mode (Real Backend)');
      console.log('🎯 CAUSE: Environment variables are correctly configured');
      console.log('🔧 NEXT: Check for other issues (network, Supabase status, etc.)');
    }

    // If no valid credentials, immediately set loading to false for demo mode
    if (!hasValidCredentials) {
      console.log('No valid Supabase credentials - running in demo mode');
      setLoading(false);
      return;
    }

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        // Set a longer timeout for Supabase connection
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth check timeout - Supabase connection may be slow');
            console.log('Setting loading to false to allow user interaction');
            setLoading(false);
          }
        }, 20000); // 20 second timeout for Supabase connection

        console.log('Attempting to connect to Supabase...');
        const { user: currentUser, error } = await authService.getCurrentUser();
        console.log('AuthService getCurrentUser result:', { hasUser: !!currentUser, hasError: !!error });
        
        if (isMounted) {
          if (currentUser && !error) {
            console.log('✅ User session found:', currentUser.email);
            setUser(currentUser);
          } else if (error) {
            console.log('ℹ️  No active session (this is normal for new users)');
            // Don't treat auth errors as critical - user just needs to login
          } else {
            console.log('ℹ️  No active session - user needs to login');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Supabase connection error:', error);
        console.log('This may be a network or Supabase service issue');
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // Always set loading to false after any attempt
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Only set up auth listener if we have valid credentials
    let subscription: any = null;
    
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
          
          if (isMounted) {
            setLoading(false);
          }
        });
        subscription = data?.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);`;

      // Replace the entire useEffect
      content = content.replace(
        /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
        newUseEffect
      );
      
      fs.writeFileSync(this.authContextFile, content);
      console.log('✅ AuthContext fixed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error fixing AuthContext:', error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting AuthContext fix...');
      
      const success = this.fixAuthContext();
      
      if (success) {
        console.log('\n🎯 AUTH CONTEXT FIX COMPLETED!');
        console.log('==============================');
        console.log('✅ AuthContext loading state fixed');
        console.log('✅ More robust error handling');
        console.log('✅ Better timeout management');
        console.log('✅ Always resolves loading state');
      } else {
        console.log('\n❌ AUTH CONTEXT FIX FAILED!');
        console.log('============================');
        console.log('❌ Could not fix AuthContext');
      }
      
    } catch (error) {
      console.error('❌ AuthContext fix failed:', error.message);
    }
  }
}

// Run the AuthContext fixer
const fixer = new AuthContextFixer();
fixer.run().catch(error => {
  console.error('❌ AuthContext fixer crashed:', error);
});
