import React from 'react';
import { useAuthStore } from '../stores/unified-auth-store';

export const DebugPanel: React.FC = () => {
  const authState = useAuthStore();
  
  // Only show in development
  if (import.meta.env.PROD) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <div className="mb-2 font-bold">🔍 Debug Panel</div>
      <div>Auth Initialized: {authState.initialized ? '✅' : '❌'}</div>
      <div>Is Loading: {authState.isLoading ? '⏳' : '✅'}</div>
      <div>Is Authenticated: {authState.isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {authState.user?.email || 'None'}</div>
      <div>Error: {authState.error || 'None'}</div>
      <div>Current Path: {window.location.pathname}</div>
      <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
      <div>Demo Mode: {import.meta.env.VITE_DEMO_MODE || 'false'}</div>
    </div>
  );
};
