import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/unified-auth-store';

const AuthDebugger = () => {
  const { isLoading, user } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState({
    authLoading: true,
    hasUser: false,
    supabaseUrl: '',
    supabaseKey: '',
    isDemoMode: false,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    const isDemoMode = !supabaseUrl || 
                       !supabaseKey || 
                       supabaseUrl.includes('your_supabase_url_here') || 
                       supabaseKey.includes('your_supabase_anon_key_here');

    setDebugInfo({
      authLoading: isLoading,
      hasUser: !!user,
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set',
      isDemoMode,
      timestamp: new Date().toISOString()
    });

    console.log('🔍 Auth Debug Info:', {
      loading,
      user,
      isDemoMode,
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set'
    });
  }, [loading, user]);

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-[9999] max-w-sm">
      <div className="mb-1 font-bold text-yellow-300">Auth Debug</div>
      <div>Loading: <span className={loading ? 'text-red-400' : 'text-green-400'}>{loading.toString()}</span></div>
      <div>User: <span className={user ? 'text-green-400' : 'text-gray-400'}>{user ? user.email : 'null'}</span></div>
      <div>Mode: <span className={debugInfo.isDemoMode ? 'text-yellow-400' : 'text-green-400'}>{debugInfo.isDemoMode ? 'Demo' : 'Production'}</span></div>
      <div className="text-gray-400 mt-1">{new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default AuthDebugger;
